import React, { useState, useCallback } from "react"
import { Box, Text, useInput } from "ink"
import TextInput from "ink-text-input"
import { theme } from "../theme.js"

interface PromptInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
  placeholder?: string
  history?: string[]
}

export function PromptInput({
  onSubmit,
  disabled,
  placeholder = "Message argent... (/ for commands, Ctrl+K for palette)",
  history = [],
}: PromptInputProps) {
  const [value, setValue] = useState("")
  const [historyIndex, setHistoryIndex] = useState(-1)

  const handleSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (trimmed && !disabled) {
        onSubmit(trimmed)
        setValue("")
        setHistoryIndex(-1)
      }
    },
    [disabled, onSubmit]
  )

  useInput(
    (_input, key) => {
      if (disabled) return
      if (history.length === 0) return

      if (key.upArrow) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex
        if (newIndex >= 0) {
          setHistoryIndex(newIndex)
          const idx = history.length - 1 - newIndex
          if (idx >= 0 && idx < history.length) {
            setValue(history[idx] ?? "")
          }
        }
        return
      }

      if (key.downArrow) {
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          const idx = history.length - 1 - newIndex
          if (idx >= 0 && idx < history.length) {
            setValue(history[idx] ?? "")
          }
        } else {
          setHistoryIndex(-1)
          setValue("")
        }
        return
      }
    },
    { isActive: !disabled }
  )

  return (
    <Box flexDirection="row" paddingX={1} paddingY={0} alignItems="center">
      <Box marginRight={1}>
        <Text color={disabled ? theme.colors.textMuted : theme.colors.accentBright}>
          {disabled ? theme.icons.promptDisabled : theme.icons.prompt}
        </Text>
      </Box>
      <Box flexGrow={1}>
        {disabled ? (
          <Box flexDirection="row">
            <Text color={theme.colors.textMuted}>{value || "Processing"}</Text>
            <Text color={theme.colors.accent}> {theme.chars.ellipsis}</Text>
          </Box>
        ) : (
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            placeholder={placeholder}
            showCursor={true}
          />
        )}
      </Box>
      {disabled && (
        <Box marginLeft={1}>
          <Text color={theme.colors.accent} dimColor>
            {theme.chars.blockLight.repeat(3)}
          </Text>
        </Box>
      )}
    </Box>
  )
}
