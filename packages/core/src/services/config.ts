import type { ArgentConfig, ProviderConfig, Agent, ToolPermission } from "../types.js"
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { join, sep } from "node:path"
import { homedir } from "node:os"
import { PROVIDERS, getProvider } from "@argent/integrations"

function loadEnvFile(path: string): void {
  try {
    const content = readFileSync(path, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let value = trimmed.slice(eqIdx + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (/^["']/.test(value) !== /["']$/.test(value)) {
        console.error("[argent] Unbalanced quotes in env file:", trimmed)
      }
      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  } catch (err) {
    if ((err as any)?.code !== "ENOENT") console.error("[argent] Failed to load env file " + path + ":", (err as Error).message)
  }
}

function loadDotEnv(workingDir: string): void {
  loadEnvFile(join(workingDir, ".env"))
  loadEnvFile(join(homedir(), ".argent", ".env"))
}

function stripJsonComments(json: string): string {
  let result = ""
  let i = 0
  let inString = false
  let stringChar = ""

  while (i < json.length) {
    if (inString) {
      if (json[i] === "\\" && i + 1 < json.length) {
        result += json[i]
        result += json[i + 1]
        i += 2
        continue
      }
      if (json[i] === stringChar) {
        inString = false
      }
      result += json[i]
      i++
      continue
    }

    if (json[i] === '"') {
      inString = true
      stringChar = '"'
      result += json[i]
      i++
      continue
    }

    if (json[i] === "/" && json[i + 1] === "/") {
      while (i < json.length && json[i] !== "\n") i++
      continue
    }

    if (json[i] === "/" && json[i + 1] === "*") {
      i += 2
      while (i < json.length && !(json[i] === "*" && json[i + 1] === "/")) i++
      i += 2
      continue
    }

    result += json[i]
    i++
  }

  return result
}

function loadJsoncFile(path: string): Record<string, unknown> | null {
  try {
    const raw = readFileSync(path, "utf-8")
    const stripped = stripJsonComments(raw)
    const parsed = JSON.parse(stripped)
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch (err) {
    console.error("[argent] Failed to parse config file " + path + ":", err instanceof Error ? err.message : String(err))
    return null
  }
}

function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const trimmed = content.trim()
  if (!(trimmed.startsWith("---\n") || trimmed.startsWith("---\r") || trimmed === "---")) {
    return { meta: {}, body: trimmed }
  }

  const endIdx = findClosingDelimiter(trimmed, 3)
  if (endIdx === -1) {
    return { meta: parseMinimalYaml(trimmed.slice(3).trim()), body: "" }
  }

  const yamlBlock = trimmed.slice(3, endIdx).trim()
  const body = trimmed.slice(endIdx + 3).trim()
  const meta = parseMinimalYaml(yamlBlock)

  return { meta, body }
}

function findClosingDelimiter(str: string, start: number): number {
  let inString = false
  let stringChar = ""

  for (let i = start; i < str.length - 2; i++) {
    if (inString) {
      if (str[i] === "\\" && i + 1 < str.length) {
        i++
        continue
      }
      if (str[i] === stringChar) {
        inString = false
      }
    } else {
      if (str[i] === '"' || str[i] === "'") {
        inString = true
        stringChar = str[i]!
        continue
      }
      if (str[i] === "-" && str[i + 1] === "-" && str[i + 2] === "-") {
        return i
      }
    }
  }

  return -1
}

function parseMinimalYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = yaml.split("\n")
  let key = ""

  for (const line of lines) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue

    const indentMatch = /^(\s+)/.exec(line)
    const indent = indentMatch?.[1] ? indentMatch[1].length : 0

    if (indent === 0) {
      const colonIdx = line.indexOf(":")
      if (colonIdx === -1) continue
      key = line.slice(0, colonIdx).trim()
      const val = line.slice(colonIdx + 1).trim()

      if (val === "") {
        result[key] = {}
      } else if (val === "true") {
        result[key] = true
      } else if (val === "false") {
        result[key] = false
      } else if (/^-?\d+$/.test(val)) {
        result[key] = parseInt(val, 10)
      } else if (/^-?\d+(\.\d+)?$/.test(val)) {
        result[key] = parseFloat(val)
      } else {
        result[key] = val.replace(/^["']|["']$/g, "")
      }
    } else if (indent > 0 && key) {
      const isArrayItem = line.trim().startsWith("- ")
      const propColon = line.trim().indexOf(":")

      if (isArrayItem) {
        const itemVal = line.trim().slice(2).trim()
        const existing = result[key]
        if (Array.isArray(existing)) {
          existing.push(itemVal.replace(/^["']|["']$/g, ""))
        } else if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
          result[key] = [itemVal.replace(/^["']|["']$/g, "")]
        } else if (existing === undefined || existing === null || typeof existing !== "object") {
          result[key] = [itemVal.replace(/^["']|["']$/g, "")]
        }
      } else if (propColon === -1) {
        continue
      } else {
        const propKey = line.trim().slice(0, propColon).trim()
        const propVal = line.trim().slice(propColon + 1).trim()

        const existing = result[key]
        if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
          const obj = existing as Record<string, unknown>
          if (propVal === "true") obj[propKey] = true
          else if (propVal === "false") obj[propKey] = false
          else obj[propKey] = propVal.replace(/^["']|["']$/g, "")
        }
      }
    }
  }

  return result
}

export interface CommandDef {
  name: string
  description: string
  instruction: string
}

const DEFAULT_AGENTS: Agent[] = [
  {
    name: "build",
    description: "Full-access agent for development work. Can read, write, edit files, and run shell commands.",
    mode: "primary",
    tools: {
      bash: "allow",
      read: "allow",
      write: "allow",
      edit: "allow",
      grep: "allow",
      glob: "allow",
      webfetch: "allow",
    },
    systemPrompt: `You are ARGENT, a universal coding agent. 
You operate as a CLI coding assistant. 

Guidelines:
- Be concise and direct
- Use tools to accomplish tasks
- Follow existing code conventions
- Never commit secrets
- Verify solutions when possible
- Execute bash commands to explore, test, and verify`,
    color: "#00e5ff",
  },
  {
    name: "plan",
    description: "Read-only agent for analysis and exploration. Denies file edits, asks before bash.",
    mode: "primary",
    tools: {
      bash: "ask",
      read: "allow",
      write: "deny",
      edit: "deny",
      grep: "allow",
      glob: "allow",
      webfetch: "allow",
    },
    systemPrompt: `You are ARGENT Plan mode — a read-only analysis agent.
You explore codebases, plan changes, and analyze architecture.
You cannot edit files or run bash commands without explicit permission.
Focus on understanding and explaining, not modifying.`,
    color: "#7c3aed",
  },
  {
    name: "explore",
    description: "Fast subagent for codebase exploration and search.",
    mode: "subagent",
    tools: {
      bash: "deny",
      read: "allow",
      write: "deny",
      edit: "deny",
      grep: "allow",
      glob: "allow",
      webfetch: "allow",
    },
    systemPrompt: `You are ARGENT Explore — a fast codebase explorer.
Search files, find patterns, read code, and report findings.
You cannot modify anything. Be thorough but fast.`,
    color: "#10b981",
    hidden: true,
  },
]

const DEFAULT_CONFIG: ArgentConfig = {
  permission: {
    bash: "ask",
    read: "allow",
    write: "ask",
    edit: "ask",
    grep: "allow",
    glob: "allow",
    webfetch: "allow",
  },
}

export class ConfigService {
  private config: ArgentConfig
  private agents: Agent[]
  private commands: Map<string, CommandDef>
  private workingDir: string
  constructor(workingDir?: string) {
    this.workingDir = workingDir || process.cwd()
    this.commands = new Map()
    loadDotEnv(this.workingDir)
    this.config = { ...DEFAULT_CONFIG }
    this.agents = [...DEFAULT_AGENTS]
    this.loadConfig()
    this.loadAgents()
    this.loadCommands()
  }

  private loadConfig(): void {
    const jsoncCfg = this.loadJsoncConfig()
    const env = this.loadFromEnv()

    if (Array.isArray(jsoncCfg.permission)) {
      console.error("[argent] config: 'permission' must be an object, not an array — ignoring")
    }

    this.config = {
      ...DEFAULT_CONFIG,
      permission: {
        ...DEFAULT_CONFIG.permission,
        ...(!jsoncCfg.permission || Array.isArray(jsoncCfg.permission) || typeof jsoncCfg.permission !== "object" || jsoncCfg.permission === null ? {} : jsoncCfg.permission as Record<string, ToolPermission>),
        ...(env.permission as Record<string, ToolPermission> | undefined),
      },
      provider: env.provider || (typeof jsoncCfg.provider === "object" && jsoncCfg.provider !== null && !Array.isArray(jsoncCfg.provider)
        ? jsoncCfg.provider as ProviderConfig | undefined
        : undefined),
      mcp: jsoncCfg.mcp as Record<string, unknown> | undefined,
    }
  }

  private loadJsoncConfig(): Record<string, unknown> {
    const projectPath = join(this.workingDir, ".argent", "argent.jsonc")
    const globalPath = join(homedir(), ".argent", "argent.jsonc")

    const global = loadJsoncFile(globalPath)
    const project = loadJsoncFile(projectPath)

    const merged: Record<string, unknown> = { ...(global || {}), ...(project || {}), mcp: { ...((global || {}) as any).mcp, ...((project || {}) as any).mcp } }
    return merged
  }

  private loadFromEnv(): Partial<ArgentConfig> {
    const cfg: Partial<ArgentConfig> = {}

    if (process.env.ARGENT_PROVIDER) {
      if (!cfg.provider) {
        const desc = getProvider(process.env.ARGENT_PROVIDER)
        if (desc) {
          const envVar = desc.envVars?.[0]
          cfg.provider = {
            type: process.env.ARGENT_PROVIDER,
            apiKey: (envVar && process.env[envVar]) || process.env[`${process.env.ARGENT_PROVIDER.toUpperCase()}_API_KEY`],
            baseUrl: process.env[`${process.env.ARGENT_PROVIDER.toUpperCase()}_BASE_URL`],
            model: process.env.ARGENT_MODEL || process.env[`${process.env.ARGENT_PROVIDER.toUpperCase()}_MODEL`],
          }
        }
      }
    }

    if (!cfg.provider) {
      if (process.env.ANTHROPIC_API_KEY) {
        cfg.provider = {
          type: "anthropic",
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
        }
      }
    }

    if (!cfg.provider) {
      if (process.env.OPENAI_API_KEY) {
        cfg.provider = {
          type: "openai",
          apiKey: process.env.OPENAI_API_KEY,
          baseUrl: process.env.OPENAI_BASE_URL,
          model: process.env.OPENAI_MODEL || "gpt-4o",
        }
      }
    }

    return cfg
  }

  private loadAgents(): void {
    for (const dir of this.getConfigDirs("agent")) {
      const files = this.readConfigDir(dir)
      for (const f of files) {
        if (!f.name.endsWith(".agent.md")) continue
        const agent = this.parseAgentFile(join(dir, f.name))
        if (agent) this.addAgent(agent)
      }
    }
  }

  private parseAgentFile(path: string): Agent | null {
    try {
      const content = readFileSync(path, "utf-8")
      const { meta, body } = parseFrontmatter(content)
      const basename = path.split(sep).pop() || "unknown"

      const name = meta.name ? String(meta.name)
        : basename.endsWith(".agent.md") ? basename.slice(0, -9)
        : basename

      const mode = meta.mode === "subagent" ? "subagent" as const : "primary" as const
      const tools = meta.tools && typeof meta.tools === "object" ? meta.tools as Record<string, ToolPermission> : {}
      const validTools: Record<string, ToolPermission> = {}
      for (const [k, v] of Object.entries(tools)) {
        if (v === "allow" || v === "deny" || v === "ask") validTools[k] = v
      }

      return {
        name: String(name),
        description: meta.description ? String(meta.description) : `Custom agent: ${name}`,
        mode,
        tools: validTools,
        systemPrompt: body || "You are a helpful coding assistant.",
        color: meta.color ? String(meta.color) : undefined,
        hidden: meta.hidden === true || meta.hidden === "true",
      }
    } catch (err) {
      console.error("[argent] Failed to parse " + path + ":", err instanceof Error ? err.message : String(err))
      return null
    }
  }

  private loadCommands(): void {
    for (const dir of this.getConfigDirs("command")) {
      const files = this.readConfigDir(dir)
      for (const f of files) {
        if (!f.name.endsWith(".md") || f.name.endsWith(".agent.md")) continue
        const cmd = this.parseCommandFile(join(dir, f.name))
        if (cmd) this.commands.set(cmd.name, cmd)
      }
    }
  }

  private parseCommandFile(path: string): CommandDef | null {
    try {
      const content = readFileSync(path, "utf-8")
      const { meta, body } = parseFrontmatter(content)
      const basename = path.split(sep).pop() || "unknown"

      const name = (meta.name ? String(meta.name) : basename.replace(/\.md$/, "")).toLowerCase()

      return {
        name,
        description: meta.description ? String(meta.description) : `Run ${name}`,
        instruction: body || "",
      }
    } catch (err) {
      console.error("[argent] Failed to parse " + path + ":", err instanceof Error ? err.message : String(err))
      return null
    }
  }

  private getConfigDirs(subdir: string): string[] {
    const dirs: string[] = []
    const globalDir = join(homedir(), ".argent", subdir)
    const projectDir = join(this.workingDir, ".argent", subdir)
    if (existsSync(globalDir)) dirs.push(globalDir)
    if (existsSync(projectDir)) dirs.push(projectDir)
    return dirs
  }

  private readConfigDir(dir: string): { name: string; isDir: boolean }[] {
    try {
      return readdirSync(dir, { withFileTypes: true }).map((d) => ({
        name: d.name,
        isDir: d.isDirectory(),
      }))
    } catch (err) {
      const nodeErr = err as { code?: string; message?: string }
      if (nodeErr.code !== "ENOENT") {
        console.error("[argent] Cannot read config dir " + dir + ":", nodeErr.message || String(err))
      }
      return []
    }
  }

  getConfig(): ArgentConfig {
    return this.config
  }

  getProvider(): ProviderConfig | undefined {
    return this.config.provider
  }

  getAgents(): Agent[] {
    return this.agents.filter((a) => !a.hidden)
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.find((a) => a.name === name)
  }

  getPermission(toolName: string): ToolPermission {
    return this.config.permission?.[toolName] || "ask"
  }

  getWorkingDir(): string {
    return this.workingDir
  }

  setProvider(provider: ProviderConfig): void {
    this.config.provider = provider
  }

  addAgent(agent: Agent): void {
    const idx = this.agents.findIndex((a) => a.name === agent.name)
    if (idx >= 0) {
      this.agents[idx] = agent
    }
    else this.agents.push(agent)
  }

  getCommands(): CommandDef[] {
    return Array.from(this.commands.values())
  }

  getCommand(name: string): CommandDef | undefined {
    return this.commands.get(name)
  }

  getMcpConfig(): Record<string, unknown> | undefined {
    return this.config.mcp
  }
}
