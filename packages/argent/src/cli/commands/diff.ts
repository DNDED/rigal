import type { ArgentEngine } from "../engine.js"
import { execSync } from "child_process"

export function diffCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Inline Diffs — Pending Changes      ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const wd = engine.config.getWorkingDir()

  try {
    const output = execSync("git diff --stat", { cwd: wd, encoding: "utf-8", timeout: 10000 })

    if (!output.trim()) {
      lines.push("  No changes detected in the working tree.")
      return lines.join("\n")
    }

    const statLines = output.trim().split("\n")
    const fileChanges: Array<{ file: string; added: number; removed: number; total: number }> = []

    for (const sl of statLines) {
      const match = sl.match(/^(.+?)\s+\|\s+(\d+)\s+([+-]+)$/)
      if (match) {
        const file = match[1]!.trim()
        const total = parseInt(match[2]!, 10)
        const plusMinus = match[3]!
        const added = (plusMinus.match(/\+/g) || []).length
        const removed = (plusMinus.match(/-/g) || []).length
        fileChanges.push({ file, added, removed, total })
      }
    }

    if (fileChanges.length === 0) {
      lines.push("  No tracked file changes detected.")
      return lines.join("\n")
    }

    lines.push(`  Changed files: ${fileChanges.length}`)
    lines.push("")
    lines.push(`  ┌${"─".repeat(68)}┐`)
    lines.push(`  │  File                                         +/-    Chgs │`)
    lines.push(`  ├${"─".repeat(68)}┤`)

    for (const fc of fileChanges) {
      const file = fc.file.length > 48 ? "..." + fc.file.slice(-45) : fc.file.padEnd(48, " ")
      const diff = `+${fc.added}/-${fc.removed}`.padEnd(8, " ")
      const chgs = String(fc.total).padStart(4, " ")
      lines.push(`  │ ${file} ${diff}  ${chgs} │`)
    }

    lines.push(`  └${"─".repeat(68)}┘`)
    lines.push("")

    try {
      const diffOutput = execSync("git diff --unified=3", { cwd: wd, encoding: "utf-8", timeout: 10000, maxBuffer: 100 * 1024 })
      if (diffOutput.trim()) {
        const diffLines = diffOutput.trim().split("\n").slice(0, 80)
        lines.push("  ── Diff preview (first 80 lines) ──")
        for (const dl of diffLines) {
          if (dl.startsWith("+") && !dl.startsWith("+++")) {
            lines.push(`   + ${dl.slice(1)}`)
          } else if (dl.startsWith("-") && !dl.startsWith("---")) {
            lines.push(`   - ${dl.slice(1)}`)
          } else if (dl.startsWith("@@")) {
            lines.push(`   @ ${dl}`)
          } else if (!dl.startsWith("diff") && !dl.startsWith("index") && !dl.startsWith("---") && !dl.startsWith("+++")) {
            lines.push(`     ${dl}`)
          }
        }
        if (diffLines.length === 80) {
          lines.push("  ... (truncated)")
        }
      }
    } catch {
      lines.push("  (Could not render detail diff)")
    }

  } catch (err) {
    lines.push(`  Error running git diff: ${err instanceof Error ? err.message : String(err)}`)
    lines.push("  Make sure this is a git repository.")
  }

  return lines.join("\n")
}
