import React, { useState, useCallback } from "react"
import { Box, Text, useInput } from "ink"
import { theme } from "../theme.js"

interface SetupMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: "provider" | "model" | "reasoning" | "agent") => void
  currentValues: {
    provider: string
    model: string
    reasoning: "low" | "medium" | "high" | "max"
    agent: string
  }
}

const MENU_ITEMS = [
  { id: "provider" as const, label: "Provider", getValue: (v: SetupMenuProps["currentValues"]) => v.provider },
  { id: "model" as const, label: "Model", getValue: (v: SetupMenuProps["currentValues"]) => v.model },
  { id: "reasoning" as const, label: "Reasoning", getValue: (v: SetupMenuProps["currentValues"]) => v.reasoning },
  { id: "agent" as const, label: "Agent", getValue: (v: SetupMenuProps["currentValues"]) => v.agent },
]

export function SetupMenu({ isOpen, onClose, onSelect, currentValues }: SetupMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleSelect = useCallback(() => {
    const item = MENU_ITEMS[selectedIndex]
    if (item) {
      onSelect(item.id)
    }
  }, [selectedIndex, onSelect])

  useInput(
    (input, key) => {
      if (!isOpen) return

      if (key.escape) {
        onClose()
        return
      }

      if (key.return) {
        handleSelect()
        return
      }

      if (key.upArrow) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : MENU_ITEMS.length - 1))
        return
      }

      if (key.downArrow) {
        setSelectedIndex((prev) => (prev < MENU_ITEMS.length - 1 ? prev + 1 : 0))
        return
      }
    },
    { isActive: isOpen }
  )

  if (!isOpen) return null

  return (
    <Box
      flexDirection="column"
      position="absolute"
      width="100%"
      height="100%"
      paddingX={4}
      paddingY={2}
    >
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor={theme.colors.borderFocus}
        paddingX={0}
      >
        <Box
          paddingX={2}
          paddingY={1}
          borderStyle="single"
          borderColor={theme.colors.borderSubtle}
        >
          <Text bold color={theme.colors.textBright}>
            Setup
          </Text>
        </Box>

        <Box flexDirection="column" paddingY={0}>
          {MENU_ITEMS.map((item, i) => {
            const isSelected = i === selectedIndex
            const value = item.getValue(currentValues)
            const isDefault = item.id === "reasoning" && value === "medium"

            return (
              <Box
                key={item.id}
                paddingX={2}
                paddingY={0}
                flexDirection="row"
              >
                <Box width={2}>
                  <Text color={isSelected ? theme.colors.accentBright : theme.colors.textMuted}>
                    {isSelected ? theme.chars.arrow : " "}
                  </Text>
                </Box>
                <Box marginRight={2}>
                  <Text color={theme.colors.textDim}>
                    [{i + 1}]
                  </Text>
                </Box>
                <Box marginRight={2}>
                  <Text color={isSelected ? theme.colors.textBright : theme.colors.accent} bold={isSelected}>
                    {item.label.padEnd(10)}
                  </Text>
                </Box>
                <Box>
                  <Text color={isSelected ? theme.colors.textDim : theme.colors.textMuted}>
                    {value}
                    {isDefault && " (default)"}
                  </Text>
                </Box>
              </Box>
            )
          })}
        </Box>

        <Box
          paddingX={2}
          paddingY={0}
          borderStyle="single"
          borderColor={theme.colors.borderSubtle}
          flexDirection="row"
        >
          <Box marginRight={2}>
            <Text color={theme.colors.textMuted}>
              <Text color={theme.colors.accent}>{theme.chars.keyEnter}</Text> select
            </Text>
          </Box>
          <Box marginRight={2}>
            <Text color={theme.colors.textMuted}>
              <Text color={theme.colors.accent}>{theme.chars.upDown}</Text> navigate
            </Text>
          </Box>
          <Box>
            <Text color={theme.colors.textMuted}>
              <Text color={theme.colors.accent}>Esc</Text> close
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
