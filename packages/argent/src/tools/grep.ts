import type { ToolDef, ToolContext, ToolResult } from "@argent/core"
import { resolveSafePath, isSecretPath } from "@argent/core"
import { readFileSync, readdirSync, statSync } from "fs"
import { join, relative, isAbsolute, resolve } from "path"

function isReDoS(pattern: string): boolean {
  let cleaned = ""
  let i = 0
  let classDepth = 0
  while (i < pattern.length) {
    if (pattern[i] === "\\" && i + 1 < pattern.length) {
      cleaned += " "
      i += 2
      continue
    }
    if (pattern[i] === "[") classDepth++
    if (pattern[i] === "]") classDepth--
    if (classDepth === 0) cleaned += pattern[i]
    i++
  }

  if (/[)\]}][+*{]/.test(cleaned)) return true

  if (/\{(\d{4,})[,}]/.test(pattern)) return true
  if (/\{,\d{4,}\}/.test(pattern)) return true

  return false
}

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
    if (typeof params.pattern !== "string") return { content: [{ type: "text", text: "pattern must be a string" }], isError: true }
    const patternStr = params.pattern as string
    const include = (params.include as string) ?? "*"
    const rawPath = (params.path as string) ?? ctx.workingDirectory
    const resolvedPath = isAbsolute(rawPath) ? rawPath : resolve(ctx.workingDirectory, rawPath)
    const searchPath = resolveSafePath(resolvedPath, ctx)
    if (!searchPath) {
      return {
        content: [{ type: "text", text: `Path outside workspace: ${resolvedPath}` }],
        isError: true,
      }
    }

    if (patternStr.length > 500) {
      return { content: [{ type: "text", text: "Pattern too long (max 500 characters)" }], isError: true }
    }

    if (isReDoS(patternStr)) {
      return { content: [{ type: "text", text: "Pattern contains potentially dangerous nested quantifiers" }], isError: true }
    }

    let regex: RegExp
    try {
      regex = new RegExp(patternStr, "i")
    } catch {
      return { content: [{ type: "text", text: `Invalid regex pattern: ${patternStr}` }], isError: true }
    }

    try {
      const results: string[] = []
      await grepDir(searchPath, regex, include, searchPath, results)

      if (results.length > 500) {
        return { content: [{ type: "text", text: results.slice(0, 500).join("\n") + `\n[${results.length - 500} more matches truncated]` }] }
      }

      return { content: [{ type: "text", text: results.join("\n") || "(no matches)" }] }
    } catch (err) {
      console.error("[argent] grep:", err instanceof Error ? err.message : String(err))
      return {
        content: [{ type: "text", text: "Content search failed" }],
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

    if (includePattern !== "*" && !includeRegex.test(entry.name)) continue

    if (isSecretPath(fullPath)) continue

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
