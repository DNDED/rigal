import type { ArgentEngine } from "../engine.js"
import { execSync } from "child_process"

export function securityCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Security Scan                      ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const wd = engine.config.getWorkingDir()

  const scans: Array<{ name: string; run: () => string[] }> = [
    {
      name: "Secret Detection",
      run: () => scanForSecrets(wd),
    },
    {
      name: "Dependency Vulnerabilities",
      run: () => scanDependencies(wd),
    },
    {
      name: "File Permissions",
      run: () => scanFilePermissions(wd),
    },
    {
      name: "Git Exposure",
      run: () => scanGitExposure(wd),
    },
  ]

  let issueCount = 0

  for (const scan of scans) {
    lines.push(`  ── ${scan.name} ──`)
    const findings = scan.run()
    if (findings.length === 0) {
      lines.push("  ● No issues found.")
    } else {
      for (const finding of findings) {
        lines.push(`  ● ${finding}`)
        issueCount++
      }
    }
    lines.push("")
  }

  lines.push(`  Total issues: ${issueCount}`)

  if (issueCount === 0) {
    lines.push("  ● All scans passed.")
  }

  return lines.join("\n")
}

function scanForSecrets(wd: string): string[] {
  const findings: string[] = []

  const secretPatterns: Array<{ name: string; pattern: RegExp }> = [
    { name: "GitHub PAT", pattern: /ghp_[A-Za-z0-9]{36,}/ },
    { name: "GitHub OAuth", pattern: /gho_[A-Za-z0-9]{36,}/ },
    { name: "OpenAI API Key", pattern: /sk-(?:proj-)?[A-Za-z0-9_-]{32,}/ },
    { name: "Anthropic API Key", pattern: /sk-ant-[A-Za-z0-9_-]{32,}/ },
    { name: "Google API Key", pattern: /AIza[0-9A-Za-z_-]{32,}/ },
    { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/ },
    { name: "AWS Secret Key", pattern: /['"][A-Za-z0-9/+]{40}['"]/ },
    { name: "Private Key", pattern: /-----BEGIN (RSA|EC|DSA|OPENSSH)?\s*PRIVATE KEY-----/ },
    { name: "Slack Token", pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
    { name: "JWT Token", pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  ]

  try {
    const diff = execSync("git diff --unified=0", {
      cwd: wd,
      encoding: "utf-8",
      timeout: 10000,
      maxBuffer: 200 * 1024,
    })

    const addedLines = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"))

    for (const line of addedLines) {
      for (const sp of secretPatterns) {
        if (sp.pattern.test(line)) {
          findings.push(`${sp.name} pattern detected in diff`)
          break
        }
      }
    }
  } catch {
    // Not a git repo or no changes
  }

  return findings
}

function scanDependencies(wd: string): string[] {
  const findings: string[] = []

  try {
    const result = execSync("npm audit --json 2>&1 || true", {
      cwd: wd,
      encoding: "utf-8",
      timeout: 30000,
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh",
    })

    try {
      const parsed = JSON.parse(result)
      const vulns = parsed?.vulnerabilities ?? parsed?.metadata?.vulnerabilities ?? {}

      const counts: Record<string, number> = {}
      if (parsed?.metadata?.vulnerabilities) {
        for (const [key, val] of Object.entries(parsed.metadata.vulnerabilities)) {
          const n = val as number
          if (n > 0) counts[key] = n
        }
      }

      if (Object.keys(counts).length > 0) {
        for (const [severity, count] of Object.entries(counts)) {
          findings.push(`${count} ${severity} severity vulnerabilities`)
        }
      }
    } catch {
      if (result.includes("vulnerabilities")) {
        findings.push("Vulnerabilities found — run 'npm audit' for details")
      }
    }
  } catch {
    // npm audit not available or no package.json
  }

  return findings
}

function scanFilePermissions(wd: string): string[] {
  const findings: string[] = []

  try {
    const result = execSync('find . -type f -perm /111 -name "*.sh" 2>/dev/null | head -5', {
      cwd: wd,
      encoding: "utf-8",
      timeout: 5000,
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh",
    })

    const scripts = result.trim().split("\n").filter(Boolean)
    if (scripts.length >= 5) {
      findings.push(`${scripts.length} executable scripts found in project`)
    }
  } catch {
    // silent
  }

  return findings
}

function scanGitExposure(wd: string): string[] {
  const findings: string[] = []

  try {
    const result = execSync("git ls-files --cached .env .env.local .env.production 2>/dev/null || true", {
      cwd: wd,
      encoding: "utf-8",
      timeout: 5000,
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh",
    })

    const tracked = result.trim().split("\n").filter(Boolean)
    for (const t of tracked) {
      findings.push(`Environment file tracked in git: ${t}`)
    }
  } catch {
    // silent
  }

  return findings
}
