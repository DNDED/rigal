import React, { useState } from "react"
import { Box, Text } from "ink"
import TextInput from "ink-text-input"
import { theme } from "../theme.js"

interface PromptInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export function PromptInput({ onSubmit, disabled, placeholder = "Ask RIGAL anything..." }: PromptInputProps) {
  const [value, setValue] = useState("")

  const handleSubmit = (text: string) => {
    const trimmed = text.trim()
    if (trimmed && !disabled) {
      onSubmit(trimmed)
      setValue("")
    }
  }

  return (
    <Box flexDirection="row" paddingX={1} paddingY={0}>
      <Box marginRight={1}>
        <Text color={disabled ? theme.colors.textDim : theme.colors.accent}>
          {disabled ? "◌" : "▸"}
        </Text>
      </Box>
      <Box flexGrow={1}>
        {disabled ? (
          <Text color={theme.colors.textDim}>{value || placeholder}</Text>
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
    </Box>
  )
}
