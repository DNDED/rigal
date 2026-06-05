import type { ToolDef, ToolContext, ToolResult } from "@rigal/core"
import { writeFileSync, mkdirSync } from "fs"
import { dirname } from "path"

export const writeTool: ToolDef = {
  name: "write",
  description: "Writes a file to the local filesystem. Creates parent directories if needed. Overwrites existing files.",
  parameters: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "Absolute path to write the file to" },
      content: { type: "string", description: "Content to write to the file" },
    },
    required: ["filePath", "content"],
  },
  permission: { type: "ask", reason: "Writing files modifies the filesystem" },

  async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    const filePath = params.filePath as string
    const content = params.content as string

    try {
      mkdirSync(dirname(filePath), { recursive: true })
      writeFileSync(filePath, content, "utf-8")
      const lines = content.split("\n").length
      return { content: [{ type: "text", text: `Wrote ${lines} lines to ${filePath}` }] }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed to write "${filePath}": ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  },
}
