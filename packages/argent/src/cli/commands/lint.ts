import type { ArgentEngine } from "../engine.js"
import { execSync } from "child_process"
import { existsSync } from "fs"
import { join } from "path"

export function lintCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Lint — Run Code Quality Checks      ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const wd = engine.config.getWorkingDir()

  const detectors: Array<{ name: string; cmd: string; files: string[] }> = [
    { name: "ESLint", cmd: "npx eslint --no-color --format compact 2>&1", files: [".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json", ".eslintrc.yaml", ".eslintrc.yml", "eslint.config.js", "eslint.config.mjs", "eslint.config.cjs"] },
    { name: "Biome", cmd: "npx biome check --no-errors-on-unmatched 2>&1", files: ["biome.json", "biome.jsonc"] },
    { name: "Prettier", cmd: "npx prettier --check . 2>&1", files: [".prettierrc", ".prettierrc.json", ".prettierrc.yaml", ".prettierrc.js", "prettier.config.js"] },
    { name: "tsc", cmd: "npx tsc --noEmit 2>&1", files: ["tsconfig.json"] },
    { name: "oxlint", cmd: "npx oxlint 2>&1", files: [".oxlintrc.json", ".oxlint.json"] },
  ]

  let found = false

  for (const detector of detectors) {
    const hasConfig = detector.files.some((f) => existsSync(join(wd, f)))
    if (!hasConfig) continue

    found = true
    lines.push(`  ── ${detector.name} ──`)

    try {
      const output = execSync(detector.cmd, {
        cwd: wd,
        encoding: "utf-8",
        timeout: 60000,
        maxBuffer: 500 * 1024,
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
      })

      const trimmed = output.trim()
      if (trimmed) {
        const filtered = trimmed
          .split("\n")
          .filter((l) => l.trim())
          .slice(0, 30)
        for (const fl of filtered) {
          lines.push(`  ${fl}`)
        }
        if (trimmed.split("\n").length > 30) {
          lines.push(`  ... (${trimmed.split("\n").length - 30} more lines)`)
        }
      } else {
        lines.push("  ● No issues found.")
      }
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string; status?: number }
      const output = (e.stdout || e.stderr || "").trim()
      if (output) {
        const filtered = output
          .split("\n")
          .filter((l) => l.trim())
          .slice(0, 30)
        for (const fl of filtered) {
          lines.push(`  ${fl}`)
        }
        if (output.split("\n").length > 30) {
          lines.push(`  ... (${output.split("\n").length - 30} more lines)`)
        }
      } else {
        lines.push(`  ● ${detector.name} found issues (exit code: ${e.status})`)
      }
    }

    lines.push("")
  }

  if (!found) {
    lines.push("  No linter configuration found in this project.")
    lines.push("")
    lines.push("  Try running:")
    lines.push("    npx eslint --init")
    lines.push("    npx biome init")
    lines.push("  or add a tsconfig.json for TypeScript checking.")
  }

  return lines.join("\n")
}
