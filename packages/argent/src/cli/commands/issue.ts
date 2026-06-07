import type { ArgentEngine } from "../engine.js"
import { execSync } from "child_process"

export function issueCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Create GitHub Issue                ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const title = args.join(" ")

  if (!title) {
    lines.push("  Usage: /issue <title>")
    lines.push("")
    lines.push("  Creates a new GitHub issue in the current")
    lines.push("  repository with the given title.")
    lines.push("")
    lines.push("  Example: /issue Add dark mode support")
    lines.push("")
    lines.push("  Use /issue list to see existing issues.")
    return lines.join("\n")
  }

  const wd = engine.config.getWorkingDir()

  if (title.toLowerCase() === "list") {
    try {
      execSync("gh --version", { encoding: "utf-8", timeout: 5000 })
    } catch {
      lines.push("  GitHub CLI (gh) is not installed.")
      lines.push("  Install it from: https://cli.github.com/")
      return lines.join("\n")
    }

    try {
      const result = execSync("gh issue list --limit 15 --state open 2>&1", {
        cwd: wd,
        encoding: "utf-8",
        timeout: 15000,
        shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh",
      })

      lines.push("  Open issues:")
      lines.push("")
      for (const l of result.trim().split("\n")) {
        lines.push(`  ${l}`)
      }
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      lines.push(`  Error: ${e.message || "Unknown error"}`)
    }
    return lines.join("\n")
  }

  try {
    execSync("gh --version", { encoding: "utf-8", timeout: 5000 })
  } catch {
    lines.push("  GitHub CLI (gh) is not installed.")
    lines.push("  Install it from: https://cli.github.com/")
    return lines.join("\n")
  }

  const body = `Issue created by ARGENT from the CLI.\n\nTitle: ${title}`

  try {
    const escapedTitle = title.replace(/'/g, "'\\''")
    const escapedBody = body.replace(/'/g, "'\\''")
    const result = execSync(`gh issue create --title '${escapedTitle}' --body '${escapedBody}' 2>&1`, {
      cwd: wd,
      encoding: "utf-8",
      timeout: 30000,
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh",
    })

    lines.push(`  ● Issue created:`)
    lines.push(`  ${result.trim()}`)
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    const output = (e.stdout || e.stderr || "").trim()
    if (output) {
      lines.push(`  ${output}`)
    } else {
      lines.push(`  ● Issue creation failed: ${e.message || "Unknown error"}`)
    }
  }

  return lines.join("\n")
}
