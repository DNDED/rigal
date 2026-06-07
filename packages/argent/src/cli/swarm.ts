import type { Agent, ToolContext, ToolResultMessage, ToolResult, UserMessage, AssistantMessage } from "@argent/core"
import type { LLMProvider } from "@argent/llm"
import { createProviderFromDescriptor, PROVIDERS, getProvider } from "@argent/integrations"
import type { ProviderDescriptor } from "@argent/integrations"
import type { ArgentEngine } from "./engine.js"

export interface SwarmTask {
  id: string
  name: string
  description: string
  agentType: string
  model?: string
  maxSteps?: number
  timeoutMs?: number
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  output: string
  startTime?: number
  endTime?: number
  error?: string
}

let taskCounter = 0
let completionCounter = 0

export class SwarmEngine {
  private tasks: Map<string, SwarmTask> = new Map()
  private runningTasks: Map<string, AbortController> = new Map()
  private engine: ArgentEngine
  onTaskUpdate: (() => void) | null = null

  constructor(engine: ArgentEngine) {
    this.engine = engine
  }

  private emitUpdate(): void {
    if (this.onTaskUpdate) this.onTaskUpdate()
  }

  private pruneOldTasks(): void {
    if (this.tasks.size <= 100) return
    const entries = Array.from(this.tasks.entries())
    const sorted = entries.sort(([, a], [, b]) => (b.startTime ?? 0) - (a.startTime ?? 0))
    this.tasks = new Map(sorted.slice(0, 100))
  }

  spawn(tasks: Omit<SwarmTask, "id" | "status" | "output">[]): SwarmTask[] {
    const created = tasks.map((t) => {
      const id = `swarm-${Date.now()}-${++taskCounter}`
      const task: SwarmTask = {
        id,
        name: t.name,
        description: t.description,
        agentType: t.agentType,
        model: t.model,
        maxSteps: t.maxSteps,
        timeoutMs: t.timeoutMs,
        status: "pending",
        output: "",
      }
      this.tasks.set(id, task)
      return task
    })
    this.emitUpdate()
    return created
  }

  async execute(taskId: string, sessionId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)

    if (task.status === "running" || task.status === "cancelled") return

    const controller = new AbortController()
    this.runningTasks.set(taskId, controller)

    task.status = "running"
    task.startTime = Date.now()
    this.emitUpdate()

    const subSession = this.engine.sessions.create(
      task.agentType,
      { provider: "openai", model: task.model || "" },
      this.engine.config.getWorkingDir()
    )

