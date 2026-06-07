import type { ArgentEngine } from "../engine.js"

export function compactCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Session Compact                    ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  if (!engine.sessionId) {
    lines.push("  No active session to compact.")
    return lines.join("\n")
  }

  const session = engine.sessions.get(engine.sessionId)
  if (!session) {
    lines.push("  Session not found.")
    return lines.join("\n")
  }

  const msgCount = session.messages.length
  if (msgCount < 4) {
    lines.push("  Session is already small — no compaction needed.")
    lines.push(`  Messages: ${msgCount}`)
    return lines.join("\n")
  }

  const originalMessages = session.messages
  const userMsgs = originalMessages.filter((m) => m.role === "user")
  const assistantMsgs = originalMessages.filter((m) => m.role === "assistant")

  const summary = [
    `Session compacted: ${userMsgs.length} user turns, ${assistantMsgs.length} assistant responses.`,
    `Working directory: ${session.workingDirectory}`,
    `Agent: ${session.agentName}`,
  ].join("\n")

  const compacted = originalMessages.slice(-4)
  session.messages = compacted
  session.metadata.compacted = "true"
  session.metadata.summary = summary
  session.metadata.compactedMessages = JSON.stringify(originalMessages)
  engine.sessions.markDirty(engine.sessionId)

  lines.push("  ● Session compacted successfully.")
  lines.push("")
  lines.push(`  Messages reduced: ${msgCount} → ${compacted.length}`)
  lines.push(`  ${userMsgs.length - compacted.filter((m) => m.role === "user").length} user turns summarized`)
  lines.push("")
  lines.push("  The assistant will receive a summary of the")
  lines.push("  compacted conversation context.")

  return lines.join("\n")
}
