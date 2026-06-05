import type { ToolDef, ToolContext, ToolResult } from "@rigal/core"
import { readFileSync, writeFileSync } from "fs"

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
    const filePath = params.filePath as string
    const oldString = params.oldString as string
    const newString = params.newString as string
    const replaceAll = params.replaceAll as boolean

    if (oldString === newString) {
      return { content: [{ type: "text", text: "oldString and newString are identical — no changes made" }] }
    }

    try {
      const content = readFileSync(filePath, "utf-8")

      if (replaceAll) {
        const count = content.split(oldString).length - 1
        if (count === 0) {
          return { content: [{ type: "text", text: `"${oldString.slice(0, 60)}" not found in ${filePath}` }], isError: true }
        }
        const newContent = content.replaceAll(oldString, newString)
        writeFileSync(filePath, newContent, "utf-8")
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
      writeFileSync(filePath, newContent, "utf-8")
      return { content: [{ type: "text", text: `Replaced 1 occurrence in ${filePath}` }] }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed to edit "${filePath}": ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  },
}