    try {
      const agent = this.engine.config.getAgent(task.agentType)
      if (!agent) throw new Error(`Agent "${task.agentType}" not found`)

      const userMsg: UserMessage = {
        role: "user",
        content: [{ type: "text", text: task.description }],
      }
      this.engine.sessions.addMessage(subSession.id, userMsg)

      const provider = this.createTaskProvider(task.model)

      const output = await this.runSwarmAgentLoop(
        subSession.id,
        agent,
        provider,
        controller.signal,
        task.maxSteps
      )

      task.output = output
      task.status = "completed"
    } catch (err) {
      if (controller.signal.aborted) {
        task.status = "cancelled"
        task.error = "Cancelled"
      } else {
        task.status = "failed"
        task.error = err instanceof Error ? err.message : String(err)
      }
    } finally {
      task.endTime = Date.now()
      this.runningTasks.delete(taskId)
      this.engine.sessions.delete(subSession.id)
      this.emitUpdate()
      completionCounter++
      if (completionCounter % 10 === 0) this.pruneOldTasks()
    }
  }

  async executeAll(taskIds: string[], sessionId: string): Promise<void> {
    await Promise.allSettled(taskIds.map((id) => this.execute(id, sessionId)))
  }

  cancel(taskId: string): void {
    const controller = this.runningTasks.get(taskId)
    if (controller) {
      controller.abort()
    }
    const task = this.tasks.get(taskId)
    if (task && task.status === "pending") {
      task.status = "cancelled"
      this.emitUpdate()
    }
  }

  cancelAll(): void {
    for (const taskId of this.runningTasks.keys()) {
      this.cancel(taskId)
    }
  }

  getStatus(taskId: string): SwarmTask | undefined {
    return this.tasks.get(taskId)
  }

  getAllStatuses(): SwarmTask[] {
    return Array.from(this.tasks.values())
  }

  getOutput(taskId: string): string {
    const task = this.tasks.get(taskId)
    if (!task) return "Task not found."
    if (task.status === "pending" || task.status === "running") return "Task still running..."
    if (task.error) return `Error: ${task.error}`
    return task.output || "No output produced."
  }

  private createTaskProvider(overrideModel?: string): LLMProvider {
    const pc = this.engine.config.getProvider()
    if (!pc) throw new Error("No provider configured")

    const desc = this.engine.getCurrentProviderDescriptor() || this.resolveDescriptor(pc)
    const model = overrideModel || pc.model || desc.defaultModel

    return createProviderFromDescriptor(desc, {
      apiKey: pc.apiKey,
      oauthToken: desc.authType === "oauth" ? this.engine.getOAuthManager().getToken(desc.id)?.accessToken : undefined,
      baseUrl: pc.baseUrl,
      model,
      headers: pc.headers,
    })
  }

  private resolveDescriptor(pc: { type: string; baseUrl?: string; model?: string }): ProviderDescriptor {
    const byType = pc.type ? getProvider(pc.type) : undefined
    if (byType) return byType

    if (pc.baseUrl) {
      const byBase = Object.values(PROVIDERS).find((p) => p.baseUrl === pc.baseUrl)
      if (byBase) return byBase
    }

    if (pc.type === "openai-compatible") return getProvider("custom")!

    const model = pc.model || "gpt-4o"
    const transport = pc.type === "anthropic" ? "anthropic-native" as const
      : pc.type === "gemini" ? "gemini-native" as const
      : pc.type === "ollama" ? "openai-compatible" as const
      : "openai-compatible" as const

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
    }
  }

  private async runSwarmAgentLoop(
    sessionId: string,
    agent: Agent,
    provider: LLMProvider,
    signal: AbortSignal,
    maxSteps?: number
  ): Promise<string> {
    const maxLoops = maxSteps || 25
    let loopCount = 0
    let finalOutput = ""

    while (loopCount < maxLoops) {
      loopCount++

      if (signal.aborted) throw new Error("Cancelled")

      const messages = this.engine.sessions.getMessages(sessionId)
      const systemMsg = this.buildSystemMessage(agent)

      const allMsgs = [
        { role: "user", content: [{ type: "text", text: systemMsg }] } as UserMessage,
        ...messages,
      ]

      const allowedTools = this.engine.tools.listAllowed(agent.tools)
      const toolDefs = allowedTools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))

      const response = await provider.chat(allMsgs, toolDefs.length > 0 ? toolDefs : undefined)

      const fullText = response.text
      const toolCalls = response.toolCalls || []

      if (fullText) finalOutput = fullText

      const assistantMsg: AssistantMessage = {
        role: "assistant",
        content: fullText ? [{ type: "text", text: fullText }] : [],
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      }
      this.engine.sessions.addMessage(sessionId, assistantMsg)

      if (toolCalls.length === 0) break

      for (const tc of toolCalls) {
        const ctx: ToolContext = {
          sessionId,
          workingDirectory: this.engine.config.getWorkingDir(),
          agentName: agent.name,
          signal,
        }

        const allowed = await this.engine.permissions.check(tc.name, tc.arguments, sessionId)
        let result: ToolResult
        if (!allowed) {
          this.engine.onEvent({ type: "permission_denied", toolName: tc.name })
          result = { content: [{ type: "text", text: `Permission denied for tool "${tc.name}"` }], isError: true }
        } else {
          result = await this.engine.tools.execute(tc.name, tc.arguments, ctx)
        }

        const toolMsg: ToolResultMessage = {
          role: "tool",
          toolCallId: tc.id,
          content: result.content,
          isError: result.isError,
        }
        this.engine.sessions.addMessage(sessionId, toolMsg)
      }
    }

    return finalOutput
  }

  private buildSystemMessage(agent: Agent): string {
    const parts = [agent.systemPrompt]
    parts.push(`\nCurrent date: ${new Date().toISOString().split("T")[0]}`)
    parts.push(`Working directory: ${this.engine.config.getWorkingDir()}`)
    const allowed = this.engine.tools.listAllowed(agent.tools)
    parts.push(`\nAvailable tools: ${allowed.map((t) => t.name).join(", ")}`)
    return parts.join("\n")
  }
}
