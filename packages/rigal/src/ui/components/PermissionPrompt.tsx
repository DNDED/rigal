import React from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"

interface PermissionPromptProps {
  toolName: string
  reason: string
  onAllow: () => void
  onDeny: () => void
  onAllowOnce: () => void
}

export function PermissionPrompt({ toolName, reason, onAllow, onDeny, onAllowOnce }: PermissionPromptProps) {
  return (
    <Box
      flexDirection="column"
      paddingX={1}
      paddingY={1}
      borderStyle="round"
      borderColor={theme.colors.warning}
    >
      <Box marginBottom={1}>
        <Text bold color={theme.colors.warning}>
          ⚠ Permission Required
        </Text>
        <Text color={theme.colors.text}> — {toolName}</Text>
      </Box>
      <Text color={theme.colors.textDim}>  {reason}</Text>
      <Box marginTop={1} gap={2}>
        <Text color={theme.colors.success}>[y] Allow</Text>
        <Text color={theme.colors.warning}>[a] Allow Once</Text>
        <Text color={theme.colors.error}>[n] Deny</Text>
      </Box>
    </Box>
  )
}
