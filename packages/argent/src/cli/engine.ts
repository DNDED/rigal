import type { ProviderConfig, Agent, Message, UserMessage, SystemMessage, AssistantMessage, ToolResultMessage, ToolCall, ToolResult } from "@argent/core"
import { ConfigService, SessionService, ToolRegistry, PermissionService } from "@argent/core"
import type { LLMProvider } from "@argent/llm"
import { PROVIDERS, getProvider, OAuthManager, createProviderFromDescriptor, autoDetectProvider as detectProviderFromEnv } from "@argent/integrations"
import type { ProviderDescriptor } from "@argent/integrations"
import { builtinTools, createSwarmTools } from "../tools/index.js"
import { SwarmEngine, type SwarmTask } from "./swarm.js"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import type { ToolDef } from "@argent/core"

export type UIEvent =
  | { type: "message"; message: Message }
  | { type: "messages_reset"; messages: Message[] }
  | { type: "stream_start" }
  | { type: "stream_delta"; text: string }
  | { type: "stream_stop"; usage?: { inputTokens: number; outputTokens: number } }
  | { type: "tool_call"; toolCall: ToolCall }
  | { type: "tool_result"; result: ToolResult; toolCallId: string }
  | { type: "permission_needed"; toolName: string; reason: string }
  | { type: "permission_denied"; toolName: string }
  | { type: "error"; message: string }
  | { type: "status"; tokensIn: number; tokensOut: number; latency: number }
  | { type: "swarm_updated"; tasks: SwarmTask[] }
  | { type: "doom_loop_warning"; message: string }
  | { type: "info"; message: string }

export class ArgentEngine {
  config: ConfigService
  sessions: SessionService
  tools: ToolRegistry
  permissions: PermissionService
  swarm: SwarmEngine
  provider: LLMProvider | null = null
  sessionId: string | null = null
  onEvent: (event: UIEvent) => void = () => {}
  private totalTokensIn = 0
  private totalTokensOut = 0
  private permissionQueue: Array<{ resolve: (v: boolean) => void; sessionId: string; toolName: string; params: Record<string, unknown> }> = []
  private onceAllowed: Set<string> = new Set()
  private oauthManager: OAuthManager
  private currentProviderDescriptor: ProviderDescriptor | null = null
  private abortController: AbortController | null = null
  private systemPromptSent = false
  private consecutiveToolErrors = 0
  private doomLoopWarned = false
  private isRunning = false

  constructor(workingDir?: string) {
    this.config = new ConfigService(workingDir)
    this.sessions = new SessionService()
    this.tools = new ToolRegistry()
    this.permissions = new PermissionService(this.config.getConfig().permission || {})
    this.oauthManager = new OAuthManager()

    this.tools.registerAll(builtinTools)

    this.swarm = new SwarmEngine(this)
    this.tools.registerAll(createSwarmTools(this.swarm, () => this.sessionId || ""))
    this.swarm.onTaskUpdate = () => {
      this.onEvent({ type: "swarm_updated", tasks: this.swarm.getAllStatuses() })
    }

    this.loadCustomTools()

    this.permissions.setHandler(async (req) => {
      this.onEvent({ type: "permission_needed", toolName: req.toolName, reason: req.reason })
      return new Promise((resolve) => {
        this.permissionQueue.push({ resolve, sessionId: req.sessionId, toolName: req.toolName, params: req.params })
      })
    })

    this.autoDetectProvider()
    this.initProvider()
  }

  setEventEmitter(fn: (event: UIEvent) => void): void {
    this.onEvent = fn
  }

  private autoDetectProvider(): void {
    const detected = detectProviderFromEnv(PROVIDERS)
    if (detected) {
      this.currentProviderDescriptor = detected.provider
      this.config.setProvider(this.buildProviderConfig(detected.provider, detected.credentials))
      this.onEvent({ type: "status", tokensIn: 0, tokensOut: 0, latency: 0 })
      return
    }

    const existing = this.config.getProvider()
    if (existing && existing.type !== "none") {
      this.currentProviderDescriptor = this.resolveDescriptor(existing)
    }
  }

