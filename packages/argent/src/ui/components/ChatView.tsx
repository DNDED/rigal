import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"
import type { Message } from "@argent/core"

interface ChatViewProps {
  messages: Message[]
  streamingText: string
  isStreaming: boolean
  errors: string[]
  streamingToolCalls?: { id: string; name: string; arguments: Record<string, unknown> }[]
  terminalHeight?: number
}

const TS_LANGS = new Set(["ts", "typescript", "js", "javascript", "tsx", "jsx"])

const STREAMING_FRAMES = ["◌", "◍", "●"]

function getMaxVisible(terminalHeight: number): number {
  return Math.max(10, Math.floor((terminalHeight - 10) / 3))
}

export function ChatView({ messages, streamingText, isStreaming, errors, streamingToolCalls, terminalHeight = 80 }: ChatViewProps) {
  const MAX_VISIBLE = getMaxVisible(terminalHeight)
  const visibleMessages = messages.length > MAX_VISIBLE
    ? messages.slice(-MAX_VISIBLE)
    : messages
  const hiddenCount = messages.length - MAX_VISIBLE
  let userMsgNum = 0

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {errors.length > 0 && (
        <Box flexDirection="column" paddingY={1}>
          {errors.map((err, i) => (
            <Box key={i} paddingLeft={1}>
              <Text color={theme.colors.error}>
                {theme.icons.error} <Text dimColor>{err}</Text>
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {hiddenCount > 0 && (
        <Box paddingY={0}>
          <Text color={theme.colors.textMuted}>
            {theme.chars.dotted} {hiddenCount} earlier messages hidden {theme.chars.dotted}
          </Text>
        </Box>
      )}

      {visibleMessages.map((msg, i) => {
        if (msg.role === "user") userMsgNum++
        const prevRole = i > 0 ? visibleMessages[i - 1]?.role : undefined
        const roleChanged = prevRole !== undefined && msg.role !== prevRole
        const isFirstInTurn = i === 0 || roleChanged
        const showSeparatorAtBoundary = (i === 0 && hiddenCount > 0)

        return (
          <React.Fragment key={i}>
            {(roleChanged || showSeparatorAtBoundary) && (
              <Box>
                <Text color={theme.colors.borderSubtle}>{theme.chars.thin}{theme.chars.thin}{theme.chars.thin}</Text>
              </Box>
            )}
            <MessageBubble message={msg} showRole={isFirstInTurn} extraPadding={roleChanged} userMsgNum={msg.role === "user" ? userMsgNum : undefined} />
          </React.Fragment>
        )
      })}

      {isStreaming && (
        <StreamingBubble text={streamingText} toolCalls={streamingToolCalls} />
      )}
    </Box>
  )
}

function StreamingBubble({ text, toolCalls }: { text: string; toolCalls?: { id: string; name: string; arguments: Record<string, unknown> }[] }) {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((v) => (v + 1) % STREAMING_FRAMES.length)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  if (!text && (!toolCalls || toolCalls.length === 0)) {
    return <ThinkingIndicator frameIndex={frameIndex} />
  }

  const frame = STREAMING_FRAMES[frameIndex] ?? "●"

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box>
        <Text color={theme.colors.accentBright}>
          {theme.chars.diamond}{" "}
          <Text bold color={theme.colors.textWhite}>argent</Text>
        </Text>
      </Box>
      {text ? (
        <Box paddingLeft={2}>
          <Box flexDirection="row">
            <Box flexShrink={1}>
              <MarkdownContent content={text} color={theme.colors.text} />
            </Box>
            <Box flexShrink={0}>
              <Text color={theme.colors.accent}>{frame}</Text>
            </Box>
          </Box>
        </Box>
      ) : null}
      {toolCalls && toolCalls.length > 0 && (
        <Box paddingLeft={2} flexDirection="column" marginTop={text ? 1 : 0}>
          {toolCalls.map((tc) => (
            <ToolCallDisplay key={tc.id} toolCall={tc} streaming />
          ))}
        </Box>
      )}
    </Box>
  )
}

function ThinkingIndicator({ frameIndex }: { frameIndex: number }) {
  const frame = STREAMING_FRAMES[frameIndex] ?? "●"

  return (
    <Box paddingY={1}>
      <Text color={theme.colors.accentBright}>
        {theme.chars.diamond}{" "}
        <Text bold color={theme.colors.textWhite}>argent</Text>
      </Text>
      <Text color={theme.colors.accent}> {frame}··</Text>
    </Box>
  )
}

function MessageBubble({ message, showRole, extraPadding, userMsgNum }: { message: Message; showRole: boolean; extraPadding: boolean; userMsgNum?: number }) {
  const pad = extraPadding ? 1 : 0

  if (message.role === "user") {
    const textContent = message.content.map((c) => ("text" in c ? c.text : "")).join(" ")

    return (
      <Box flexDirection="column" paddingTop={pad} paddingBottom={0}>
        <Box>
          {userMsgNum !== undefined ? (
            <Text color={theme.colors.textDim}>
              [{userMsgNum}]{" "}
            </Text>
          ) : null}
          <Text bold color={theme.colors.textBright}>
            {theme.chars.arrow}{" "}
            you
          </Text>
        </Box>
        <Box paddingLeft={2}>
          <MarkdownContent content={textContent} color={theme.colors.text} />
        </Box>
      </Box>
    )
  }

  if (message.role === "assistant") {
    const textContent = message.content.map((c) => ("text" in c ? c.text : "")).join(" ")
    const toolCalls = ("toolCalls" in message ? message.toolCalls : []) || []

    return (
      <Box flexDirection="column" paddingTop={pad} paddingBottom={0}>
        {showRole && (
          <Box>
            <Text color={theme.colors.accentBright}>
              {theme.chars.diamond}{" "}
              <Text bold color={theme.colors.textWhite}>argent</Text>
            </Text>
          </Box>
        )}

        {textContent ? (
          <Box paddingLeft={2} flexDirection="column">
            <MarkdownContent content={textContent} color={theme.colors.text} />
          </Box>
        ) : null}

        {toolCalls.length > 0 && (
          <Box paddingLeft={2} flexDirection="column" marginTop={textContent ? 1 : 0}>
            {toolCalls.map((tc: { id: string; name: string; arguments: Record<string, unknown> }) => (
              <ToolCallDisplay key={tc.id} toolCall={tc} />
            ))}
          </Box>
        )}
      </Box>
    )
  }

  if (message.role === "tool") {
    const fullText = message.content.map((c) => ("text" in c ? c.text : "")).join(" ")
    const isError = (message as any).isError === true
    const displayText = fullText.length > 300 ? fullText.slice(0, 289) + "[truncated]" : fullText

    return (
      <Box flexDirection="column" paddingLeft={4} paddingY={0}>
        <Text color={theme.colors.textMuted}>
          {theme.icons.verticalBar}{" "}
          <Text dimColor={!isError} color={isError ? theme.colors.error : undefined}>
            {displayText}
          </Text>
        </Text>
      </Box>
    )
  }

  return null
}

function ToolCallDisplay({ toolCall, streaming }: { toolCall: { id: string; name: string; arguments: Record<string, unknown> }; streaming?: boolean }) {
  const fullArgs = Object.entries(toolCall.arguments)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ")
  const args = fullArgs.length > 60 ? fullArgs.slice(0, 57) + "..." : fullArgs

  return (
    <Box>
      <Text>
        <Text color={theme.colors.warning}>{theme.icons.tool}</Text>
        <Text color={theme.colors.warning}> {toolCall.name}</Text>
        <Text color={theme.colors.warning}>({args})</Text>
        {streaming ? (
          <Text color={theme.colors.warning}>...</Text>
        ) : null}
      </Text>
    </Box>
  )
}

type MarkdownToken =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "code"; content: string }

type MarkdownBlock =
  | { type: "paragraph"; tokens: MarkdownToken[] }
  | { type: "codeblock"; language: string; content: string }
  | { type: "list_item"; tokens: MarkdownToken[]; ordered: boolean; index?: number }
  | { type: "diff_hunk"; lines: { prefix: string; content: string }[] }
  | { type: "heading"; level: number; content: string }

function parseInlineMarkdown(text: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = []
  let i = 0

  while (i < text.length) {
    if (text[i] === "*" && text[i + 1] === "*") {
      i += 2
      const end = text.indexOf("**", i)
      if (end !== -1) {
        tokens.push({ type: "bold", content: text.slice(i, end) })
        i = end + 2
      } else {
        tokens.push({ type: "text", content: "**" })
      }
    } else if (text[i] === "*" && text[i + 1] !== "*" && (i === 0 || text[i - 1] !== "*")) {
      i++
      const end = text.indexOf("*", i)
      if (end !== -1 && text[end + 1] !== "*") {
        tokens.push({ type: "italic", content: text.slice(i, end) })
        i = end + 1
      } else {
        tokens.push({ type: "text", content: "*" })
      }
    } else if (text[i] === "`" && text[i + 1] !== "`") {
      i++
      const end = text.indexOf("`", i)
      if (end !== -1) {
        tokens.push({ type: "code", content: text.slice(i, end) })
        i = end + 1
      } else {
        tokens.push({ type: "text", content: "`" })
      }
    } else {
      let j = i
      while (j < text.length && text[j] !== "*" && text[j] !== "`") {
        j++
      }
      if (j === i) { i++; continue }
      tokens.push({ type: "text", content: text.slice(i, j) })
      i = j
    }
  }

  return tokens
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split("\n")
  const blocks: MarkdownBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ""

    if (line.startsWith("```")) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        codeLines.push(lines[i] ?? "")
        i++
      }
      blocks.push({ type: "codeblock", language, content: codeLines.join("\n") })
      i++
      continue
    }

    if (/^#{1,6}\s/.test(line)) {
      const match = line.match(/^(#{1,6})\s+(.*)/)
      if (match) {
        blocks.push({ type: "heading", level: match[1]!.length, content: match[2] ?? "" })
      }
      i++
      continue
    }

    if (/^[\-\*]\s/.test(line) && !/^\*\*/.test(line)) {
      const inline = parseInlineMarkdown(line.replace(/^[\-\*]\s/, ""))
      blocks.push({ type: "list_item", tokens: inline, ordered: false })
      i++
      continue
    }

    if (/^\d+[\.\)]\s/.test(line)) {
      const match = line.match(/^(\d+)[\.\)]\s(.*)/)
      if (match) {
        const inline = parseInlineMarkdown(match[2] ?? "")
        blocks.push({ type: "list_item", tokens: inline, ordered: true, index: parseInt(match[1]!, 10) })
      }
      i++
      continue
    }

    const isDiffLine = /^[+\-]\s*/.test(line)
    if (isDiffLine) {
      const hunkLines: { prefix: string; content: string }[] = []
      while (i < lines.length && /^[+\-@ ]/.test(lines[i] ?? "")) {
        const hl = lines[i] ?? ""
        const prefix = hl[0] ?? " "
        hunkLines.push({ prefix, content: hl.slice(1) })
        i++
      }
      blocks.push({ type: "diff_hunk", lines: hunkLines })
      continue
    }

    if (line.trim() === "") {
      i++
      continue
    }

    const paraLines: string[] = []
    while (i < lines.length && (lines[i] ?? "").trim() !== "" && !(lines[i] ?? "").startsWith("```") && !(lines[i] ?? "").startsWith("#") && !/^[\-\*]\s/.test(lines[i] ?? "") && !/^\d+[\.\)]\s/.test(lines[i] ?? "") && !/^[+\-]/.test(lines[i] ?? "")) {
      paraLines.push(lines[i] ?? "")
      i++
    }
    const paraText = paraLines.join(" ")
    if (paraText.trim()) {
      blocks.push({ type: "paragraph", tokens: parseInlineMarkdown(paraText) })
    }
  }

  return blocks
}

