import type { ArgentEngine } from "../engine.js"

let commandHistory: string[] = []
const MAX_HISTORY = 100

export function addToHistory(input: string): void {
  if (!input.startsWith("/")) return
  commandHistory.unshift(input)
  if (commandHistory.length > MAX_HISTORY) {
    commandHistory.length = MAX_HISTORY
  }
}

export function historyCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Command History                    ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  if (commandHistory.length === 0) {
    lines.push("  No commands in history yet.")
    return lines.join("\n")
  }

  const limit = args.length > 0 ? parseInt(args[0]!, 10) || 20 : 20
  const entries = commandHistory.slice(0, Math.min(limit, commandHistory.length))

  lines.push(`  Last ${entries.length} commands:`)
  lines.push("")

  for (let i = 0; i < entries.length; i++) {
    const num = String(i + 1).padStart(3, " ")
    lines.push(`  ${num}. ${entries[i]}`)
  }

  lines.push("")
  lines.push(`  Total commands in history: ${commandHistory.length}`)

  return lines.join("\n")
}
