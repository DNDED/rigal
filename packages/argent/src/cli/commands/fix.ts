import type { ArgentEngine } from "../engine.js"
import { execSync } from "child_process"

export function fixCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Fix GitHub Issue                   ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const wd = engine.config.getWorkingDir()

  const issue = args.join(" ")
  if (!issue) {
    lines.push("  Usage: /fix <issue-number>")
    lines.push("")
    lines.push("  Attempts to fix a GitHub issue by:")
    lines.push("    1. Fetching the issue details")
    lines.push("    2. Analyzing the codebase")
    lines.push("    3. Proposing and applying a fix")
    lines.push("")
    lines.push("  Example: /fix 42")
    lines.push("  Example: /fix https://github.com/owner/repo/issues/42")
    return lines.join("\n")
  }

  try {
    execSync("gh --version", { encoding: "utf-8", timeout: 5000 })
  } catch {
    lines.push("  GitHub CLI (gh) is not installed.")
    lines.push("  Install it from: https://cli.github.com/")
    return lines.join("\n")
  }

  let issueNum = issue

  const urlMatch = issue.match(/github\.com\/[^\/]+\/[^\/]+\/issues\/(\d+)/)
  if (urlMatch) {
    issueNum = urlMatch[1]!
  }

  issueNum = issueNum.replace(/^#/, "")

  if (!/^\d+$/.test(issueNum)) {
    lines.push(`  Invalid issue reference: ${issue}`)
    lines.push("  Use a number like /fix 42 or a full GitHub URL")
    return lines.join("\n")
  }

  lines.push(`  Fetching issue #${issueNum}...`)
  lines.push("")

  if (!/^\d+$/.test(issueNum)) {
    lines.push(`  Invalid issue number: ${issueNum}`)
    return lines.join("\n")
  }

  try {
    const issueData = execSync(`gh issue view ${issueNum} --json title,body,state,labels 2>&1`, {
      cwd: wd,
      encoding: "utf-8",
      timeout: 15000,
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh",
    })

    try {
      const parsed = JSON.parse(issueData)
      lines.push(`  Title:  ${parsed.title}`)
      lines.push(`  State:  ${parsed.state}`)
      if (parsed.labels?.length) {
        lines.push(`  Labels: ${parsed.labels.map((l: { name: string }) => l.name).join(", ")}`)
      }
      lines.push("")
      lines.push("  ── Issue Body ──")
      const body = (parsed.body || "").split("\n").slice(0, 15)
      for (const l of body) {
        lines.push(`  ${l}`)
      }
      if ((parsed.body || "").split("\n").length > 15) {
        lines.push("  ... (truncated)")
      }
    } catch {
      lines.push(`  ${issueData.trim()}`)
    }
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    lines.push(`  Error fetching issue: ${e.message || "Unknown error"}`)
    lines.push("  Make sure you're in a GitHub repo and issue exists.")
    return lines.join("\n")
  }

  lines.push("")
  lines.push("  ── Fix Strategy ──")
  lines.push("  ARGENT will now:")
  lines.push("  1. Search the codebase for relevant code")
  lines.push("  2. Analyze the root cause")
  lines.push("  3. Propose changes to resolve the issue")
  lines.push("")
  lines.push("  Reply with any additional context or type")
  lines.push("  'proceed' to let ARGENT attempt the fix.")

  return lines.join("\n")
}
