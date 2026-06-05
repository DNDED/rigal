import React from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"

interface HeaderProps {
  agentName: string
  agentColor: string
  agentNames: string[]
  onAgentSwitch: (name: string) => void
  width: number
}

export function Header({ agentName, agentColor, agentNames, onAgentSwitch }: HeaderProps) {
  return (
    <Box
      flexDirection="row"
      paddingX={1}
      paddingY={0}
      borderStyle="round"
      borderColor={theme.colors.border}
    >
      <Box marginRight={2}>
        <Text bold>
          <Text color={agentColor}>⬡</Text>
          <Text color={theme.colors.textBright}> RIGAL</Text>
          <Text color={theme.colors.textDim}> / </Text>
          <Text color={agentColor}>{agentName.toUpperCase()}</Text>
        </Text>
      </Box>

      <Box flexDirection="row" gap={1}>
        {agentNames.map((name) => (
          <Box key={name} paddingX={1}>
            <Text
              color={name === agentName ? agentColor : theme.colors.textDim}
              dimColor={name !== agentName}
            >
              {name === agentName ? "●" : "○"} {name}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
