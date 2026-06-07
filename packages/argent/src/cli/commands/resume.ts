import type { ArgentEngine } from "../engine.js"

export function resumeCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Resume Session                     ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const sessions = engine.sessions.list()

  if (sessions.length === 0) {
    lines.push("  No saved sessions found.")
    lines.push("  Start a new conversation to create one.")
    return lines.join("\n")
  }

  const arg = args.join(" ")

  if (!arg) {
    lines.push("  Available sessions:")
    lines.push("")
    lines.push(`  ┌${"─".repeat(60)}┐`)

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i]
      if (!s) continue
      const isActive = s.id === engine.sessionId
      const marker = isActive ? "●" : "○"
      const num = String(i + 1).padStart(2, " ")
      const shortId = s.id.slice(-12)
      const agent = s.agentName.padEnd(8, " ")
      const msgs = String(s.messages.length).padStart(3, " ")
      const date = s.createdAt.toISOString().split("T")[0]
      lines.push(`  │ ${marker} [${num}] ${shortId}  ${agent}  ${msgs}msgs  ${date} │`)
    }

    lines.push(`  └${"─".repeat(60)}┘`)
    lines.push("")
    lines.push("  Use /resume <number> or /resume <session-id> to switch")
    return lines.join("\n")
  }

  const num = parseInt(arg, 10)
  let targetId: string | null = null

  if (!isNaN(num) && num >= 1 && num <= sessions.length) {
    targetId = sessions[num - 1]?.id ?? null
  } else {
    const match = sessions.find((s) => s.id.endsWith(arg) || s.id === arg)
    targetId = match?.id ?? null
  }

  if (!targetId) {
    lines.push(`  Session "${arg}" not found.`)
    return lines.join("\n")
  }

  if (targetId === engine.sessionId) {
    lines.push("  Already in this session.")
    return lines.join("\n")
  }

  const ok = engine.resumeSession(targetId)
  if (!ok) {
    lines.push(`  Failed to resume session "${targetId}".`)
    return lines.join("\n")
  }
  const resumed = engine.sessions.get(targetId)!

  lines.push(`  ● Resumed session ${resumed.id.slice(-12)}`)
  lines.push("")
  lines.push(`  Agent:      ${resumed.agentName}`)
  lines.push(`  Messages:   ${resumed.messages.length}`)
  lines.push(`  Directory:  ${resumed.workingDirectory}`)
  lines.push(`  Created:    ${resumed.createdAt.toISOString().split("T")[0]}`)

  return lines.join("\n")
}