  initProvider(): void {
    const pc = this.config.getProvider()
    if (!pc) {
      return
    }

    const desc = this.resolveDescriptor(pc) || this.createDescriptorFromConfig(pc)
    this.currentProviderDescriptor = desc
    try {
      this.provider = createProviderFromDescriptor(desc, {
        apiKey: pc.apiKey,
        oauthToken: desc.authType === "oauth" ? this.oauthManager.getToken(desc.id)?.accessToken : undefined,
        baseUrl: pc.baseUrl,
        model: pc.model,
        headers: pc.headers,
      })
    } catch (err) {
      this.provider = null
      console.error("[argent] Failed to create provider:", err instanceof Error ? err.message : String(err))
    }
  }

  private resolveDescriptor(pc: ProviderConfig): ProviderDescriptor | null {
    if (this.currentProviderDescriptor) return this.currentProviderDescriptor

    if (pc.baseUrl) {
      const byBaseUrl = Object.values(PROVIDERS).find((p) => p.baseUrl === pc.baseUrl)
      if (byBaseUrl) return byBaseUrl
    }

    const byType = pc.type ? getProvider(pc.type) : undefined
    if (byType) return byType

    if (pc.model) {
      const byModel = Object.values(PROVIDERS).find((p) => p.models.includes(pc.model || ""))
      if (byModel) return byModel
    }

    if (pc.type === "openai-compatible") return getProvider("custom") || null

    return null
  }

  setProvider(providerId: string, apiKey?: string): boolean {
    const desc = getProvider(providerId)
    if (!desc) return false

    this.currentProviderDescriptor = desc

    const key = apiKey || (desc.envVars[0] ? process.env[desc.envVars[0]] || "" : "")
    const oauthToken = desc.authType === "oauth" ? this.oauthManager.getToken(desc.id)?.accessToken : undefined

    this.config.setProvider(this.buildProviderConfig(desc, {
      apiKey: key,
      oauthToken,
    }))

    this.initProvider()
    return true
  }

  clearSession(): void {
    if (this.isRunning) return
    const sid = this.sessionId
    this.drainPermissionQueue()
    this.sessionId = null
    this.systemPromptSent = false
    this.permissions.reset(sid ?? undefined)
    this.onceAllowed.clear()
    this.onEvent({ type: "messages_reset", messages: [] })
  }

  resumeSession(sessionId: string): boolean {
    if (this.isRunning) return false
    const session = this.sessions.get(sessionId)
    if (!session) return false

    this.sessionId = sessionId
    this.systemPromptSent = false
    this.drainPermissionQueue()
    this.permissions.reset(this.sessionId)
    this.onceAllowed.clear()

    const msgs = this.sessions.getMessages(sessionId)
    this.onEvent({ type: "messages_reset", messages: msgs })
    return true
  }

  setModel(modelName: string): void {
    const pc = this.config.getProvider()
    if (!pc) return
    this.config.setProvider({
      ...pc,
      model: modelName,
      type: pc.type || "openai",
    })
    this.initProvider()
  }

  getAvailableModels(): string[] {
    if (this.currentProviderDescriptor) {
      return this.currentProviderDescriptor.models
    }
    const pc = this.config.getProvider()
    if (!pc) return []
    const desc = Object.values(PROVIDERS).find((p) => p.models.includes(pc.model || ""))
    return desc?.models || []
  }

  getCurrentProviderDescriptor(): ProviderDescriptor | null {
    return this.currentProviderDescriptor
  }

  getCurrentProviderId(): string | null {
    return this.currentProviderDescriptor?.id || null
  }

  getOAuthManager(): OAuthManager {
    return this.oauthManager
  }

  getTotalTokensIn(): number { return this.totalTokensIn }
  getTotalTokensOut(): number { return this.totalTokensOut }

  emitErrorMessage(msg: string): void {
    this.onEvent({ type: "error", message: msg })
  }

  emitInfoMessage(msg: string): void {
    this.onEvent({ type: "info", message: msg })
  }

