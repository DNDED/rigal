import type { ArgentEngine } from "../engine.js"

export function contextCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Context Window Usage               ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  if (!engine.sessionId) {
    lines.push("  No active session.")
    lines.push("")
    lines.push("  Context size depends on the model:")
    lines.push(`    GPT-4o:     128K tokens`)
    lines.push(`    Claude 3.5: 200K tokens`)
    lines.push(`    Gemini 2.5: 1M tokens`)
    return lines.join("\n")
  }

  const session = engine.sessions.get(engine.sessionId)
  if (!session) {
    lines.push("  Session not found.")
    return lines.join("\n")
  }

  const messages = session.messages

  let estimatedTokens = 0
  const breakdown: Array<{ category: string; count: number; tokens: number }> = []

  const systemPromptTokens = 500
  breakdown.push({ category: "System prompt", count: 1, tokens: systemPromptTokens })
  estimatedTokens += systemPromptTokens

  const userMsgs = messages.filter((m) => m.role === "user")
  let userTokens = 0
  for (const m of userMsgs) {
    const content = Array.isArray(m.content) ? m.content as Array<{ text?: string }> : []
    const text = content.map((c) => c.text || "").join(" ")
    userTokens += estimateTokens(text)
  }
  breakdown.push({ category: "User messages", count: userMsgs.length, tokens: userTokens })
  estimatedTokens += userTokens

  const assistantMsgs = messages.filter((m) => m.role === "assistant")
  let assistantTokens = 0
  for (const m of assistantMsgs) {
    const content = Array.isArray(m.content) ? m.content as Array<{ text?: string }> : []
    const text = content.map((c) => c.text || "").join(" ")
    assistantTokens += estimateTokens(text)
  }
  breakdown.push({ category: "Assistant messages", count: assistantMsgs.length, tokens: assistantTokens })
  estimatedTokens += assistantTokens

  const toolMsgs = messages.filter((m) => m.role === "tool")
  let toolTokens = 0
  for (const m of toolMsgs) {
    const content = Array.isArray(m.content) ? m.content as Array<{ text?: string }> : []
    const text = content.map((c) => c.text || "").join(" ")
    toolTokens += estimateTokens(text)
  }
  breakdown.push({ category: "Tool results", count: toolMsgs.length, tokens: toolTokens })
  estimatedTokens += toolTokens

  const modelName = session.model.model || "unknown"
  let contextLimit = 128000

  if (modelName.toLowerCase().includes("claude")) contextLimit = 200000
  else if (modelName.toLowerCase().includes("gemini-2.5")) contextLimit = 1000000
  else if (modelName.toLowerCase().includes("gemini")) contextLimit = 1000000
  else if (modelName.toLowerCase().includes("gpt-4")) contextLimit = 128000
  else if (modelName.toLowerCase().includes("o1") || modelName.toLowerCase().includes("o3")) contextLimit = 200000

  const pct = Math.round((estimatedTokens / contextLimit) * 100)
  const barLen = 50
  const filled = Math.round((estimatedTokens / contextLimit) * barLen)
  const empty = barLen - filled

  lines.push(`  Model context limit: ${formatTokens(contextLimit)}`)
  lines.push(`  Estimated usage:     ${formatTokens(estimatedTokens)} (${pct}%)`)
  lines.push("")

  const bar = "█".repeat(Math.min(filled, barLen)) + "░".repeat(Math.max(0, empty))
  lines.push(`  [${bar}]`)

  lines.push("")
  lines.push("  ── Token Breakdown ──")
  lines.push("")
  lines.push(`  ┌${"─".repeat(56)}┐`)
  lines.push(`  │  Category              Count    Tokens       %      │`)
  lines.push(`  ├${"─".repeat(56)}┤`)

  for (const b of breakdown) {
    const category = b.category.padEnd(22, " ")
    const count = String(b.count).padStart(6, " ")
    const tokens = formatTokens(b.tokens).padStart(8, " ")
    const bpct = estimatedTokens === 0 ? "  0.0%" : ((b.tokens / estimatedTokens) * 100).toFixed(1).padStart(5, " ") + "%"
    lines.push(`  │ ${category} ${count} ${tokens}  ${bpct}    │`)
  }

  lines.push(`  └${"─".repeat(56)}┘`)

  if (pct > 80) {
    lines.push("")
    lines.push("  ● Warning: Context is nearly full.")
    lines.push("  Consider running /compact to reduce usage.")
  }

  lines.push("")
  lines.push(`  Model: ${modelName}`)
  lines.push(`  Messages in session: ${messages.length}`)

  return lines.join("\n")
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5)
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
