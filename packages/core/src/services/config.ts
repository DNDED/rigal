import type { RigalConfig, ProviderConfig, Agent, ToolPermission } from "../types.js"

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
    systemPrompt: `You are RIGAL, a universal coding agent. 
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
    systemPrompt: `You are RIGAL Plan mode — a read-only analysis agent.
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
    systemPrompt: `You are RIGAL Explore — a fast codebase explorer.
Search files, find patterns, read code, and report findings.
You cannot modify anything. Be thorough but fast.`,
    color: "#10b981",
    hidden: true,
  },
]

const DEFAULT_CONFIG: RigalConfig = {
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
  private config: RigalConfig
  private agents: Agent[]
  private workingDir: string

  constructor(workingDir?: string) {
    this.workingDir = workingDir || process.cwd()
    this.config = { ...DEFAULT_CONFIG }
    this.agents = [...DEFAULT_AGENTS]
    this.loadConfig()
    this.loadAgents()
  }

  private loadConfig(): void {
    const env = this.loadFromEnv()
    this.config = { ...DEFAULT_CONFIG, ...env }
  }

  private loadFromEnv(): Partial<RigalConfig> {
    const cfg: Partial<RigalConfig> = {}

    if (process.env.RIGAL_PROVIDER) {
      cfg.provider = {
        type: process.env.RIGAL_PROVIDER,
        apiKey: process.env[`${process.env.RIGAL_PROVIDER.toUpperCase()}_API_KEY`],
        baseUrl: process.env[`${process.env.RIGAL_PROVIDER.toUpperCase()}_BASE_URL`],
        model: process.env.RIGAL_MODEL || process.env[`${process.env.RIGAL_PROVIDER.toUpperCase()}_MODEL`],
      }
    }

    if (process.env.ANTHROPIC_API_KEY) {
      cfg.provider = {
        type: "anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      }
    }

    if (process.env.OPENAI_API_KEY) {
      cfg.provider = {
        type: "openai",
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
        model: process.env.OPENAI_MODEL || "gpt-4o",
      }
    }

    return cfg
  }

  private loadAgents(): void {}

  getConfig(): RigalConfig {
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
    if (idx >= 0) this.agents[idx] = agent
    else this.agents.push(agent)
  }
}
