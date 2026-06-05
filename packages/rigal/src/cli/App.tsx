import React, { useState, useEffect, useCallback } from "react"
import { Box, Text, useInput, useApp } from "ink"
import { RigalEngine, type UIEvent } from "./engine.js"
import { CommandHandler } from "./commands.js"
import { Header } from "../ui/components/Header.js"
import { StatusBar } from "../ui/components/StatusBar.js"
import { ChatView } from "../ui/components/ChatView.js"
import { PromptInput } from "../ui/components/PromptInput.js"
import { PermissionPrompt } from "../ui/components/PermissionPrompt.js"
import { WelcomeScreen } from "../ui/components/WelcomeScreen.js"
import { SetupWizard } from "../ui/components/SetupWizard.js"
import { theme } from "../ui/theme.js"
import type { Message, ToolCall, ToolResult, Agent } from "@rigal/core"

type AppState = "setup" | "ready"

export function App() {
  const { exit } = useApp()
  const [appState, setAppState] = useState<AppState>("setup")
  const [ready, setReady] = useState(false)
  const [engine, setEngine] = useState<RigalEngine | null>(null)
  const [commands, setCommands] = useState<CommandHandler | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [agentName, setAgentName] = useState("build")
  const [agentColor, setAgentColor] = useState<string>(theme.colors.accent)
  const [agentNames, setAgentNames] = useState<string[]>(["build", "plan", "explore"])
  const [provider, setProvider] = useState("none")
  const [model, setModel] = useState("none")
  const [tokensIn, setTokensIn] = useState(0)
  const [tokensOut, setTokensOut] = useState(0)
  const [latency, setLatency] = useState(0)
  const [permissionReq, setPermissionReq] = useState<{ toolName: string; reason: string } | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [workingDir, setWorkingDir] = useState(process.cwd())

  useEffect(() => {
    const eng = new RigalEngine(process.cwd())
    const cmd = new CommandHandler(eng)

    eng.setEventEmitter((event: UIEvent) => {
      switch (event.type) {
        case "message":
          setMessages((prev) => [...prev, event.message])
          break
        case "stream_start":
          setStreamingText("")
          setIsStreaming(true)
          setIsProcessing(true)
          break
        case "stream_delta":
          setStreamingText((prev) => prev + event.text)
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
          break
        case "tool_result":
          break
        case "permission_needed":
          setPermissionReq({ toolName: event.toolName, reason: event.reason })
          break
        case "permission_denied":
          setStatusMessage(`Permission denied: ${event.toolName}`)
          setTimeout(() => setStatusMessage(""), 3000)
          break
        case "error":
          setStatusMessage(`Error: ${event.message}`)
          setIsProcessing(false)
          setIsStreaming(false)
          setTimeout(() => setStatusMessage(""), 5000)
          break
        case "status":
          setTokensIn(event.tokensIn)
          setTokensOut(event.tokensOut)
          setLatency(event.latency)
          break
      }
    })

    const info = eng.getProviderInfo()
    setProvider(info.name)
    setModel(info.model)
    setAgentNames(eng.getAgents().map((a) => a.name))
    setWorkingDir(eng.config.getWorkingDir())

    setEngine(eng)
    setCommands(cmd)
    setReady(true)

    if (eng.hasProvider()) {
      setAppState("ready")
    } else {
      setAppState("setup")
    }
  }, [])

  const handleSetupComplete = useCallback(
    (providerId: string, apiKey?: string) => {
      if (!engine) return
      const success = engine.setProvider(providerId, apiKey)
      if (success) {
        const info = engine.getProviderInfo()
        setProvider(info.name)
        setModel(info.model)
        setAppState("ready")
        setStatusMessage(`Provider set to ${info.name}`)
        setTimeout(() => setStatusMessage(""), 3000)
      }
    },
    [engine]
  )

  const handleSubmit = useCallback(
    (text: string) => {
      if (!engine || !commands || isProcessing) return

      setStatusMessage("")

      const result = commands.handle(text)
      if (result.handled) {
        if (result.message === "SETUP_WIZARD") {
          setAppState("setup")
          return
        }
        if (result.message?.startsWith("SETUP_PROVIDER:")) {
          const providerId = result.message.slice("SETUP_PROVIDER:".length)
          handleSetupComplete(providerId)
          return
        }
        if (result.message) setStatusMessage(result.message)
        return
      }

      setStreamingText("")
      engine.sendMessage(text)
    },
    [engine, commands, isProcessing, handleSetupComplete]
  )

  const handlePermission = useCallback(
    (allow: boolean) => {
      if (!engine) return
      engine.resolvePermission(allow)
      setPermissionReq(null)
    },
    [engine]
  )

  useInput((input, key) => {
    if (!engine || !commands) return

    if (permissionReq) {
      if (input === "y") { handlePermission(true); return }
      if (input === "a") { handlePermission(true); return }
      if (input === "n") { handlePermission(false); return }
      return
    }

    if (key.tab) {
      const agents = engine.getAgents().map((a) => a.name)
      const currentIdx = agents.indexOf(agentName)
      const nextIdx = (currentIdx + 1) % agents.length
      const nextAgent = agents[nextIdx]
      if (nextAgent) {
        const agent = engine.switchAgent(nextAgent)
        if (agent) {
          setAgentName(agent.name)
          setAgentColor(agent.color || theme.colors.accent)
          setStatusMessage(`Switched to ${agent.name}`)
          setTimeout(() => setStatusMessage(""), 2000)
        }
      }
    }
  })

  if (!ready) {
    return (
      <Box padding={1}>
        <Text color={theme.colors.accent}>⬡</Text>
        <Text color={theme.colors.text}> Initializing RIGAL...</Text>
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
    <Box flexDirection="column" height="100%">
      <Header
        agentName={agentName}
        agentColor={agentColor}
        agentNames={agentNames}
        onAgentSwitch={(name) => {
          const agent = engine!.switchAgent(name)
          if (agent) {
            setAgentName(agent.name)
            setAgentColor(agent.color || theme.colors.accent)
          }
        }}
        width={0}
      />

      <Box flexGrow={1} flexDirection="column" paddingY={0}>
        {messages.length === 0 && !isStreaming ? (
          <WelcomeScreen />
        ) : (
          <ChatView
            messages={messages}
            streamingText={streamingText}
            isStreaming={isStreaming}
          />
        )}
      </Box>

      {permissionReq && (
        <PermissionPrompt
          toolName={permissionReq.toolName}
          reason={permissionReq.reason}
          onAllow={() => handlePermission(true)}
          onDeny={() => handlePermission(false)}
          onAllowOnce={() => handlePermission(true)}
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
      />

      <StatusBar
        provider={provider}
        model={model}
        tokensIn={tokensIn}
        tokensOut={tokensOut}
        cost={0}
        latency={latency}
        workingDirectory={workingDir}
      />
    </Box>
  )
}
