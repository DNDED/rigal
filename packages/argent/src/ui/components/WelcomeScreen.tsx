import React from "react"
import { Box, Text } from "ink"
import { theme, multiGradient } from "../theme.js"
import type { ArgentEngine } from "../../cli/engine.js"

export function WelcomeScreen({ width = 80, engine }: { width?: number; engine?: ArgentEngine }) {
  const innerWidth = Math.max(20, Math.min(width - 4, 52))
  const aurora = multiGradient(
    [theme.colors.accentDim, theme.colors.accent, theme.colors.accentAlt, theme.colors.accentTertiary],
    Math.max(6, innerWidth + 2)
  )

  return (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Box flexDirection="column" alignItems="center">
        <Text>
          <Text color={aurora[0]}>{theme.chars.round[0]}</Text>
          <Text color={aurora[4]}>{theme.chars.thin.repeat(innerWidth)}</Text>
          <Text color={aurora[aurora.length - 1]}>{theme.chars.round[1]}</Text>
        </Text>
        <Box>
          <Text color={aurora[2]}>{theme.chars.vertical}</Text>
          <Text>{" ".repeat(innerWidth)}</Text>
          <Text color={aurora[aurora.length - 3]}>{theme.chars.vertical}</Text>
        </Box>
        <Box>
          <Text color={aurora[2]}>{theme.chars.vertical}</Text>
          <Text>  </Text>
          <Text bold color={theme.colors.textWhite}>
            ARGENT
          </Text>
          <Text>  </Text>
          <Text color={theme.colors.textDim}>universal AI coding harness</Text>
          <Text>{" ".repeat(Math.max(0, innerWidth - 34))}</Text>
          <Text color={aurora[aurora.length - 3]}>{theme.chars.vertical}</Text>
        </Box>
        <Box>
          <Text color={aurora[2]}>{theme.chars.vertical}</Text>
          <Text>{" ".repeat(innerWidth)}</Text>
          <Text color={aurora[aurora.length - 3]}>{theme.chars.vertical}</Text>
        </Box>
        <Text>
          <Text color={aurora[0]}>{theme.chars.round[2]}</Text>
          <Text color={aurora[4]}>{theme.chars.thin.repeat(innerWidth)}</Text>
          <Text color={aurora[aurora.length - 1]}>{theme.chars.round[3]}</Text>
        </Text>
      </Box>

      <Box marginTop={2} flexDirection={width < 80 ? "column" : "row"} gap={width < 80 ? 1 : 6}>
        <Box flexDirection="column">
          <Text bold color={theme.colors.textBright}>
            {theme.chars.dot} Agents
          </Text>
          <Box flexDirection="column" marginTop={1}>
            <AgentRow
              symbol={theme.chars.dot}
              color={theme.colors.success}
              name="build"
              desc="Full-access"
            />
            <AgentRow
              symbol={theme.chars.dotEmpty}
              color={theme.colors.accentAlt}
              name="plan"
              desc="Read-only"
            />
            <AgentRow
              symbol={theme.chars.diamondEmpty}
              color={theme.colors.textMuted}
              name="explore"
              desc="Codebase search"
            />
          </Box>
        </Box>

        <Box flexDirection="column">
          <Text bold color={theme.colors.textBright}>
            {theme.chars.diamond} Commands
          </Text>
          <Box flexDirection="column" marginTop={1}>
            <CmdRow cmd="/help" desc="Show all commands" />
            <CmdRow cmd="/clear" desc="Reset session" />
            <CmdRow cmd="/status" desc="Show status" />
            <CmdRow cmd="/review" desc="Code review" />
            <CmdRow cmd="/test" desc="Run tests" />
            <CmdRow cmd="/pr" desc="Create pull request" />
          </Box>
        </Box>

        <Box flexDirection="column">
          <Text bold color={theme.colors.textBright}>
            {theme.icons.keyboard} Shortcuts
          </Text>
          <Box flexDirection="column" marginTop={1}>
            <KeybindRow keybind="Tab" desc="Switch agent" />
            <KeybindRow keybind="Ctrl+K" desc="Command palette" />
            <KeybindRow keybind="Ctrl+C" desc="Quit" />
          </Box>
        </Box>
      </Box>

      {engine && (
        <Box marginTop={2}>
          <Text color={theme.colors.textDim}>
            {engine.sessionId && engine.sessions.get(engine.sessionId)
              ? `Session: ${engine.sessions.get(engine.sessionId)!.messages.length} messages · ${engine.sessions.get(engine.sessionId)!.agentName} agent`
              : "No active session"}
          </Text>
        </Box>
      )}

      {engine && !engine.hasProviderSelected() && (
        <Box marginTop={2} flexDirection="column" alignItems="center">
          <Text color={theme.colors.warning}>
            {theme.icons.warning} No provider configured
          </Text>
          <Text color={theme.colors.textDim}>
            Run /setup or /provider to get started
          </Text>
        </Box>
      )}

      <Box marginTop={2}>
        <Text color={theme.colors.textMuted}>Type a message to begin</Text>
      </Box>

      <Box marginTop={1} alignSelf="flex-end">
        <Text color={theme.colors.textMuted}>ARGENT v0.4.0</Text>
      </Box>
    </Box>
  )
}

function AgentRow({
  symbol,
  color,
  name,
  desc,
}: {
  symbol: string
  color: string
  name: string
  desc: string
}) {
  return (
    <Box>
      <Text color={color}>{symbol}</Text>
      <Text> </Text>
      <Text color={theme.colors.textBright}>{name.padEnd(8)}</Text>
      <Text color={theme.colors.textDim}>{desc}</Text>
    </Box>
  )
}

function CmdRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <Box>
      <Text color={theme.colors.accent}>{cmd.padEnd(10)}</Text>
      <Text color={theme.colors.textDim}>{desc}</Text>
    </Box>
  )
}

function KeybindRow({ keybind, desc }: { keybind: string; desc: string }) {
  return (
    <Box>
      <Text color={theme.colors.warning}>{keybind.padEnd(10)}</Text>
      <Text color={theme.colors.textDim}>{desc}</Text>
    </Box>
  )
}
