import type { ToolDef, ToolContext, ToolResult } from "@rigal/core"
import { readdirSync, statSync } from "fs"
import { join, relative, dirname } from "path"

export const globTool: ToolDef = {
  name: "glob",
  description: "Fast file pattern matching. Use glob patterns like '**/*.ts' or 'src/**/*.test.ts'. Returns matching file paths sorted by modification time.",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Glob pattern to match files against" },
      path: { type: "string", description: "Directory to search in (defaults to working directory)" },
    },
    required: ["pattern"],
  },
  permission: { type: "allow" },

  async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    const pattern = params.pattern as string
    const searchPath = (params.path as string) || ctx.workingDirectory

    try {
      const results = await globSearch(searchPath, pattern, ctx.workingDirectory)
      const output = results.slice(0, 200).join("\n")
      const truncated = results.length > 200 ? `\n[${results.length - 200} more results truncated]` : ""
      return { content: [{ type: "text", text: output + truncated || "(no matches)" }] }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Glob failed: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  },
}

async function globSearch(rootDir: string, patternStr: string, workingDir: string): Promise<string[]> {
  const results: string[] = []
  const normalizedPattern = patternStr.replace(/\\/g, "/")

  async function walk(dir: string, patternSegments: string[], depth: number): Promise<void> {
    if (depth > 20) return

    let entries: { name: string; isDir: boolean }[]
    try {
      const items = readdirSync(dir, { withFileTypes: true })
      entries = items.map((i) => ({ name: i.name, isDir: i.isDirectory() }))
    } catch {
      return
    }

    const segment = patternSegments[0]
    const remaining = patternSegments.slice(1)

    if (segment === "**") {
      for (const entry of entries) {
        if (entry.isDir && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          const fullPath = join(dir, entry.name)
          await walk(fullPath, patternSegments, depth + 1)
          await walk(fullPath, remaining, depth + 1)
        }
        if (remaining.length === 0 && matchName(entry.name, segment)) {
          results.push(relative(workingDir, join(dir, entry.name)))
        }
      }
      if (remaining.length > 0) {
        for (const entry of entries) {
          if (entry.isDir && !entry.name.startsWith(".") && entry.name !== "node_modules") {
            await walk(join(dir, entry.name), remaining, depth + 1)
          }
        }
      }
      return
    }

    for (const entry of entries) {
      if (entry.isDir && remaining.length > 0 && matchName(entry.name, segment) && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        await walk(join(dir, entry.name), remaining, depth + 1)
      }
      if (remaining.length === 0 && matchName(entry.name, segment)) {
        results.push(relative(workingDir, join(dir, entry.name)))
      }
    }
  }

  let segments = normalizedPattern.split("/").filter(Boolean)
  if (!normalizedPattern.startsWith("**") && !normalizedPattern.startsWith("*")) {
    segments = [".", ...segments]
    rootDir = join(workingDir, normalizedPattern.split("/")[0] || "")
    segments = segments.slice(1)
    if (segments.length === 0) segments = ["*"]
  }

  try {
    await walk(rootDir, segments, 0)
  } catch {}

  results.sort((a, b) => {
    try {
      const statA = statSync(join(workingDir, a))
      const statB = statSync(join(workingDir, b))
      return statB.mtimeMs - statA.mtimeMs
    } catch {
      return 0
    }
  })

  return results
}

function matchName(name: string, segment: string): boolean {
  if (segment === "*") return true
  if (segment === "**") return true
  const regexStr = segment
    .replace(/\./g, "\\.")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".")
  const regex = new RegExp(`^${regexStr}$`, "i")
  return regex.test(name)
}
