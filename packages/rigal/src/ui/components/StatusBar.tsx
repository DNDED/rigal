import React from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"

interface StatusBarProps {
  provider: string
  model: string
  tokensIn: number
  tokensOut: number
  cost: number
  latency: number
  workingDirectory: string
}

export function StatusBar({ provider, model, tokensIn, tokensOut, latency, workingDirectory }: StatusBarProps) {
  return (
    <Box
      flexDirection="row"
      paddingX={1}
      borderStyle="round"
      borderColor={theme.colors.border}
    >
      <Box marginRight={2}>
        <Text color={theme.colors.accent}>▸</Text>
        <Text color={theme.colors.textDim}> {workingDirectory.split("/").slice(-2).join("/")}</Text>
      </Box>

      <Box flexGrow={1} />

      <Box gap={2}>
        <Text color={theme.colors.textDim}>
          {model} <Text color={theme.colors.accent}>▸</Text> {provider.toUpperCase()}
        </Text>
        {tokensIn + tokensOut > 0 && (
          <Text color={theme.colors.textDim}>
            {formatTokens(tokensIn + tokensOut)}
          </Text>
        )}
        {latency > 0 && (
          <Text color={theme.colors.textDim}>
            {latency.toFixed(0)}ms
          </Text>
        )}
      </Box>
    </Box>
  )
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k tok`
  return `${n} tok`
}