function MarkdownContent({ content, color }: { content: string; color: string }) {
  const blocks = parseMarkdownBlocks(content)

  return (
    <Box flexDirection="column">
      {blocks.map((block, bi) => (
        <MarkdownBlockRenderer key={bi} block={block} baseColor={color} />
      ))}
    </Box>
  )
}

function MarkdownBlockRenderer({ block, baseColor }: { block: MarkdownBlock; baseColor: string }) {
  if (block.type === "paragraph") {
    return (
      <Box>
        <Text color={baseColor} wrap="wrap">
          {block.tokens.map((token, ti) => (
            <MarkdownTokenRenderer key={ti} token={token} />
          ))}
        </Text>
      </Box>
    )
  }

  if (block.type === "codeblock") {
    const lines = block.content.split("\n")
    const isDiff = block.language === "diff"
    const shouldHighlight = TS_LANGS.has(block.language)

    return (
      <Box flexDirection="column" marginTop={0} marginBottom={0}>
        <Box>
          <Text color={theme.colors.borderSubtle}>{theme.chars.thin}{theme.chars.thin}{theme.chars.thin}</Text>
        </Box>
        {block.language ? (
          <Box>
            <Text color={theme.colors.accentDim}>[{block.language}]</Text>
          </Box>
        ) : null}
        <Box flexDirection="column">
          {lines.map((line, li) => (
            <Box key={li} flexDirection="row">
              <Box flexShrink={0}>
                <Text color={theme.colors.accentDim}>{theme.chars.vertical} </Text>
              </Box>
              <Box flexShrink={1}>
                {isDiff ? (
                  <DiffCodeLine line={line} />
                ) : shouldHighlight ? (
                  <HighlightedLine line={line} />
                ) : line.trimStart().startsWith("//") || line.trimStart().startsWith("#") ? (
                  <Text dimColor color={theme.colors.comment}>{line}</Text>
                ) : (
                  <Text color={theme.colors.code}>{line}</Text>
                )}
              </Box>
            </Box>
          ))}
        </Box>
        <Box>
          <Text color={theme.colors.borderSubtle}>{theme.chars.thin}{theme.chars.thin}{theme.chars.thin}</Text>
        </Box>
      </Box>
    )
  }

  if (block.type === "heading") {
    return (
      <Box marginTop={block.level <= 2 ? 1 : 0}>
        <Text bold color={theme.colors.textBright} wrap="wrap">
          {block.level <= 2 ? `${theme.chars.diamond} ` : "  "}
          {block.content}
        </Text>
      </Box>
    )
  }

  if (block.type === "list_item") {
    const prefix = block.ordered
      ? ` ${block.index ?? 1}.`
      : ` ${theme.chars.bullet}`

    return (
      <Box>
        <Text color={theme.colors.accentDim}>{prefix} </Text>
        <Text color={baseColor} wrap="wrap">
          {block.tokens.map((token, ti) => (
            <MarkdownTokenRenderer key={ti} token={token} />
          ))}
        </Text>
      </Box>
    )
  }

  if (block.type === "diff_hunk") {
    return (
      <Box flexDirection="column" marginY={0}>
        {block.lines.map((line, li) => {
          const isAdd = line.prefix === "+"
          const isDel = line.prefix === "-"
          const lineColor = isAdd
            ? theme.colors.diffAdd
            : isDel
              ? theme.colors.diffDel
              : theme.colors.textDim

          return (
            <Box key={li}>
              <Text color={lineColor}>
                {isAdd ? theme.icons.diffAdd : isDel ? theme.icons.diffDel : " "}{line.content}
              </Text>
            </Box>
          )
        })}
      </Box>
    )
  }

  return null
}

