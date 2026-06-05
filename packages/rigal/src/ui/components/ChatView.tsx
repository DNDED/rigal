import React from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"
import type { Message } from "@rigal/core"

interface ChatViewProps {
  messages: Message[]
  streamingText: string
  isStreaming: boolean
}

export function ChatView({ messages, streamingText, isStreaming }: ChatViewProps) {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      {isStreaming && streamingText && (
        <Box flexDirection="column" paddingY={1}>
          <Text color={theme.colors.accent}>
            <Text bold color={theme.colors.accent}>⬡ RIGAL</Text>
          </Text>
          <Text color={theme.colors.text}>{streamingText}</Text>
        </Box>
      )}
    </Box>
  )
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text>
          <Text bold color={theme.colors.textBright}>▸ You</Text>
        </Text>
        <Text color={theme.colors.text}>
          {message.content.map((c) => c.text || "").join(" ")}
        </Text>
      </Box>
    )
  }

  if (message.role === "assistant") {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text>
          <Text bold color={theme.colors.accent}>⬡ RIGAL</Text>
        </Text>
        <Text color={theme.colors.text}>
          {message.content.map((c) => c.text || "").join(" ")}
        </Text>
        {message.toolCalls?.map((tc) => (
          <Box key={tc.id} paddingLeft={2} paddingY={0}>
            <Text color={theme.colors.warning}>
              ⚙ {tc.name}({Object.entries(tc.arguments).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")})
            </Text>
          </Box>
        ))}
      </Box>
    )
  }

  if (message.role === "tool") {
    return (
      <Box flexDirection="column" paddingY={0} paddingLeft={2}>
        <Text dimColor color={theme.colors.textDim}>
          └─ {message.content.map((c) => c.text || "").join(" ").slice(0, 200)}
          {message.content.map((c) => c.text || "").join(" ").length > 200 ? "..." : ""}
        </Text>
      </Box>
    )
  }

  return null
}
