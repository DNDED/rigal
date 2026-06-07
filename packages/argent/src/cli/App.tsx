import React, { useState, useEffect, useCallback, useRef } from "react"
import { Box, Text, useInput, useApp, useStdout } from "ink"
import { ArgentEngine, type UIEvent } from "./engine.js"
import { CommandHandler } from "./commands.js"
import { Header } from "../ui/components/Header.js"
import { StatusBar } from "../ui/components/StatusBar.js"
import { ChatView } from "../ui/components/ChatView.js"
import { PromptInput } from "../ui/components/PromptInput.js"
import { PermissionPrompt } from "../ui/components/PermissionPrompt.js"
import { WelcomeScreen } from "../ui/components/WelcomeScreen.js"
import { SetupWizard } from "../ui/components/SetupWizard.js"
import { CommandPalette } from "../ui/components/CommandPalette.js"
import { theme } from "../ui/theme.js"
import type { Message, ToolCall } from "@argent/core"
import type { SwarmTask } from "./swarm.js"

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-3.5-sonnet": { input: 3, output: 15 },
  "claude-3-opus": { input: 15, output: 75 },
  "claude-3.5-haiku": { input: 0.8, output: 4 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gemini-2.5-pro": { input: 1.25, output: 10 },
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "deepseek-v3": { input: 0.27, output: 1.1 },
  "deepseek-r1": { input: 0.55, output: 2.19 },
  "qwen2.5-coder:7b": { input: 0, output: 0 },
}

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0
  return ((tokensIn / 1_000_000) * pricing.input) + ((tokensOut / 1_000_000) * pricing.output)
}

type AppState = "setup" | "ready"