  hasProvider(): boolean {
    const pc = this.config.getProvider()
    if (!pc) return false
    if (this.currentProviderDescriptor?.authType === "oauth") {
      if (pc.apiKey && pc.apiKey.length > 0) return true
      return this.oauthManager.getToken(this.currentProviderDescriptor.id) !== undefined
    }
    if (this.currentProviderDescriptor?.authType === "none") return true
    return !!(pc.apiKey && pc.apiKey.length > 0)
  }

  getAgent(): Agent | undefined {
    if (!this.sessionId) return this.config.getAgent("build")
    const session = this.sessions.get(this.sessionId)
    if (!session) return this.config.getAgent("build")
    return this.config.getAgent(session.agentName) || this.config.getAgent("build")
  }

  getAgents(): Agent[] {
    return this.config.getAgents()
  }

  switchAgent(name: string): Agent | undefined {
    const agent = this.config.getAgent(name)
    if (!agent) return undefined
    if (this.sessionId) this.sessions.switchAgent(this.sessionId, name)
    return agent
  }

  getProviderInfo(): { name: string; model: string } {
    const pc = this.config.getProvider()
    const descName = this.currentProviderDescriptor?.name
    return {
      name: descName || pc?.type || "none",
      model: pc?.model || "unknown",
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (this.isRunning) {
      this.onEvent({ type: "error", message: "Already processing a message." })
      return
    }
    this.isRunning = true

    if (!this.provider) {
      this.initProvider()
      if (!this.provider || !this.hasProvider()) {
        this.onEvent({ type: "error", message: "No AI provider configured. Type /setup to choose a provider. Run a local model with Ollama for free (no API key needed): curl -fsSL https://ollama.com/install.sh | sh" })
        this.isRunning = false
        return
      }
    }

    this.abortController = new AbortController()

    if (!this.sessionId) {
      const agent = this.getAgent() || this.config.getAgent("build")!
      const pc = this.config.getProvider()!
      const session = this.sessions.create(
        agent.name,
        { provider: pc.type, model: pc.model || "" },
        this.config.getWorkingDir()
      )
      this.sessionId = session.id
      this.systemPromptSent = false
    }

    const agent = this.getAgent()!

    const userMsg: UserMessage = {
      role: "user",
      content: [{ type: "text", text }],
    }
    this.sessions.addMessage(this.sessionId, userMsg)
    this.onEvent({ type: "message", message: userMsg })

    this.consecutiveToolErrors = 0
    this.doomLoopWarned = false

    try {
      await this.runAgentLoop(agent)
    } finally {
      this.isRunning = false
      this.abortController = null
    }
  }

  cancelStreaming(): void {
    if (!this.isRunning) return
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
      this.onEvent({ type: "stream_stop" })
    }
  }

  undoLastExchange(): boolean {
    if (this.isRunning) return false
    if (!this.sessionId) return false
    const undone = this.sessions.undo(this.sessionId)
    if (!undone) return false
    this.systemPromptSent = false
    const msgs = this.sessions.getMessages(this.sessionId)
    this.onEvent({ type: "messages_reset", messages: msgs })
    return true
  }

  private async runAgentLoop(agent: Agent): Promise<void> {
    const sessionId = this.sessionId!
    const maxLoops = 25
    let loopCount = 0

    while (loopCount < maxLoops) {
      loopCount++
      const messages = this.sessions.getMessages(sessionId)

      let allMsgs: Message[]
      if (!this.systemPromptSent) {
        const systemMsg = this.buildSystemMessage(agent)
        allMsgs = [
          { role: "user", content: [{ type: "text", text: systemMsg }] } as UserMessage,
          ...messages,
        ]
        this.systemPromptSent = true
      } else {
        allMsgs = messages
      }

      const allowedTools = this.tools.listAllowed(agent.tools)
      const toolDefs = allowedTools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))

      this.onEvent({ type: "stream_start" })

      const startTime = Date.now()
      let fullText = ""
      let toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = []

