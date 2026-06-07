import React, { useState, useMemo, useCallback } from "react"
import { Box, Text, useInput } from "ink"
import { theme, fuzzyMatch } from "../theme.js"

interface Command {
  id: string
  label: string
  description: string
  category: string
  command: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onExecute: (command: string) => void
}

const ALL_COMMANDS: Command[] = [
  { id: "agent-build", label: "/agent build", description: "Full-access development agent", category: "Agent", command: "/agent build" },
  { id: "agent-plan", label: "/agent plan", description: "Read-only analysis & exploration", category: "Agent", command: "/agent plan" },
  { id: "agent-explore", label: "/agent explore", description: "Fast codebase search (subagent)", category: "Agent", command: "/agent explore" },
  { id: "provider", label: "/provider", description: "Change LLM provider", category: "Model", command: "/provider" },
  { id: "model", label: "/model", description: "Switch AI model", category: "Model", command: "/model" },
  { id: "oauth-status", label: "/oauth status", description: "Show OAuth token status", category: "Model", command: "/oauth status" },
  { id: "clear", label: "/clear", description: "Start a new session", category: "Session", command: "/clear" },
  { id: "undo", label: "/undo", description: "Revert last change", category: "Session", command: "/undo" },
  { id: "status", label: "/status", description: "Show current status", category: "Session", command: "/status" },
  { id: "history", label: "/history", description: "Show recent command history", category: "Session", command: "/history" },
  { id: "setup", label: "/setup", description: "Re-run first-run setup", category: "System", command: "/setup" },
  { id: "help", label: "/help", description: "Show all available commands", category: "System", command: "/help" },
  { id: "shortcuts", label: "/shortcuts", description: "Show keyboard shortcuts", category: "System", command: "/shortcuts" },
  { id: "exit", label: "/exit", description: "Quit ARGENT", category: "System", command: "/exit" },
]

export function CommandPalette({ isOpen, onClose, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_COMMANDS
    return ALL_COMMANDS.filter(
      (cmd) =>
        fuzzyMatch(query, cmd.label) ||
        fuzzyMatch(query, cmd.description) ||
        cmd.label.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  const safeSelected = Math.min(selectedIndex, Math.max(0, filtered.length - 1))

  const handleSelect = useCallback(() => {
    const cmd = filtered[safeSelected]
    if (cmd) {
      onExecute(cmd.command)
      onClose()
      setQuery("")
      setSelectedIndex(0)
    }
  }, [filtered, safeSelected, onExecute, onClose])

  useInput(
    (input, key) => {
      if (!isOpen) return

      if (key.escape) {
        onClose()
        setQuery("")
        setSelectedIndex(0)
        return
      }

      if (key.return) {
        handleSelect()
        return
      }

      if (key.upArrow) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filtered.length - 1)))
        return
      }

      if (key.downArrow) {
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
        return
      }

      if (key.backspace || key.delete) {
        setQuery((prev) => prev.slice(0, -1))
        setSelectedIndex(0)
        return
      }

      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setQuery((prev) => prev + input)
        setSelectedIndex(0)
      }
    },
    { isActive: isOpen }
  )

  if (!isOpen) return null

  let prevCategory = ""

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
          flexDirection="row"
        >
          <Text color={theme.colors.accentBright}>{theme.chars.search} </Text>
          <Text color={theme.colors.textBright}>{query}</Text>
          <Text color={theme.colors.accent}>{theme.chars.cursor}</Text>
          {!query && (
            <Text color={theme.colors.textMuted}>Type to search commands...</Text>
          )}
        </Box>

        <Box flexDirection="column" paddingY={0}>
          {filtered.length === 0 ? (
            <Box paddingX={2} paddingY={1}>
              <Text color={theme.colors.textMuted}>No commands found</Text>
            </Box>
          ) : (
            filtered.map((cmd, i) => {
              const showCategory = cmd.category !== prevCategory
              prevCategory = cmd.category
              const isSelected = i === safeSelected

              return (
                <Box key={cmd.id} flexDirection="column">
                  {showCategory && (
                    <Box paddingX={2} paddingY={0}>
                      <Text bold color={theme.colors.textDim}>
                        {cmd.category}
                      </Text>
                    </Box>
                  )}
                  <Box
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
                      <Text color={isSelected ? theme.colors.textBright : theme.colors.accent} bold={isSelected}>
                        {cmd.label}
                      </Text>
                    </Box>
                    <Box>
                      <Text color={isSelected ? theme.colors.textDim : theme.colors.textMuted}>
                        {cmd.description}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              )
            })
          )}
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
