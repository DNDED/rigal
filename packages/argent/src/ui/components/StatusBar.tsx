import React, { useState, useEffect } from "react"
import { Box, Text, useStdout } from "ink"
import { sep as pathSep } from "node:path"
import { homedir } from "node:os"
import { theme } from "../theme.js"

interface StatusBarProps {
  provider: string
  model: string
  tokensIn: number
  tokensOut: number
  latency: number
  workingDirectory: string
  isStreaming: boolean
  errorCount: number
  cost?: number
}

const STREAM_FRAMES = ["◌", "◍", "●"]

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}

function getContextWindow(model: string): number {
  const m = model.toLowerCase()
  if (m.includes("gemini")) return 1_000_000
  if (m.includes("claude")) return 200_000
  if (m.includes("gpt")) return 128_000
  return 128_000
}

function formatCost(c: number): string {
  return c < 1 ? c.toFixed(2) : `$${c.toFixed(2)}`
}

export function StatusBar({
  provider,
  model,
  tokensIn,
  tokensOut,
  latency,
  workingDirectory,
  isStreaming,
  errorCount,
  cost = 0,
}: StatusBarProps) {
  const { stdout } = useStdout()
  const width = stdout?.columns ?? 80
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!isStreaming) {
      setFrame(0)
      return
    }
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % STREAM_FRAMES.length)
    }, 400)
    return () => clearInterval(id)
  }, [isStreaming])

  const home = homedir()
  let shortDir = workingDirectory.startsWith(home + pathSep)
    ? "~" + workingDirectory.slice(home.length)
    : workingDirectory
  if (shortDir.length > 30) shortDir = "..." + shortDir.slice(-27)
  const totalTokens = tokensIn + tokensOut
  const ctxWindow = getContextWindow(model)
  const ctxPct = ctxWindow > 0 ? Math.round((totalTokens / ctxWindow) * 100) : 0
  const sep = " · "
  const barColor = isStreaming ? theme.colors.accent : theme.colors.accentDim

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.colors.borderSubtle}>
          {theme.chars.thin.repeat(width)}
        </Text>
      </Box>
      <Box paddingX={1}>
        <Text color={barColor}>██</Text>
        {isStreaming && (
          <>
            <Text color={theme.colors.textMuted}>{sep}</Text>
            <Text color={theme.colors.accent}>
              {STREAM_FRAMES[frame]} streaming
            </Text>
          </>
        )}
        <Text color={theme.colors.textMuted}>{sep}</Text>
        <Text color={theme.colors.textDim}>
          {provider}/{model}
        </Text>
        <Text color={theme.colors.textMuted}>{sep}</Text>
        <Text color={theme.colors.accent}>{theme.icons.prefix}</Text>
        <Text color={theme.colors.textDim}>{shortDir}</Text>
        {totalTokens > 0 && (
          <>
            <Text color={theme.colors.textMuted}>{sep}</Text>
            <Text color={theme.colors.textDim}>
              {formatCompact(totalTokens)}
            </Text>
          </>
        )}
        {totalTokens > 0 && ctxPct > 0 && (
          <>
            <Text color={theme.colors.textMuted}>{sep}</Text>
            <Text color={theme.colors.textMuted}>
              [ctx ~{ctxPct}%]
            </Text>
          </>
        )}
        <Text color={theme.colors.textMuted}>{sep}</Text>
        <Text color={cost < 0.01 ? theme.colors.textMuted : theme.colors.textDim}>
          {formatCost(cost)}
        </Text>
        {errorCount > 0 && (
          <>
            <Text color={theme.colors.textMuted}>{sep}</Text>
            <Text color={theme.colors.error}>
              {theme.icons.error} {errorCount}
            </Text>
          </>
        )}
        {isStreaming && latency > 0 && (
          <>
            <Text color={theme.colors.textMuted}>{sep}</Text>
            <Text color={theme.colors.textDim}>
              took {(latency / 1000).toFixed(1)}s
            </Text>
          </>
        )}
      </Box>
    </Box>
  )
}
