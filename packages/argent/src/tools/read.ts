import type { ToolDef, ToolContext, ToolResult } from "@argent/core"
import { resolveSafePath, isSecretPath } from "@argent/core"
import { readFileSync, readdirSync, statSync } from "fs"
import { isAbsolute, resolve, join } from "path"

export const readTool: ToolDef = {
  name: "read",
  description: "Read a file or directory from the local filesystem. Returns contents with line numbers. Use offset/limit for large files.",
  parameters: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "Absolute path to the file or directory" },
      offset: { type: "number", description: "Line number to start from (1-indexed)" },
      limit: { type: "number", description: "Maximum number of lines to read" },
    },
    required: ["filePath"],
  },
  permission: { type: "allow" },

  async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    if (typeof params.filePath !== "string") return { content: [{ type: "text", text: "filePath must be a string" }], isError: true }
    const rawPath = params.filePath as string
    const offset = (params.offset as number) || 1
    const limit = (params.limit as number) || 2000

    if (isNaN(offset) || !isFinite(offset) || offset < 1) {
      return { content: [{ type: "text", text: `Offset must be >= 1, got ${offset}` }], isError: true }
    }
    if (isNaN(limit) || !isFinite(limit) || limit < 1) {
      return { content: [{ type: "text", text: `Limit must be >= 1, got ${limit}` }], isError: true }
    }

    const filePath = isAbsolute(rawPath) ? rawPath : resolve(ctx.workingDirectory, rawPath)
    const safePath = resolveSafePath(filePath, ctx)
    if (!safePath) {
      return {
        content: [{ type: "text", text: `Path outside workspace: ${filePath}` }],
        isError: true,
      }
    }

    if (isSecretPath(filePath)) {
      return {
        content: [{ type: "text", text: `Cannot read "${filePath}" — it matches a secret file pattern.` }],
        isError: true,
      }
    }

    try {
      const stat = statSync(safePath)

      if (stat.isDirectory()) {
        const entries: string[] = []
        const items = readdirSync(safePath, { withFileTypes: true })
        for (const item of items) {
          entries.push(item.isDirectory() ? `${item.name}/` : item.name)
        }
        if (offset > entries.length) {
          return { content: [{ type: "text", text: `Directory has ${entries.length} entries, cannot read from offset ${offset}` }], isError: true }
        }
        return { content: [{ type: "text", text: entries.slice(offset - 1, offset - 1 + limit).join("\n") }] }
      }

      if (!stat.isFile()) {
        return {
          content: [{ type: "text", text: `Not a regular file: ${filePath} (type: sockets, pipes, FIFOs, and devices are not supported)` }],
          isError: true,
        }
      }

      if (stat.size > 5 * 1024 * 1024) {
        return {
          content: [{ type: "text", text: `File too large (${stat.size} bytes). Use offset/limit to read a portion.` }],
          isError: true,
        }
      }

      const content = readFileSync(safePath, "utf-8")
      const lines = content.split("\n")

      if (offset > lines.length) {
        return { content: [{ type: "text", text: `File has ${lines.length} lines, cannot read from offset ${offset}` }], isError: true }
      }

      const slice = lines.slice(offset - 1, offset - 1 + limit)
      const output = slice.map((line, i) => `${offset + i}: ${line}`).join("\n")

      if (output.length > 100000) {
        return { content: [{ type: "text", text: output.slice(0, 100000) + "\n[truncated]" }] }
      }

      return { content: [{ type: "text", text: output || "(empty)" }] }
    } catch (err) {
      console.error("[argent] read:", err instanceof Error ? err.message : String(err))
      return {
        content: [{ type: "text", text: "Failed to read file" }],
        isError: true,
      }
    }
  },
}
