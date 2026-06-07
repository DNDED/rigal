import type { ArgentEngine } from "../engine.js"

export function forkCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Fork Session                       ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  if (!engine.sessionId) {
    lines.push("  No active session to fork.")
    return lines.join("\n")
  }

  const source = engine.sessions.get(engine.sessionId)
  if (!source) {
    lines.push("  Source session not found.")
    return lines.join("\n")
  }

  const name = args.join(" ") || `fork-${source.id.slice(-6)}`
  const fork = engine.sessions.create(
    source.agentName,
    source.model,
    source.workingDirectory
  )

  fork.messages = [...source.messages.map((m) => ({ ...m }))]
  fork.metadata = { ...source.metadata, forkedFrom: source.id }
  fork.updatedAt = new Date()

  if (!engine.resumeSession(fork.id)) {
    return "Failed to switch to the forked session."
  }

  lines.push(`  ● Session forked successfully.`)
  lines.push("")
  lines.push(`  Name:       ${name}`)
  lines.push(`  Fork ID:    ${fork.id}`)
  lines.push(`  Messages:   ${fork.messages.length} carried over`)
  lines.push(`  Agent:      ${fork.agentName}`)
  lines.push("")
  lines.push(`  You are now in the forked session.`)
  lines.push(`  Original session ${source.id} is preserved.`)

  return lines.join("\n")
}
