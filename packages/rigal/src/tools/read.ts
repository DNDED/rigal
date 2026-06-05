import type { ToolDef, ToolContext, ToolResult } from "@rigal/core"
import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

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
    const filePath = params.filePath as string
    const offset = (params.offset as number) || 1
    const limit = (params.limit as number) || 2000

    try {
      const stat = statSync(filePath)

      if (stat.isDirectory()) {
        const entries: string[] = []
        const items = readdirSync(filePath, { withFileTypes: true })
        for (const item of items) {
          entries.push(item.isDirectory() ? `${item.name}/` : item.name)
        }
        return { content: [{ type: "text", text: entries.slice(0, limit).join("\n") }] }
      }

      const content = readFileSync(filePath, "utf-8")
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
      return {
        content: [{ type: "text", text: `Cannot read "${filePath}": ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  },
}
