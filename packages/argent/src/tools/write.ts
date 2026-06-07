import type { ToolDef, ToolContext, ToolResult } from "@argent/core"
import { resolveSafePath, isSecretPath } from "@argent/core"
import { writeFileSync, mkdirSync } from "fs"
import { dirname, isAbsolute, resolve } from "path"

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
    if (typeof params.filePath !== "string") return { content: [{ type: "text", text: "filePath must be a string" }], isError: true }
    if (typeof params.content !== "string") return { content: [{ type: "text", text: "content must be a string" }], isError: true }
    const rawPath = params.filePath as string
    const content = params.content as string

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
        content: [{ type: "text", text: `Cannot write to "${filePath}" — it matches a secret file pattern.` }],
        isError: true,
      }
    }

    try {
      mkdirSync(dirname(safePath), { recursive: true })
      writeFileSync(safePath, content, "utf-8")
      const lines = content.split("\n").length
      return { content: [{ type: "text", text: `Wrote ${lines} lines to ${filePath}` }] }
    } catch (err) {
      console.error("[argent] write:", err instanceof Error ? err.message : String(err))
      return {
        content: [{ type: "text", text: "Failed to write file" }],
        isError: true,
      }
    }
  },
}