function MarkdownTokenRenderer({ token }: { token: MarkdownToken }) {
  if (token.type === "text") return <>{token.content}</>
  if (token.type === "bold") return <Text bold color={theme.colors.textBright}>{token.content}</Text>
  if (token.type === "italic") return <Text italic color={theme.colors.textDim}>{token.content}</Text>
  if (token.type === "code") return <Text color={theme.colors.code}>{token.content}</Text>
  return null
}

function highlightTS(code: string): { text: string; color?: string; dim?: boolean }[] {
  const tokens: { text: string; color?: string; dim?: boolean }[] = []

  const kwSet = new Set([
    "const", "let", "var", "function", "class", "export", "import", "return",
    "if", "else", "async", "await", "for", "while", "try", "catch", "throw",
    "new", "extends", "implements", "interface", "type", "enum",
    "default", "from", "of", "in", "as", "is", "yield", "switch", "case",
    "break", "continue", "do", "typeof", "instanceof", "get", "set",
    "static", "readonly", "abstract", "public", "private", "protected",
    "null", "undefined", "true", "false", "this", "super",
  ])

  const keywordPattern = Array.from(kwSet).sort((a, b) => b.length - a.length).join("|")

  const pattern = new RegExp(
    `(\\b(?:${keywordPattern})\\b)|` +
    `("(?:[^"\\\\]|\\\\.)*")|` +
    `('(?:[^'\\\\]|\\\\.)*')|` +
    `(\`(?:[^\`\\\\]|\\\\.)*\`)|` +
    `(//[^\n]*)|` +
    `(/\\*[\\s\\S]*?\\*/)|` +
    `(\\b\\d+\\.?\\d*\\b)`,
    "g"
  )

  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index) })
    }

    if (match[1]) tokens.push({ text: match[1], color: theme.colors.keyword })
    else if (match[2] || match[3] || match[4]) tokens.push({ text: match[0], color: theme.colors.string })
    else if (match[5] || match[6]) tokens.push({ text: match[0], color: theme.colors.comment, dim: true })
    else if (match[7]) tokens.push({ text: match[0], color: theme.colors.number })
    else tokens.push({ text: match[0] })

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex) })
  }

  return tokens
}

function HighlightedLine({ line }: { line: string }) {
  const tokens = highlightTS(line)
  return (
    <Text>
      {tokens.map((tok, i) => (
        <Text key={i} color={tok.color} dimColor={tok.dim}>{tok.text}</Text>
      ))}
    </Text>
  )
}

function DiffCodeLine({ line }: { line: string }) {
  const prefix = line[0] ?? ""
  const isAdd = prefix === "+"
  const isDel = prefix === "-"
  const isContext = prefix === "@" && line.startsWith("@@")

  const lineColor = isAdd
    ? theme.colors.diffAdd
    : isDel
      ? theme.colors.diffDel
      : isContext
        ? theme.colors.textDim
        : theme.colors.code

  return (
    <Text color={lineColor}>{line}</Text>
  )
}
