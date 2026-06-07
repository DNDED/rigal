import type { ArgentEngine } from "../engine.js"
import { execSync } from "child_process"

export function reviewCommand(args: string[], engine: ArgentEngine): string {
  const wd = engine.config.getWorkingDir()

  let statOutput = ""
  try {
    statOutput = execSync("git diff --stat", { cwd: wd, encoding: "utf-8", timeout: 10000 })
  } catch {
    return "Not a git repository or git not available."
  }

  if (!statOutput.trim()) {
    return "No pending changes to review."
  }

  const subcmd = args[0]?.toLowerCase()

  if (subcmd === "deep" || subcmd === "ai") {
    try {
      const fullDiff = execSync("git diff", {
        cwd: wd,
        encoding: "utf-8",
        timeout: 10000,
        maxBuffer: 500 * 1024,
      })

      const truncated = fullDiff.length > 8000 ? fullDiff.slice(0, 8000) + "\n[diff truncated]" : fullDiff

      return `REVIEW_DIFF:Review the following git diff for bugs, security issues, design problems, and improvements. Be concise:\n\n${truncated}`
    } catch {
      return "Could not read git diff."
    }
  }

  const lines: string[] = []
  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Code Review — Pending Changes       ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const summaryLine = statOutput.trim().split("\n").pop() || ""
  lines.push(`  Summary: ${summaryLine}`)
  lines.push("")

  let changedFiles: string[] = []
  try {
    changedFiles = execSync("git diff --name-only", { cwd: wd, encoding: "utf-8", timeout: 10000 })
      .trim()
      .split("\n")
      .filter(Boolean)
  } catch {
    lines.push("  (warning: could not list changed files)")
  }

  lines.push("  Changed files:")
  lines.push("")
  for (const file of changedFiles) {
    const ext = file.split(".").pop()?.toLowerCase() ?? ""
    const icon = getFileIcon(ext)
    lines.push(`  ${icon}  ${file}`)
  }

  lines.push("")
  lines.push("  ── Static Checks ──")

  const warnings: string[] = []
  try {
    const fullDiff = execSync("git diff", { cwd: wd, encoding: "utf-8", timeout: 10000, maxBuffer: 500 * 1024 })

    if (fullDiff.includes("TODO") || fullDiff.includes("FIXME") || fullDiff.includes("HACK")) {
      warnings.push("  ● TODOs/FIXMEs/HACKs found in diff")
    }

    const secretPatterns = [/sk-[A-Za-z0-9]{32,}/, /AIza[0-9A-Za-z_-]{32,}/, /ghp_[A-Za-z0-9]{36,}/, /-----BEGIN.*PRIVATE KEY-----/]
    for (const pattern of secretPatterns) {
      if (pattern.test(fullDiff)) {
        warnings.push("  ● Potential secret/credential detected!")
        break
      }
    }

    if (fullDiff.includes("console.log") || fullDiff.includes("console.debug")) {
      warnings.push("  ● Console statements found")
    }

    if (fullDiff.includes("debugger")) {
      warnings.push("  ● debugger statement found")
    }
  } catch {}

  if (warnings.length > 0) {
    for (const w of warnings) lines.push(w)
  } else {
    lines.push("  ● No issues detected.")
  }

  lines.push("")
  lines.push("  For AI model review: /review deep")

  return lines.join("\n")
}

function getFileIcon(ext: string): string {
  const icons: Record<string, string> = {
    ts: "[TS]", tsx: "[TX]", js: "[JS]", jsx: "[JX]", json: "{ }",
    md: "[MD]", css: "[# ]", html: "<>", yml: "[Y]", yaml: "[Y]",
    toml: "[T]", sh: "[SH]", py: "[PY]", rs: "[RS]", go: "[GO]",
    java: "[JV]", rb: "[RB]",
  }
  return icons[ext] ?? "   "
}