export function App() {
  useApp()
  const { stdout } = useStdout()
  const [appState, setAppState] = useState<AppState>("setup")
  const [ready, setReady] = useState(false)
  const [engine, setEngine] = useState<ArgentEngine | null>(null)
  const [commands, setCommands] = useState<CommandHandler | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [agentName, setAgentName] = useState("build")
  const [agentColor, setAgentColor] = useState<string>(theme.colors.accent)
  const [agentNames, setAgentNames] = useState<string[]>(["build", "plan"])
  const [provider, setProvider] = useState("none")
  const [model, setModel] = useState("none")
  const [tokensIn, setTokensIn] = useState(0)
  const [tokensOut, setTokensOut] = useState(0)
  const [streamTokensIn, setStreamTokensIn] = useState(0)
  const [streamTokensOut, setStreamTokensOut] = useState(0)
  const [latency, setLatency] = useState(0)
  const [cost, setCost] = useState(0)
  const [permissionReq, setPermissionReq] = useState<{ toolName: string; reason: string } | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [workingDir, setWorkingDir] = useState(() => { try { return process.cwd() } catch { return require("os").tmpdir() } })
  const [errors, setErrors] = useState<string[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCall[]>([])
  const [swarmTasks, setSwarmTasks] = useState<SwarmTask[]>([])

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const engineRef = useRef<ArgentEngine | null>(null)

  const terminalWidth = stdout?.columns ?? 80
  const terminalHeight = stdout?.rows ?? 40
  const contentMaxWidth = Math.min(terminalWidth - 4, 100)
  const horizontalPadding = Math.max(0, Math.floor((terminalWidth - contentMaxWidth) / 2))

  useEffect(() => {
    let cwd: string
    try { cwd = process.cwd() } catch { cwd = require("os").tmpdir() }
    const eng = new ArgentEngine(cwd)
    const cmd = new CommandHandler(eng)

    eng.setEventEmitter((event: UIEvent) => {
      switch (event.type) {
        case "message":
          setMessages((prev) => { const next = [...prev, event.message]; return next.length > 500 ? next.slice(-500) : next })
          break
        case "messages_reset":
          setMessages(event.messages)
          setStreamingText("")
          setStreamingToolCalls([])
          setErrors([])
          setPermissionReq(null)
          setIsStreaming(false)
          setIsProcessing(false)
          break
        case "stream_start":
          setStreamingText("")
          setStreamingToolCalls([])
          setStreamTokensIn(0)
          setStreamTokensOut(0)
          setIsStreaming(true)
          setIsProcessing(true)
          break
        case "stream_delta":
          setStreamingText((prev) => prev.length > 20000 ? prev : prev + event.text)
          setStreamTokensOut((prev) => prev + Math.ceil(event.text.length / 4))
          break
        case "stream_stop":
          setIsStreaming(false)
          setIsProcessing(false)
          if (event.usage) {
            setTokensIn((prev) => prev + event.usage!.inputTokens)
            setTokensOut((prev) => prev + event.usage!.outputTokens)
          }
          break
        case "tool_call":
          setStreamingToolCalls((prev) => prev.length < 100 ? [...prev, event.toolCall] : prev)
          break
        case "tool_result":
          setStreamingToolCalls((prev) => prev.filter((tc) => tc.id !== event.toolCallId))
          break
        case "permission_needed":
          if (permissionReq) {
            eng.resolveDeny()
          }
          setPermissionReq({ toolName: event.toolName, reason: event.reason })
          break
        case "permission_denied":
          setStatusMessage(`Permission denied: ${event.toolName}`)
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
          statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 3000)
          break
        case "error":
          setErrors((prev) => { const next = [...prev, event.message]; return next.length > 50 ? next.slice(-50) : next })
          setIsProcessing(false)
          setIsStreaming(false)
          break
        case "status":
          setTokensIn(event.tokensIn)
          setTokensOut(event.tokensOut)
          setLatency(event.latency)
          break
        case "info":
          setStatusMessage(event.message)
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
          statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 4000)
          break
        case "swarm_updated":
          setSwarmTasks([...event.tasks].sort((a, b) => {
            const order: Record<SwarmTask["status"], number> = { running: 0, pending: 1, completed: 2, failed: 3, cancelled: 4 }
            return (order[a.status] ?? 5) - (order[b.status] ?? 5)
          }))
          break
        case "doom_loop_warning":
          setStatusMessage(event.message)
          setIsProcessing(false)
          setIsStreaming(false)
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
          statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 5000)
          break
      }
    })

    const info = eng.getProviderInfo()
    setProvider(info.name)
    setModel(info.model)
    setAgentNames(eng.getAgents().map((a) => a.name))
    setWorkingDir(eng.config.getWorkingDir())

    setEngine(eng)
    engineRef.current = eng
    setCommands(cmd)
    setReady(true)

    if (eng.hasProvider()) {
      setAppState("ready")
    } else {
      setAppState("setup")
    }

    return () => {
      eng.onEvent = () => {}
      eng.sessions.dispose()
      if (eng.swarm) { eng.swarm.onTaskUpdate = null; eng.swarm.cancelAll() }
    }
  }, [])

  useEffect(() => () => { if (statusTimerRef.current) clearTimeout(statusTimerRef.current) }, [])

  useEffect(() => {
    const totalIn = tokensIn + streamTokensIn
    const totalOut = tokensOut + streamTokensOut
    setCost(estimateCost(model, totalIn, totalOut))
  }, [tokensIn, tokensOut, streamTokensIn, streamTokensOut, model])

  const handleSetupComplete = useCallback(
    (providerId: string, apiKey?: string) => {
      if (!engine) return
      const success = engine.setProvider(providerId, apiKey)
      if (success) {
        const info = engine.getProviderInfo()
        setProvider(info.name)
        setModel(info.model)
        if (engine.hasProvider()) {
          setAppState("ready")
          setStatusMessage(`Provider set to ${info.name}`)
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
          statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 3000)
        } else {
          const desc = engine.getCurrentProviderDescriptor()
          if (desc?.authType === "oauth") {
            setStatusMessage(`OAuth authentication required. Use /oauth ${providerId} to authenticate.`)
            if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
            statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 6000)
            setAppState("ready")
          } else {
            setAppState("setup")
          }
        }
      } else {
        setStatusMessage(`Failed to set provider ${providerId}`)
        if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
        statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 3000)
      }
    },
    [engine]
  )

  const handleSubmit = useCallback(
    (text: string) => {
      if (!engine || !commands || isProcessing) return

      setErrors([])
      setStatusMessage("")
      setCommandHistory((prev) => [...prev.slice(-499), text])

      const result = commands.handle(text)
      if (result.handled) {
        if (result.message === "PALETTE_OPEN") {
          setCommandPaletteOpen(true)
          return
        }
        if (result.message === "SETUP_WIZARD") {
          setAppState("setup")
          return
        }
        if (result.message?.startsWith("SETUP_PROVIDER:")) {
          const providerId = result.message.slice("SETUP_PROVIDER:".length)
          handleSetupComplete(providerId)
          return
        }
        if (result.message?.startsWith("CUSTOM_COMMAND:")) {
          const cmdName = result.message.slice("CUSTOM_COMMAND:".length)
          const cmd = engine.config.getCommand(cmdName)
          if (cmd && cmd.instruction) {
            setStreamingText("")
            if (isProcessing) return
            engine.sendMessage(cmd.instruction)
            return
          }
          setStatusMessage(`Command /${cmdName} has no instructions.`)
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
          statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 4000)
          return
        }
        if (result.message?.startsWith("REVIEW_DIFF:")) {
          const reviewPrompt = result.message.slice("REVIEW_DIFF:".length)
          setStreamingText("")
          if (isProcessing) return
          engine.sendMessage(reviewPrompt)
          return
        }
        if (result.message) {
          setStatusMessage(result.message)
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
          statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 4000)
        }
        return
      }

      setStreamingText("")
      engine.sendMessage(text)
    },
    [engine, commands, isProcessing, handleSetupComplete]
  )

  const handlePermission = useCallback(
    (mode: "allow" | "allowOnce" | "deny") => {
      if (!engine) return
      if (mode === "allow") engine.resolveAllow()
      else if (mode === "allowOnce") engine.resolveAllowOnce()
      else engine.resolveDeny()
      setPermissionReq(null)
    },
    [engine]
  )

  const handleCommandPaletteExecute = useCallback(
    (command: string) => {
      setCommandPaletteOpen(false)
      handleSubmit(command)
    },
    [handleSubmit]
  )

  useInput((input, key) => {
    if (!engine || !commands) return

    if (key.ctrl && input === "k") {
      setCommandPaletteOpen(true)
      return
    }

    if (commandPaletteOpen) {
      if (key.escape) {
        setCommandPaletteOpen(false)
      }
      return
    }

    if (permissionReq) {
      if (key.escape) {
        handlePermission("deny")
        return
      }
      if (input === "y") {
        handlePermission("allow")
        return
      }
      if (input === "a") {
        handlePermission("allowOnce")
        return
      }
      if (input === "n") {
        handlePermission("deny")
        return
      }
      return
    }

    if (key.escape && isStreaming) {
      engine.cancelStreaming()
      setIsStreaming(false)
      setIsProcessing(false)
      setStreamingToolCalls([])
      setStatusMessage("Stream cancelled.")
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
      statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 3000)
      return
    }

    if (key.tab) {
      const agents = engine.getAgents().map((a) => a.name)
      const currentIdx = agents.indexOf(agentName)
      const nextIdx = (currentIdx + 1) % agents.length
      const nextAgent = agents[nextIdx]
      if (nextAgent) {
        let agent
        try {
          agent = engine.switchAgent(nextAgent)
        } catch {}
        if (agent) {
          setAgentName(agent.name)
          setAgentColor(agent.color || theme.colors.accent)
          setStatusMessage(`Switched to ${agent.name}`)
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
          statusTimerRef.current = setTimeout(() => { setStatusMessage(""); statusTimerRef.current = null }, 2000)
        }
      }
    }
  })

  const liveTokens = tokensIn + tokensOut

  if (!ready) {
    return (
      <Box padding={1}>
        <Text color={theme.colors.accent}>{theme.chars.diamond}</Text>
        <Text color={theme.colors.text}> Initializing ARGENT...</Text>
      </Box>
    )
  }

  if (appState === "setup") {
    return (
      <SetupWizard
        onComplete={handleSetupComplete}
        onSkip={() => setAppState("ready")}
      />
    )
  }

  return (
    <Box flexDirection="column" height="100%" paddingX={horizontalPadding}>
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onExecute={handleCommandPaletteExecute}
      />

      {!commandPaletteOpen && (
        <>
          <Header
            agentName={agentName}
            agentColor={agentColor}
            agentNames={agentNames}
            maxWidth={contentMaxWidth}
          />

          <Box flexGrow={1} flexDirection="column" paddingY={0}>
            {messages.length === 0 && !isStreaming ? (
              <WelcomeScreen width={terminalWidth} engine={engine!} />
            ) : (
              <ChatView
                messages={messages}
                streamingText={streamingText}
                isStreaming={isStreaming}
                errors={errors}
                streamingToolCalls={streamingToolCalls}
                terminalHeight={terminalHeight}
              />
            )}
          </Box>

          {permissionReq && (
            <PermissionPrompt
              toolName={permissionReq.toolName}
              reason={permissionReq.reason}
            />
          )}

          {statusMessage && (
            <Box paddingX={1} paddingY={0}>
              <Text color={theme.colors.textDim}>{statusMessage}</Text>
            </Box>
          )}

          <PromptInput
            onSubmit={handleSubmit}
            disabled={isProcessing}
            history={commandHistory}
          />

          <StatusBar
            provider={provider}
            model={model}
            tokensIn={tokensIn + streamTokensIn}
            tokensOut={tokensOut + streamTokensOut}
            latency={latency}
            workingDirectory={workingDir}
            isStreaming={isStreaming}
            errorCount={errors.length}
            cost={cost}
          />

          {swarmTasks.length > 0 && (
            <Box
              paddingX={1}
              paddingY={0}
              borderStyle="single"
              borderColor={theme.colors.accentDim}
              flexDirection="row"
              gap={1}
            >
              <Text color={theme.colors.accent}>{theme.chars.diamond}</Text>
              <Text color={theme.colors.textDim}>Swarm:</Text>
              {swarmTasks.slice(0, 3).map((t, i) => (
                <React.Fragment key={t.id}>
                  {i > 0 && <Text color={theme.colors.textMuted}> | </Text>}
                  <Text color={t.status === "running" ? theme.colors.success : theme.colors.warning}>
                    {t.name} [{t.status}]
                  </Text>
                </React.Fragment>
              ))}
              {swarmTasks.length > 3 && (
                <Text color={theme.colors.textMuted}> +{swarmTasks.length - 3} more</Text>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
