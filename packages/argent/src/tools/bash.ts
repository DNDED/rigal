import type { ToolDef, ToolContext, ToolResult } from "@argent/core"
import { resolveSafePath } from "@argent/core"
import { isAbsolute, resolve } from "node:path"

const BLOCKED_PATTERNS: Array<RegExp> = [
  /rm[\s\\]+.*-[rR][\s\\]*[fF][\s\\]+/,
  /rm[\s\\]+.*-[fF][\s\\]*[rR][\s\\]+/,
  /rm\s+--no-preserve-root/,
  /^sudo\b/,
  /mkfs\./i,
  /dd\s+.*of=\/dev\//,
  /tee\s+\/dev\//,
  /find\s+.*\s-delete\b/,
  />\s*\/dev\/sd/,
  />\s*\/dev\/nvme/,
  />\s*\/dev\/mmcblk/,
  />\s*\/dev\/std/,
  /:\s*\(\s*\)\s*\{/,
  /curl.*\|\s*(ba)?sh/,
  /wget.*\|\s*(ba)?sh/,
  /base64\s+.*\|\s*(ba)?sh/,
  /printf\s+.*\|\s*(ba)?sh/,
  /chmod\s+.*777/,
  /chown\s+root\s+\//,
  /\bmount\b.*\/dev\//,
  /\bfdisk\b/,
  /\bshutdown\b/,
  /\breboot\b/,
  /^eval\s/,
  /`.*rm\s+-rf.*`/,
  /`.*rm\s+-fr.*`/,
]

function normalizeCommand(command: string): string {
  return command.replace(/\\(.)/g, "$1")
}

function matchesBlockedPattern(command: string): string | null {
  const normalized = normalizeCommand(command)
  const commands = [command, normalized]

  for (const cmd of commands) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(cmd)) {
        return pattern.source
      }
    }
  }
  return null
}

function readNodeStream(stream: NodeJS.ReadableStream, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const timer = setTimeout(() => {
      stream.removeAllListeners()
      reject(new Error(`Stream timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    stream.on("data", (chunk: Buffer) => chunks.push(chunk))
    stream.on("end", () => { clearTimeout(timer); resolve(Buffer.concat(chunks).toString("utf-8")) })
    stream.on("error", (err: Error) => { clearTimeout(timer); reject(err) })
  })
}

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
    if (typeof params.command !== "string") return { content: [{ type: "text", text: "command must be a string" }], isError: true }
    const command = params.command as string
    const rawTimeout = (params.timeout as number) ?? 120000
    const timeout = (isNaN(rawTimeout) || !isFinite(rawTimeout) || rawTimeout < 0) ? 120000 : rawTimeout
    const rawWorkdir = (params.workdir as string) ?? ctx.workingDirectory

    const blocked = matchesBlockedPattern(command)
    if (blocked) {
      return {
        content: [{ type: "text", text: "Command blocked by security policy" }],
        isError: true,
      }
    }

    const resolvedWorkdir = isAbsolute(rawWorkdir) ? rawWorkdir : resolve(ctx.workingDirectory, rawWorkdir)
    const workdir = resolveSafePath(resolvedWorkdir, ctx)
    if (!workdir) {
      return {
        content: [{ type: "text", text: `Workdir outside workspace: ${resolvedWorkdir}` }],
        isError: true,
      }
    }

    const secretPattern = /\.env(\s|$)|\.key\b|\.pem\b|\.secret\b|\.token\b|\bcredentials\b|\bid_rsa\b/i
    if (secretPattern.test(command)) {
      return {
        content: [{ type: "text", text: "Command appears to target secret files." }],
        isError: true,
      }
    }

    try {
      const shellCmd = process.platform === "win32" ? "cmd.exe" : "bash"
      const shellArg = process.platform === "win32" ? "/c" : "-c"

      if (typeof Bun !== "undefined") {
        const proc = Bun.spawn([shellCmd, shellArg, command], { cwd: workdir, stdout: "pipe", stderr: "pipe", timeout })
        const stdout = await new Response(proc.stdout).text()
        const stderr = await new Response(proc.stderr).text()
        const exitCode = await proc.exited

        return formatOutput(stdout, stderr, exitCode)
      } else {
        const { spawn } = await import("node:child_process")
        const child = spawn(shellCmd, [shellArg, command], { cwd: workdir, timeout, stdio: ["ignore", "pipe", "pipe"] })

        try {
          const [stdout, stderr] = await Promise.all([
            readNodeStream(child.stdout!, timeout),
            readNodeStream(child.stderr!, timeout),
          ])
          const exitCode = await new Promise<number>((resolve) => child.on("close", (c: number | null) => resolve(c ?? -1)))
          return formatOutput(stdout, stderr, exitCode)
        } catch (streamErr) {
          child.kill()
          throw streamErr
        }
      }
    } catch (err) {
      console.error("[argent] bash:", err instanceof Error ? err.message : String(err))
      return {
        content: [{ type: "text", text: "Command execution failed" }],
        isError: true,
      }
    }
  },
}

function formatOutput(stdout: string, stderr: string, exitCode: number): ToolResult {
  const output = [stdout, stderr ? `\n[stderr]\n${stderr}` : ""].filter((s) => s !== "").join("")

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
}
