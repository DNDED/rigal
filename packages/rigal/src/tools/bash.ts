import type { ToolDef, ToolContext, ToolResult } from "@rigal/core"

export const bashTool: ToolDef = {
  name: "bash",
  description: "Executes a bash command with optional timeout. Use for file operations, git, npm, tests, and system commands.",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "The bash command to execute" },
      timeout: { type: "number", description: "Optional timeout in milliseconds (default: 120000)" },
      workdir: { type: "string", description: "Working directory for the command" },
      description: { type: "string", description: "Brief description of what this command does" },
    },
    required: ["command"],
  },
  permission: { type: "ask", reason: "Running shell commands can modify the system" },

  async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    const command = params.command as string
    const timeout = (params.timeout as number) || 120000
    const workdir = (params.workdir as string) || ctx.workingDirectory

    try {
      const proc = Bun.spawn(["bash", "-c", command], {
        cwd: workdir,
        stdout: "pipe",
        stderr: "pipe",
        timeout,
      })

      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited

      const output = [stdout, stderr ? `\n[stderr]\n${stderr}` : ""].filter(Boolean).join("")

      if (output.length > 50000) {
        return {
          content: [{ type: "text", text: output.slice(0, 50000) + "\n[output truncated at 50000 characters]" }],
          isError: exitCode !== 0,
        }
      }

      return {
        content: [{ type: "text", text: output || "(no output)" }],
        isError: exitCode !== 0,
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Bash command failed: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  },
}
