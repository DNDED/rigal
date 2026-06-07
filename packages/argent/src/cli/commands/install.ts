import type { ArgentEngine } from "../engine.js"
import { execSync } from "child_process"

export function installCommand(args: string[], _engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Install / Upgrade ARGENT            ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const method = args[0]?.toLowerCase()

  if (method === "npm" || !method) {
    lines.push("  Installing via npm...")
    try {
      const result = execSync("npm install -g argent@latest 2>&1", {
        encoding: "utf-8",
        timeout: 60000,
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
      })
      const trimmed = result.trim()
      if (trimmed) {
        for (const l of trimmed.split("\n").slice(0, 10)) {
          lines.push(`  ${l.trim()}`)
        }
      }
      lines.push("")
      lines.push("  ● Installation complete!")
      lines.push("  Restart ARGENT to use the new version.")
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      const output = (e.stdout || e.stderr || "").trim()
      if (output) {
        for (const l of output.split("\n").slice(0, 10)) {
          lines.push(`  ${l.trim()}`)
        }
      }
      lines.push("")
      lines.push(`  ● Installation failed: ${e.message || "Unknown error"}`)
      lines.push("  Try running manually: npm install -g argent@latest")
    }
  } else if (method === "build" || method === "source") {
    lines.push("  Source install steps:")
    lines.push("")
    lines.push("    git clone https://github.com/DNDED/argent.git")
    lines.push("    cd argent")
    lines.push("    bun install")
    lines.push("    bun run build")
    lines.push("    npm link ./packages/argent")
  } else {
    lines.push(`  Unknown method: ${method}`)
    lines.push("")
    lines.push("  Usage:")
    lines.push("    /install          Install via npm (default)")
    lines.push("    /install npm      Install via npm")
    lines.push("    /install source   Build from source")
  }

  return lines.join("\n")
}
