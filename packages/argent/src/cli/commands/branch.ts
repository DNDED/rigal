import type { ArgentEngine } from "../engine.js"

export function branchCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Create Branch                      ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  if (!engine.sessionId) {
    lines.push("  No active session — creating a new one.")
  }

  const name = args.join(" ") || `branch-${Date.now().toString(36)}`

  const source = engine.sessionId ? engine.sessions.get(engine.sessionId) : null

  const branch = engine.sessions.create(
    source?.agentName ?? "build",
    source?.model ?? { provider: "none", model: "unknown" },
    source?.workingDirectory ?? engine.config.getWorkingDir()
  )

  if (source) {
    branch.messages = [...source.messages.map((m) => ({ ...m }))]
  }

  branch.metadata = {
    ...(source?.metadata ?? {}),
    branch: name,
    parentSession: engine.sessionId ?? "root",
  }

  if (!engine.resumeSession(branch.id)) {
    return "Failed to switch to the new branch."
  }

  lines.push(`  ● Branch created: ${name}`)
  lines.push("")
  lines.push(`  Session ID:  ${branch.id.slice(-12)}`)
  lines.push(`  Messages:    ${branch.messages.length}`)
  if (source) {
    lines.push(`  Parent:      ${source.id.slice(-12)}`)
  }
  lines.push("")
  lines.push("  You are now working in the branched session.")

  return lines.join("\n")
}