      try {
        if (!this.abortController) this.abortController = new AbortController()
        const stream = this.provider!.stream(allMsgs, toolDefs.length > 0 ? toolDefs : undefined, undefined, this.abortController!.signal)

        for await (const event of stream) {
          if (event.type === "start") continue

          if (event.type === "delta") {
            if (fullText.length < 100000) fullText += event.text
            this.onEvent({ type: "stream_delta", text: event.text })
          }

          if (event.type === "tool_call") {
            let args: Record<string, unknown> = {}
            try {
              args = JSON.parse(event.toolCall.arguments)
            } catch {
              args = {}
            }
            const tc = { id: event.toolCall.id, name: event.toolCall.name, arguments: args }
            toolCalls.push(tc)
            this.onEvent({ type: "tool_call", toolCall: tc })
          }

          if (event.type === "stop") {
            this.totalTokensIn += event.usage?.inputTokens || 0
            this.totalTokensOut += event.usage?.outputTokens || 0
            const latency = Date.now() - startTime
            this.onEvent({
              type: "stream_stop",
              usage: { inputTokens: event.usage?.inputTokens || 0, outputTokens: event.usage?.outputTokens || 0 },
            })
            this.onEvent({ type: "status", tokensIn: this.totalTokensIn, tokensOut: this.totalTokensOut, latency })
          }

          if (event.type === "error") {
            this.onEvent({ type: "stream_stop" })
            this.onEvent({ type: "error", message: event.error })
            return
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          this.onEvent({ type: "stream_stop" })
          return
        }
        this.onEvent({ type: "stream_stop" })
        this.onEvent({ type: "error", message: err instanceof Error ? err.message : String(err) })
        return
      }

      const assistantMsg: AssistantMessage = {
        role: "assistant",
        content: fullText ? [{ type: "text", text: fullText }] : [],
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      }
      try { this.sessions.addMessage(sessionId, assistantMsg) } catch { console.error("[argent] Failed to add assistant message to session") }
      this.onEvent({ type: "message", message: assistantMsg })

      if (toolCalls.length === 0) return

      const parallelTools = new Set(["read", "grep", "glob"])
      const sequentialCalls: typeof toolCalls = []
      const parallelCalls: typeof toolCalls = []

      for (const tc of toolCalls) {
        if (parallelTools.has(tc.name)) {
          parallelCalls.push(tc)
        } else {
          sequentialCalls.push(tc)
        }
      }

      if (parallelCalls.length > 0) {
        const results = await Promise.all(
          parallelCalls.map(async (tc) => {
            const allowed = await this.permissions.check(tc.name, tc.arguments, sessionId)
            if (!allowed) {
              this.onEvent({ type: "permission_denied", toolName: tc.name })
              return { tc, allowed: false }
            }
            const ctx = {
              sessionId,
              workingDirectory: this.config.getWorkingDir(),
              agentName: agent.name,
              signal: this.abortController?.signal,
            }
            const result = await this.tools.execute(tc.name, tc.arguments, ctx)
            this.onEvent({ type: "tool_result", result, toolCallId: tc.id })
            return { tc, allowed: true, result }
          })
        )
        for (const r of results) {
          const onceKey = `${sessionId}:${r.tc.name}`
          if (this.onceAllowed.has(onceKey)) {
            this.permissions.clearDecision(sessionId, r.tc.name)
            this.onceAllowed.delete(onceKey)
          }
          const toolMsg: ToolResultMessage = {
            role: "tool",
            toolCallId: r.tc.id,
            content: r.allowed ? r.result!.content : [{ type: "text" as const, text: `Permission denied for tool "${r.tc.name}"` }],
            isError: r.allowed ? r.result!.isError : true,
          }
          try { this.sessions.addMessage(sessionId, toolMsg) } catch { console.error("[argent] Failed to add tool result to session") }
          this.trackToolResult(toolMsg.isError, !r.allowed)
        }
      }

      for (const tc of sequentialCalls) {
        const allowed = await this.permissions.check(tc.name, tc.arguments, sessionId)
        if (!allowed) {
          this.onEvent({ type: "permission_denied", toolName: tc.name })
          const errMsg: ToolResultMessage = {
            role: "tool",
            toolCallId: tc.id,
            content: [{ type: "text", text: `Permission denied for tool "${tc.name}"` }],
            isError: true,
          }
          try { this.sessions.addMessage(sessionId, errMsg) } catch { console.error("[argent] Failed to add error message to session") }
          this.trackToolResult(true, true)
          continue
        }

        const ctx = {
          sessionId,
          workingDirectory: this.config.getWorkingDir(),
          agentName: agent.name,
          signal: this.abortController?.signal,
        }

        const result = await this.tools.execute(tc.name, tc.arguments, ctx)
        this.onEvent({ type: "tool_result", result, toolCallId: tc.id })

        const onceKey = `${sessionId}:${tc.name}`
        if (this.onceAllowed.has(onceKey)) {
          this.permissions.clearDecision(sessionId, tc.name)
          this.onceAllowed.delete(onceKey)
        }

        const toolMsg: ToolResultMessage = {
          role: "tool",
          toolCallId: tc.id,
          content: result.content,
          isError: result.isError,
        }
        try { this.sessions.addMessage(sessionId, toolMsg) } catch { console.error("[argent] Failed to add tool result to session") }
        this.trackToolResult(toolMsg.isError)
      }
    }

