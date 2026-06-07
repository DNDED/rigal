import type { ArgentEngine } from "../engine.js"

export function renameCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Rename Session                     ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  if (!engine.sessionId) {
    lines.push("  No active session to rename.")
    return lines.join("\n")
  }

  const session = engine.sessions.get(engine.sessionId)
  if (!session) {
    lines.push("  Session not found.")
    return lines.join("\n")
  }

  if (args.length === 0) {
    const currentName = session.metadata?.name ?? "(unnamed)"
    lines.push(`  Current name: ${currentName}`)
    lines.push(`  Session ID:   ${session.id.slice(-12)}`)
    lines.push("")
    lines.push("  Use /rename <new-name> to set a name.")
    return lines.join("\n")
  }

  const newName = args.join(" ")
  session.metadata = { ...session.metadata, name: newName }
  session.updatedAt = new Date()

  lines.push(`  ● Session renamed to: ${newName}`)
  lines.push(`  Session ID: ${session.id.slice(-12)}`)

  return lines.join("\n")
}
