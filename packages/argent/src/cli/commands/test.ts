import type { ArgentEngine } from "../engine.js"
import { execSync } from "child_process"
import { existsSync } from "fs"
import { join } from "path"

export function testCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Run Tests                          ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const wd = engine.config.getWorkingDir()
  const pattern = args.join(" ") || undefined

  const testRunners: Array<{ name: string; cmd: (pattern?: string) => string; detect: () => boolean }> = [
    {
      name: "vitest",
      cmd: (p) => p ? `npx vitest run '${p.replace(/'/g, "'\\''")}' 2>&1` : "npx vitest run 2>&1",
      detect: () => existsSync(join(wd, "vitest.config.ts")) || existsSync(join(wd, "vitest.config.js")) || existsSync(join(wd, "vitest.config.mjs")),
    },
    {
      name: "jest",
      cmd: (p) => p ? `npx jest '${p.replace(/'/g, "'\\''")}' --no-color 2>&1` : "npx jest --no-color 2>&1",
      detect: () => existsSync(join(wd, "jest.config.ts")) || existsSync(join(wd, "jest.config.js")) || existsSync(join(wd, "jest.config.mjs")) || existsSync(join(wd, "jest.config.json")),
    },
    {
      name: "bun test",
      cmd: (p) => p ? `bun test '${p.replace(/'/g, "'\\''")}' 2>&1` : "bun test 2>&1",
      detect: () => existsSync(join(wd, "bunfig.toml")) || existsSync(join(wd, "bun.lock")),
    },
    {
      name: "mocha",
      cmd: (p) => p ? `npx mocha --grep '${p.replace(/'/g, "'\\''")}' 2>&1` : "npx mocha 2>&1",
      detect: () => existsSync(join(wd, ".mocharc.json")) || existsSync(join(wd, ".mocharc.js")) || existsSync(join(wd, ".mocharc.yaml")),
    },
    {
      name: "pytest",
      cmd: (p) => p ? `python -m pytest -k '${p.replace(/'/g, "'\\''")}' -v 2>&1` : "python -m pytest -v 2>&1",
      detect: () => existsSync(join(wd, "pytest.ini")) || existsSync(join(wd, "pyproject.toml")) || existsSync(join(wd, "tox.ini")),
    },
    {
      name: "cargo test",
      cmd: (p) => p ? `cargo test '${p.replace(/'/g, "'\\''")}' 2>&1` : "cargo test 2>&1",
      detect: () => existsSync(join(wd, "Cargo.toml")),
    },
    {
      name: "go test",
      cmd: (p) => p ? `go test -run '${p.replace(/'/g, "'\\''")}' ./... 2>&1` : "go test ./... 2>&1",
      detect: () => existsSync(join(wd, "go.mod")),
    },
  ]

  let found = false

  for (const runner of testRunners) {
    if (!runner.detect()) continue

    found = true
    lines.push(`  ── ${runner.name} ──`)

    try {
      const output = execSync(runner.cmd(pattern), {
        cwd: wd,
        encoding: "utf-8",
        timeout: 120000,
        maxBuffer: 500 * 1024,
        shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh",
      })

      const filtered = output
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 40)

      for (const fl of filtered) {
        const trimmed = fl.trim()
        if (trimmed.startsWith("✓") || trimmed.startsWith("✔") || trimmed.includes("passed") || trimmed.includes("ok")) {
          lines.push(`  ✓ ${trimmed}`)
        } else if (trimmed.startsWith("✗") || trimmed.startsWith("✘") || trimmed.includes("FAIL") || trimmed.includes("fail")) {
          lines.push(`  ✗ ${trimmed}`)
        } else {
          lines.push(`  ${trimmed}`)
        }
      }

      if (output.split("\n").length > 40) {
        lines.push(`  ... (${output.split("\n").length - 40} more lines)`)
      }
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      const errOutput = (e.stdout || e.stderr || "").trim()
      if (errOutput) {
        const errLines = errOutput.split("\n").filter((l) => l.trim()).slice(0, 30)
        for (const el of errLines) {
          lines.push(`  ${el.trim()}`)
        }
        if (errOutput.split("\n").length > 30) {
          lines.push(`  ... (${errOutput.split("\n").length - 30} more lines)`)
        }
      }
    }

    lines.push("")
    break
  }

  if (!found) {
    lines.push("  No test runner detected in this project.")
    lines.push("")
    lines.push("  Supported runners:")
    lines.push("    - vitest, jest, mocha (JS/TS)")
    lines.push("    - bun test")
    lines.push("    - pytest (Python)")
    lines.push("    - cargo test (Rust)")
    lines.push("    - go test (Go)")
    lines.push("")
    lines.push("  Add a test config file to enable /test.")
  }

  return lines.join("\n")
}
