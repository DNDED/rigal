import React from "react"
import { Box, Text } from "ink"
import { theme, multiGradient } from "../theme.js"

interface HeaderProps {
  agentName: string
  agentColor: string
  agentNames: string[]
  maxWidth: number
}

export function Header({ agentName, agentColor, agentNames, maxWidth }: HeaderProps) {
  const brandColors = multiGradient(
    [theme.colors.accentDim, theme.colors.accent, theme.colors.accentAlt, theme.colors.accentTertiary],
    20
  )

  const diamondPosFromLeft = Math.floor(maxWidth * 0.6)
  const brandWidth = 8
  const leftLineWidth = Math.max(0, diamondPosFromLeft - brandWidth)
  const rightLineWidth = Math.max(0, maxWidth - diamondPosFromLeft - 8)

  const argentLetters = ["a", "r", "g", "e", "n", "t"]
  const letterColorIndices = [0, 3, 7, 10, 14, 18]

  return (
    <Box flexDirection="column" paddingX={1} paddingY={0}>
      <Box flexDirection="row" alignItems="center" marginBottom={0}>
        <Box marginRight={1}>
          <Text>
            <Text bold color={theme.colors.textWhite}>{theme.chars.diamond}</Text>
            {argentLetters.map((letter, i) => (
              <Text key={i} bold color={brandColors[letterColorIndices[i]!]!}>
                {letter}
              </Text>
            ))}
          </Text>
        </Box>

        <Box flexGrow={1}>
          <Text>
            <Text color={theme.colors.borderSubtle}>
              {theme.chars.thin.repeat(Math.max(0, leftLineWidth))}
            </Text>
            <Text color={theme.colors.accentDim}>{theme.chars.diamond}</Text>
            <Text color={theme.colors.borderSubtle}>
              {theme.chars.thin.repeat(Math.max(0, rightLineWidth))}
            </Text>
          </Text>
        </Box>

        <Box flexDirection="row">
          {agentNames.map((name, i) => {
            const isActive = name === agentName
            return (
              <React.Fragment key={name}>
                {i > 0 && (
                  <Text color={theme.colors.textMuted}> {theme.chars.verticalLight} </Text>
                )}
                <Text
                  color={isActive ? agentColor : theme.colors.textMuted}
                  bold={isActive}
                >
                  {isActive ? `▐ ${name}` : name}
                </Text>
              </React.Fragment>
            )
          })}
        </Box>
      </Box>
      <Box>
        <Text color={theme.colors.borderSubtle}>
          {theme.chars.double.repeat(Math.max(0, maxWidth - 2))}
        </Text>
      </Box>
    </Box>
  )
}
