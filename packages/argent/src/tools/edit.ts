import type { ToolDef, ToolContext, ToolResult } from "@argent/core"
import { resolveSafePath, isSecretPath } from "@argent/core"
import { readFileSync, writeFileSync } from "fs"
import { isAbsolute, resolve } from "path"

export const editTool: ToolDef = {
  name: "edit",
  description: "Performs exact string replacements in a file. Must match exactly including whitespace. Use replaceAll to replace all occurrences.",
  parameters: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "Absolute path to the file to edit" },
      oldString: { type: "string", description: "Exact text to find and replace" },
      newString: { type: "string", description: "Replacement text" },
      replaceAll: { type: "boolean", description: "Replace all occurrences (default: false)" },
    },
    required: ["filePath", "oldString", "newString"],
  },
  permission: { type: "ask", reason: "Editing files modifies source code" },

  async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    if (typeof params.filePath !== "string") return { content: [{ type: "text", text: "filePath must be a string" }], isError: true }
    if (typeof params.oldString !== "string") return { content: [{ type: "text", text: "oldString must be a string" }], isError: true }
    if (typeof params.newString !== "string") return { content: [{ type: "text", text: "newString must be a string" }], isError: true }
    const rawPath = params.filePath as string
    const oldString = params.oldString as string
    const newString = params.newString as string
    const replaceAll = params.replaceAll as boolean

    if (oldString === "") {
      return { content: [{ type: "text", text: "oldString cannot be empty" }], isError: true }
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
        content: [{ type: "text", text: `Cannot write to "${filePath}" — it matches a secret file pattern.` }],
        isError: true,
      }
    }

    if (oldString === newString) {
      return { content: [{ type: "text", text: "oldString and newString are identical — no changes made" }] }
    }

    try {
      const content = readFileSync(safePath, "utf-8")

      if (replaceAll) {
        const count = content.split(oldString).length - 1
        if (count === 0) {
          return { content: [{ type: "text", text: `"${oldString.slice(0, 60)}" not found in ${filePath}` }], isError: true }
        }
        const newContent = content.replaceAll(oldString, newString)
        writeFileSync(safePath, newContent, "utf-8")
        return { content: [{ type: "text", text: `Replaced ${count} occurrences of "${oldString.slice(0, 40)}..." in ${filePath}` }] }
      }

      const index = content.indexOf(oldString)
      if (index === -1) {
        return { content: [{ type: "text", text: `"${oldString.slice(0, 60)}" not found in ${filePath}` }], isError: true }
      }

      const count = content.split(oldString).length - 1
      if (count > 1) {
        return {
          content: [{ type: "text", text: `Found ${count} occurrences of the string. Use replaceAll: true or provide more surrounding context to make it unique.` }],
          isError: true,
        }
      }

      const newContent = content.slice(0, index) + newString + content.slice(index + oldString.length)
      writeFileSync(safePath, newContent, "utf-8")
      return { content: [{ type: "text", text: `Replaced 1 occurrence in ${filePath}` }] }
    } catch (err) {
      console.error("[argent] edit:", err instanceof Error ? err.message : String(err))
      return {
        content: [{ type: "text", text: "Failed to edit file" }],
        isError: true,
      }
    }
  },
}
