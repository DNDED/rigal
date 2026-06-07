import type { ArgentEngine } from "../engine.js"
import { execSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import { dirname, join, resolve } from "path"
import { fileURLToPath } from "url"

export function updateCommand(_engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Check for Updates                  ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  let currentVersion = "unknown"
  let latestVersion = ""

  currentVersion = findCurrentVersion()

  lines.push(`  Current version: ${currentVersion}`)

  try {
    const result = execSync("npm view argent version", {
      encoding: "utf-8",
      timeout: 15000,
    })
    latestVersion = result.trim()
  } catch {
    latestVersion = ""
  }

  if (latestVersion) {
    lines.push(`  Latest version:  ${latestVersion}`)
    lines.push("")

    if (currentVersion === latestVersion) {
      lines.push("  ● Already up to date!")
    } else if (currentVersion !== "unknown" && compareVersions(latestVersion, currentVersion) > 0) {
      lines.push("  ● An update is available!")
      lines.push(`  ${currentVersion} → ${latestVersion}`)
      lines.push("")
      lines.push("  Run /install to upgrade to the latest version.")
    } else {
      lines.push("  ● You may be on a development build.")
    }
  } else {
    lines.push("")
    lines.push("  ● Could not check for updates (network issue?).")
  }

  return lines.join("\n")
}

function findCurrentVersion(): string {
  const searchRoots = [
    dirname(fileURLToPath(import.meta.url)),
    process.argv[1] ? dirname(resolve(process.argv[1])) : undefined,
    process.cwd(),
  ].filter((value): value is string => Boolean(value))

  for (const root of searchRoots) {
    const version = findVersionInAncestors(root)
    if (version) return version
  }

  return "unknown"
}

function findVersionInAncestors(startDir: string): string | null {
  let dir = resolve(startDir)

  while (true) {
    const pkgPath = join(dir, "package.json")
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { name?: string; version?: string }
        if (pkg.name === "argent" && pkg.version) {
          return pkg.version
        }
      } catch {
        // keep searching upward
      }
    }

    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}
