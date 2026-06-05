import React from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"

export function WelcomeScreen() {
  return (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Text>
        <Text bold color={theme.colors.accent}>
          ╔══════════════════════════════════════╗{'\n'}
          ║                                      ║{'\n'}
          ║  <Text color="#00e5ff">⬡</Text> <Text bold color={theme.colors.textBright}>R  I  G  A  L</Text>                        ║{'\n'}
          ║                                      ║{'\n'}
          ║  <Text color={theme.colors.textDim}>The universal AI coding harness</Text> ║{'\n'}
          ║                                      ║{'\n'}
          ╚══════════════════════════════════════╝
        </Text>
      </Text>

      <Box marginTop={2} flexDirection="column" alignItems="flex-start">
        <Text color={theme.colors.textDim}>┌─────────────────────────────────────────┐</Text>
        <Box flexDirection="row">
          <Text color={theme.colors.textDim}>│</Text>
          <Box flexDirection="column" paddingLeft={1} paddingRight={2}>
            <Text color={theme.colors.text}>
              <Text color={theme.colors.success}>●</Text> build  <Text color={theme.colors.textDim}>Full-access development agent</Text>
            </Text>
            <Text color={theme.colors.text}>
              <Text color={theme.colors.accentAlt}>○</Text> plan   <Text color={theme.colors.textDim}>Read-only analysis & exploration</Text>
            </Text>
            <Text color={theme.colors.text}>
              <Text color={theme.colors.textDim}>○</Text> explore <Text color={theme.colors.textDim}>Fast codebase search (subagent)</Text>
            </Text>
          </Box>
          <Text color={theme.colors.textDim}>│</Text>
        </Box>
        <Text color={theme.colors.textDim}>└─────────────────────────────────────────┘</Text>
      </Box>

      <Box marginTop={2} flexDirection="column">
        <Text color={theme.colors.textDim}>Commands:</Text>
        <Text color={theme.colors.text}>
          <Text color={theme.colors.accent}>/agent</Text> <Text color={theme.colors.textDim}>Switch agent</Text>  <Text color={theme.colors.accent}>/model</Text> <Text color={theme.colors.textDim}>Switch model</Text>  <Text color={theme.colors.accent}>/provider</Text> <Text color={theme.colors.textDim}>Change provider</Text>
        </Text>
        <Text color={theme.colors.text}>
          <Text color={theme.colors.accent}>/clear</Text> <Text color={theme.colors.textDim}>New session</Text>   <Text color={theme.colors.accent}>/share</Text> <Text color={theme.colors.textDim}>Share session</Text>  <Text color={theme.colors.accent}>/help</Text> <Text color={theme.colors.textDim}>Show all commands</Text>
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color={theme.colors.textBright}>Type a message to begin, or /help to see all commands.</Text>
      </Box>
    </Box>
  )
}
