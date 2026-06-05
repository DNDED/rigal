import type { ToolDef, ToolContext, ToolResult } from "@rigal/core"
import { readFileSync, readdirSync, statSync } from "fs"
import { join, relative } from "path"

export const grepTool: ToolDef = {
  name: "grep",
  description: "Fast regex content search across files. Returns matching file paths and line numbers.",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regex pattern to search for" },
      include: { type: "string", description: "File pattern filter, e.g. '*.ts' or '*.{ts,tsx}'" },
      path: { type: "string", description: "Directory to search in (defaults to working directory)" },
    },
    required: ["pattern"],
  },
  permission: { type: "allow" },

  async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    const patternStr = params.pattern as string
    const include = (params.include as string) || "*"
    const searchPath = (params.path as string) || ctx.workingDirectory

    try {
      const regex = new RegExp(patternStr, "gi")
      const results: string[] = []
      await grepDir(searchPath, regex, include, searchPath, results)

      if (results.length > 500) {
        return { content: [{ type: "text", text: results.slice(0, 500).join("\n") + `\n[${results.length - 500} more matches truncated]` }] }
      }

      return { content: [{ type: "text", text: results.join("\n") || "(no matches)" }] }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Grep failed: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  },
}

async function grepDir(dir: string, regex: RegExp, includePattern: string, rootDir: string, results: string[], depth = 0): Promise<void> {
  if (depth > 20) return

  let entries: { name: string; isDir: boolean }[]
  try {
    const items = readdirSync(dir, { withFileTypes: true })
    entries = items.map((i) => ({ name: i.name, isDir: i.isDirectory() }))
  } catch {
    return
  }

  const includeRegex = new RegExp(
    "^" + includePattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\{([^}]+)\}/g, (_, g) => `(${g.split(",").join("|")})`) + "$",
    "i"
  )

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue

    const fullPath = join(dir, entry.name)

    if (entry.isDir) {
      await grepDir(fullPath, regex, includePattern, rootDir, results, depth + 1)
      continue
    }

    if (include !== "*" && !includeRegex.test(entry.name)) continue

    try {
      const stat = statSync(fullPath)
      if (stat.size > 1024 * 1024) continue

      const content = readFileSync(fullPath, "utf-8")
      const lines = content.split("\n")

      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i] || "")) {
          const relPath = relative(rootDir, fullPath)
          results.push(`${relPath}:${i + 1}: ${(lines[i] || "").trim().slice(0, 200)}`)
          if (results.length >= 500) return
        }
      }
    } catch {}
  }
}