    this.onEvent({ type: "error", message: "Maximum agent loop iterations (25) reached." })
  }

  private trackToolResult(isError: boolean | undefined, isDenied = false): void {
    if (isError && !isDenied) {
      this.consecutiveToolErrors++
    } else {
      this.consecutiveToolErrors = 0
    }

    if (this.consecutiveToolErrors >= 3 && !this.doomLoopWarned) {
      this.doomLoopWarned = true
      this.onEvent({
        type: "doom_loop_warning",
        message: `3 consecutive tool errors detected. The agent may be stuck. Press 'n' to abort or continue sending to override.`,
      })
    }
  }

  resolveAllow(): void {
    if (this.permissionQueue.length === 0) return
    const next = this.permissionQueue.shift()
    if (next) {
      this.permissions.allow(next.sessionId, next.toolName, next.params)
      next.resolve(true)
    }
  }

  resolveAllowOnce(): void {
    if (this.permissionQueue.length === 0) return
    const next = this.permissionQueue.shift()
    if (next) {
      this.onceAllowed.add(`${next.sessionId}:${next.toolName}`)
      this.permissions.allow(next.sessionId, next.toolName, next.params)
      next.resolve(true)
    }
  }

  resolveDeny(): void {
    if (this.permissionQueue.length === 0) return
    const next = this.permissionQueue.shift()
    if (next) {
      this.permissions.deny(next.sessionId, next.toolName, next.params)
      next.resolve(false)
    }
  }

  private drainPermissionQueue(): void {
    while (this.permissionQueue.length > 0) {
      const orphan = this.permissionQueue.shift()
      if (orphan) orphan.resolve(false)
    }
  }

  private buildProviderConfig(
    descriptor: ProviderDescriptor,
    credentials: {
      apiKey?: string
      oauthToken?: string
      baseUrl?: string
      model?: string
      headers?: Record<string, string>
    }
  ): ProviderConfig {
    return {
      type: this.getProviderType(descriptor),
      apiKey: credentials.oauthToken || credentials.apiKey || "",
      model: credentials.model || descriptor.defaultModel,
      baseUrl: credentials.baseUrl || descriptor.baseUrl,
      headers: {
        ...(descriptor.headers || {}),
        ...(credentials.headers || {}),
      },
    }
  }

  private getProviderType(descriptor: ProviderDescriptor): ProviderConfig["type"] {
    if (descriptor.transport === "anthropic-native") return "anthropic"
    if (descriptor.transport === "gemini" || descriptor.transport === "gemini-native") return "gemini"
    if (descriptor.id === "ollama") return "ollama"
    if (descriptor.transport === "custom") return "openai-compatible"
    return "openai"
  }

  private createDescriptorFromConfig(pc: ProviderConfig): ProviderDescriptor {
    const model = pc.model || (pc.type === "anthropic" ? "claude-sonnet-4-20250514" : pc.type === "gemini" ? "gemini-2.5-pro" : pc.type === "ollama" ? "qwen2.5-coder:7b" : "gpt-4o")

    let transport: ProviderDescriptor["transport"] = "openai-compatible"
    if (pc.type === "anthropic") transport = "anthropic-native"
    else if (pc.type === "gemini") transport = "gemini-native"
    else if (pc.type === "openai-compatible") transport = "custom"

    return {
      id: pc.type || "custom",
      name: pc.type || "Custom",
      vendor: pc.type || "Custom",
      transport,
      authType: pc.type === "ollama" ? "none" : "api-key",
      envVars: [],
      baseUrl: pc.baseUrl,
      defaultModel: model,
      models: [model],
      headers: pc.headers,
    }
  }

  rewindToCheckpoint(index: number): boolean {
    if (this.isRunning) return false
    if (!this.sessionId) return false
    const success = this.sessions.rewindToUserMessage(this.sessionId, index)
    if (success) {
      this.systemPromptSent = false
      const msgs = this.sessions.getMessages(this.sessionId)
      this.onEvent({ type: "messages_reset", messages: msgs })
    }
    return success
  }

  private async loadCustomTools(): Promise<void> {
    const dirs = [
      join(homedir(), ".argent", "tool"),
      join(this.config.getWorkingDir(), ".argent", "tool"),
    ]

    for (const dir of dirs) {
      let entries: string[]
      try {
        entries = readdirSync(dir)
      } catch {
        continue
      }

      for (const entry of entries) {
        if (!entry.endsWith(".js") && !entry.endsWith(".mjs")) continue
        const fullPath = join(dir, entry)
        try {
          const mod = (await import(fullPath)) as {
            default?: ToolDef | ToolDef[]
            [key: string]: unknown
          }

          if (mod.default) {
            if (Array.isArray(mod.default)) {
              for (const tool of mod.default) {
                if (this.isToolDef(tool)) this.tools.register(tool)
              }
            } else if (this.isToolDef(mod.default)) {
              this.tools.register(mod.default)
            }
          }

          for (const value of Object.values(mod)) {
            if (value && typeof value === "object" && this.isToolDef(value as ToolDef)) {
              const tool = value as ToolDef
              if (!this.tools.get(tool.name)) {
                this.tools.register(tool)
              }
            }
          }
        } catch (err) {
          console.error("[argent] Failed to load custom tool " + fullPath + ":", err instanceof Error ? err.message : String(err))
        }
      }
    }
  }

  private isToolDef(value: unknown): value is ToolDef {
    if (!value || typeof value !== "object") return false
    const t = value as Record<string, unknown>
    return typeof t.name === "string" && typeof t.execute === "function"
  }

  private buildSystemMessage(agent: Agent): string {
    const parts: string[] = []

    if (this.sessionId) {
      const session = this.sessions.get(this.sessionId)
      if (session?.metadata?.summary) {
        parts.push(`Previous conversation summary:\n${session.metadata.summary}`)
        parts.push("")
      }
    }

    const wd = this.config.getWorkingDir()
    const memoryPath = `${wd}/MEMORY.md`
    if (existsSync(memoryPath)) {
      try {
        const memoryContent = readFileSync(memoryPath, "utf-8")
        if (memoryContent.trim()) {
          parts.push(`Persistent project memory (${memoryPath}):`)
          parts.push(memoryContent.trim())
          parts.push("")
        }
      } catch {}
    }

    parts.push(agent.systemPrompt)

    parts.push(`\nCurrent date: ${new Date().toISOString().split("T")[0]}`)
    parts.push(`Working directory: ${wd}`)

    const allowed = this.tools.listAllowed(agent.tools)
    parts.push(`\nAvailable tools: ${allowed.map((t) => t.name).join(", ")}`)

    return parts.join("\n")
  }
}
