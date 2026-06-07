import type { ArgentEngine } from "../engine.js"

export function rewindCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Rewind — Choose Checkpoint         ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  if (!engine.sessionId) {
    lines.push("  No active session to rewind.")
    return lines.join("\n")
  }

  const session = engine.sessions.get(engine.sessionId)
  if (!session) {
    lines.push("  Session not found.")
    return lines.join("\n")
  }

  const arg = args[0]
  if (arg !== undefined && /^\d+$/.test(arg)) {
    const checkpointNum = parseInt(arg, 10)
    const checkpoints = findCheckpoints(session.messages)
    const cp = checkpoints[checkpointNum - 1]
    if (!cp) {
      lines.push(`  Checkpoint ${checkpointNum} not found.`)
      lines.push(`  Available: 1–${checkpoints.length}`)
      return lines.join("\n")
    }

    const originalCount = session.messages.length
    const ok = engine.rewindToCheckpoint(cp.index)
    if (ok) {
      lines.push(`  ● Rewound to checkpoint ${checkpointNum}`)
      lines.push(`  "${cp.preview}"`)
      lines.push(`  Messages truncated from ${originalCount} to ${cp.index}`)
    } else {
      lines.push("  ● Could not rewind to that checkpoint.")
    }
    return lines.join("\n")
  }

  const checkpoints = findCheckpoints(session.messages)

  if (checkpoints.length === 0) {
    lines.push("  No checkpoints available in this session.")
    return lines.join("\n")
  }

  lines.push("  Choose a checkpoint to rewind to:")
  lines.push("")
  lines.push(`  ┌${"─".repeat(62)}┐`)
  lines.push(`  │  #    Type     Preview                                    │`)
  lines.push(`  ├${"─".repeat(62)}┤`)

  for (const cp of checkpoints) {
    const num = String(cp.num).padStart(3, " ")
    const type = cp.type.padEnd(8, " ")
    const preview = cp.preview.padEnd(42, " ").slice(0, 42)
    lines.push(`  │ ${num}  ${type} ${preview} │`)
  }

  lines.push(`  └${"─".repeat(62)}┘`)
  lines.push("")
  lines.push("  Use /rewind <number> to jump to a checkpoint.")

  return lines.join("\n")
}

function findCheckpoints(messages: import("@argent/core").Message[]): Array<{ num: number; index: number; type: string; preview: string }> {
  const result: Array<{ num: number; index: number; type: string; preview: string }> = []
  let num = 0

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (!msg) continue
    if (msg.role === "user") {
      num++
      const text = msg.content?.[0]?.text ?? "(no text)"
      const preview = text.length > 50 ? text.slice(0, 47) + "..." : text
      result.push({ num, index: i, type: "user", preview })
    }
  }

  return result
}
