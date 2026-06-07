# ARGENT

The universal AI coding harness. Any model, any provider, any platform.

## Quick Start

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/DNDED/argent/master/scripts/install.sh | bash
argent
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/DNDED/argent/master/scripts/install.ps1 | iex
argent
```

**From source (any platform):**
```bash
git clone https://github.com/DNDED/argent.git
cd argent
bun install
bun run build
npm link ./packages/argent
argent
```

On first run, ARGENT shows an interactive setup wizard to choose your provider.

## 37 Providers

ARGENT works with every major AI provider:

| # | Provider | Auth | Models |
|---|----------|------|--------|
| 1 | **Anthropic** | API key | Claude Sonnet 4, Opus, 3.5 Sonnet/Haiku |
| 2 | **OpenAI** | API key | GPT-4o, GPT-5, GPT-5.5, o1, o3-mini |
| 3 | **Codex OAuth** | Browser login (free) | GPT-5.5, GPT-5, Codex, o4-mini |
| 4 | **OpenRouter** | API key | 200+ models (Claude, GPT, Gemini, Llama...) |
| 5 | **Google Gemini** | API key | Gemini 2.5 Pro/Flash, 2.0 Flash |
| 6 | **Gemini CLI OAuth** | Browser login (free) | Same as Gemini |
| 7 | **GitHub Copilot** | GitHub token | GPT-4o, Claude, Gemini |
| 8 | **DeepSeek** | API key | DeepSeek V4 Pro/Flash, Chat, Reasoner |
| 9 | **xAI Grok** | API key | Grok 3, Grok 3 Mini, Grok 2 |
| 10 | **xAI OAuth** | Browser login (free) | Same as xAI |
| 11 | **Nous Research** | OAuth | Hermes 3, DeepSeek V4 |
| 12 | **Qwen OAuth** | Browser login (free) | Qwen 2.5 Coder, Qwen Max |
| 13 | **Alibaba DashScope** | API key | Qwen models |
| 14 | **Kimi/Moonshot** | API key | Moonshot V1, Kimi K2.5/K2.6 |
| 15 | **Z.AI/GLM** | API key | GLM-4 Plus/Flash, GLM-5/5.1 |
| 16 | **Xiaomi MiMo** | API key | MiMo V2 Pro, V2.5 Pro, Omni |
| 17 | **NVIDIA NIM** | API key | Llama 3.3 70B, Nemotron |
| 18 | **MiniMax** | API key | MiniMax-01, M2.5, M2.7 |
| 19 | **MiniMax OAuth** | Browser login (free) | Same as MiniMax |
| 20 | **StepFun** | API key | Step 1/2/3.7 |
| 21 | **Hugging Face** | HF token | Llama, Mistral, DeepSeek |
| 22 | **OpenCode Zen** | API key | GPT-4o, Claude, DeepSeek |
| 23 | **OpenCode Go** | API key | DeepSeek, GLM, Kimi, MiMo, Qwen |
| 24 | **AWS Bedrock** | AWS creds | Claude, Llama |
| 25 | **Azure Foundry** | API key | GPT-4o, GPT-4 Turbo |
| 26 | **GMI Cloud** | API key | GPT-4o, Claude, Gemini |
| 27 | **Arcee AI** | API key | Llama 3.3 70B, Mistral |
| 28 | **Ollama Cloud** | API key | Llama, Qwen, DeepSeek |
| 29 | **Ollama Local** | None (free) | Any local model |
| 30 | **LM Studio** | None (free) | Any local model |
| 31 | **Tencent TokenHub** | API key | Hunyuan Pro/Standard |
| 32 | **Groq** | API key | Llama 3.3 70B, Mixtral |
| 33 | **Mistral** | API key | Codestral, Mistral Large |
| 34 | **Together AI** | API key | Llama, Qwen, DeepSeek |
| 35 | **Fireworks AI** | API key | Llama, Qwen, DeepSeek |
| 36 | **Perplexity** | API key | Sonar Pro, Sonar Reasoning |
| 37 | **Custom** | Any | Any OpenAI-compatible endpoint |

## Agents

ARGENT includes three built-in agents:

- **build** (Tab 1) — Full-access agent for development work
- **plan** (Tab 2) — Read-only agent for analysis and exploration
- **explore** — Fast subagent for codebase search (internal)

Switch agents with `Tab` key.

## Commands

```
Core:
  /agent [name]        Switch agent (build, plan, explore)
  /model [name]        Switch AI model
  /provider [name|#]   Change provider
  /oauth <provider>    Start OAuth flow
  /setup               Re-run first-run setup
  /clear               Start a new session
  /undo                Revert last change
  /status              Show current status
  /help                Show all commands
  /exit                Quit

Session:
  /compact             Summarize and reduce context
  /fork [name]         Fork current session
  /resume [session]    Resume a past session
  /rewind              Show checkpoint options
  /branch [name]       Create named session branch
  /rename [name]       Rename current session

Review:
  /diff                Show inline diffs
  /review              Review pending changes
  /lint                Run linter and show results
  /security            Run security scan on changes
  /test [pattern]      Run tests with optional pattern

Info:
  /cost                Show detailed cost breakdown
  /doctor              Diagnose configuration issues
  /stats               Show usage statistics
  /context             Show context window usage
  /history             Show recent command history

Setup:
  /update              Check for ARGENT updates
  /install             Install/upgrade ARGENT
  /memory              View/edit persistent memory
  /theme [name]        Switch theme
  /vim                 Toggle vim mode keybindings
  /voice               Toggle voice input mode

Workflow:
  /spec [topic]        Start spec-driven development
  /init                Generate AGENTS.md for project
  /pr [title]          Create a PR with current changes
  /issue [title]       Create a GitHub issue
  /fix [issue]         Attempt to fix a GitHub issue
  /explain [code]      Explain a piece of code

Discovery:
  /shortcuts           Show keyboard shortcuts
  /palette             Open command palette
  Ctrl+K               Open command palette

Swarm:
  /swarm [n tasks]     Dispatch parallel subagent tasks
```

## OAuth (No API Key Needed)

Several providers support browser-based OAuth — no API key required:

```bash
argent
# Choose [3] Codex OAuth → Opens browser → ChatGPT sign-in → Done!

# Or from within ARGENT:
/oauth codex      # OpenAI Codex
/oauth xai        # xAI Grok
/oauth gemini     # Google Gemini
/oauth qwen       # Qwen
/oauth minimax    # MiniMax
/oauth nous       # Nous Research
```

Tokens are stored in `~/.argent/auth.json` and auto-refreshed.

## Configuration

Create a `.argent/` directory in your project:

```
.argent/
├── argent.jsonc        # Provider, permission, MCP config
├── agent/             # Custom agent definitions (*.md)
│   └── my-agent.agent.md
├── command/           # Custom slash commands (*.md)
│   └── deploy.md
└── tool/              # Custom tools (*.ts)
    └── slack.ts
```

## Installation Methods

### npm (recommended)
```bash
npm i -g argent
```

### curl (standalone binary)
```bash
curl -fsSL https://raw.githubusercontent.com/DNDED/argent/master/scripts/install.sh | bash
```

### Homebrew
```bash
brew install dnded/argent/argent
```

### Scoop (Windows)
```powershell
scoop bucket add argent https://github.com/DNDED/scoop-argent
scoop install argent
```

### From source
```bash
git clone https://github.com/DNDED/argent.git
cd argent
bun install
bun run build
npm link ./packages/argent
```

## Features

- **37 providers** — Every major AI provider, plus OAuth for free access
- **Streaming responses** — Real-time token output with tool progress
- **Three agents** — build (full-access), plan (read-only), explore (subagent)
- **Tool calling** — Multi-step tool loops with bash, file ops, grep, glob, web fetch
- **Permission system** — Per-agent, per-tool allow/deny/ask policies
- **Premium TUI** — Dark aurora theme with split-pane layout
- **First-run setup** — Interactive wizard to choose your provider
- **OAuth** — Browser-based login for Codex, xAI, Gemini, Qwen, MiniMax, Nous
- **Auto-detect** — Automatically detects API keys from environment variables
- **Headless mode** — Scriptable: pipe prompts via stdin with `argent --headless -y`

## Building From Source

```bash
git clone https://github.com/DNDED/argent.git
cd argent
bun install
bun run build          # Build for npm
bun run build:binary   # Build standalone binaries
bun test               # Run tests
```

## License

MIT
