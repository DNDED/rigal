import type { ArgentEngine } from "./engine.js"
import type { CommandDef } from "@argent/core"
import { providerCommand } from "./commands/provider.js"
import { modelCommand } from "./commands/model.js"
import { reasoningCommand } from "./commands/reasoning.js"
import { oauthCommand } from "./commands/oauth.js"
import { renderSetupPrompt, processSetupSelection, renderApiKeyPrompt } from "./commands/setup.js"
import { listProviders } from "@argent/integrations"

import { compactCommand } from "./commands/compact.js"
import { forkCommand } from "./commands/fork.js"
import { resumeCommand } from "./commands/resume.js"
import { rewindCommand } from "./commands/rewind.js"
import { branchCommand } from "./commands/branch.js"
import { renameCommand } from "./commands/rename.js"

import { diffCommand } from "./commands/diff.js"
import { reviewCommand } from "./commands/review.js"
import { lintCommand } from "./commands/lint.js"
import { securityCommand } from "./commands/security.js"
import { testCommand } from "./commands/test.js"

import { costCommand } from "./commands/cost.js"
import { doctorCommand } from "./commands/doctor.js"
import { statsCommand } from "./commands/stats.js"
import { contextCommand } from "./commands/context.js"
import { historyCommand, addToHistory } from "./commands/history.js"

import { updateCommand } from "./commands/update.js"
import { installCommand } from "./commands/install.js"
import { memoryCommand } from "./commands/memory.js"
import { themeCommand } from "./commands/theme.js"
import { vimCommand } from "./commands/vim.js"
import { voiceCommand } from "./commands/voice.js"

import { specCommand } from "./commands/spec.js"
import { initCommand } from "./commands/init.js"
import { prCommand } from "./commands/pr.js"
import { issueCommand } from "./commands/issue.js"
import { fixCommand } from "./commands/fix.js"
import { explainCommand } from "./commands/explain.js"

import { paletteCommand } from "./commands/palette.js"
import { shortcutsCommand } from "./commands/shortcuts.js"
import { swarmCommand } from "./commands/swarm.js"

export class CommandHandler {
  private engine: ArgentEngine
  private customCommands: Map<string, CommandDef> = new Map()

  constructor(engine: ArgentEngine) {
    this.engine = engine
    this.loadCustomCommands()
  }

  loadCustomCommands(): void {
    const defs = this.engine.config.getCommands()
    const builtins = new Set([
      "/help", "/agent", "/model", "/provider", "/reasoning", "/oauth", "/setup",
      "/clear", "/undo", "/exit", "/quit", "/status",
      "/compact", "/fork", "/resume", "/rewind", "/branch", "/rename",
      "/diff", "/review", "/lint", "/security", "/test",
      "/cost", "/doctor", "/stats", "/context", "/history",
      "/update", "/install", "/memory", "/theme", "/vim", "/voice",
      "/spec", "/init", "/pr", "/issue", "/fix", "/explain",
      "/palette", "/shortcuts", "/swarm",
    ])
    for (const cmd of defs) {
      const name = `/${cmd.name}`
      if (builtins.has(name)) {
        console.error("[argent] Custom command /" + cmd.name + " shadows built-in — custom wins")
      }
      this.customCommands.set(name, cmd)
    }
  }

  handle(input: string): { handled: boolean; message?: string } {
    if (!input.startsWith("/")) return { handled: false }

    const parts = input.split(/\s+/)
    const cmd = parts[0]?.toLowerCase()
    const args = parts.slice(1)

    if (!cmd) return { handled: true }

    addToHistory(cmd + (args.length ? " " + args.join(" ") : ""))

    const custom = this.customCommands.get(cmd)
    if (custom) {
      return { handled: true, message: `CUSTOM_COMMAND:${custom.name}` }
    }

    switch (cmd) {
      case "/help":
        return { handled: true, message: this.showHelp() }

      case "/agent": {
        const arg = args.join(" ")
        if (!arg) {
          const agents = this.engine.getAgents()
          return { handled: true, message: `Agents: ${agents.map((a) => a.name).join(", ")}\n  Use /agent <name> to switch.` }
        }
        const agent = this.engine.switchAgent(arg)
        if (agent) return { handled: true, message: `Switched to agent: ${agent.name} — ${agent.description}` }
        return { handled: true, message: `Agent "${arg}" not found.` }
      }

      case "/model": {
        const currentDesc = this.engine.getCurrentProviderDescriptor()
        const currentModel = this.engine.getProviderInfo().model
        const result = modelCommand(args, currentDesc, currentModel)
        if (result.startsWith("MODEL_SELECT:")) {
          const modelName = result.slice("MODEL_SELECT:".length)
          this.engine.setModel(modelName)
          return { handled: true, message: `Model set to: ${modelName}\n\nNext step:\n  Choose reasoning level: /reasoning (default: medium)` }
        }
        return { handled: true, message: result }
      }

      case "/reasoning": {
        const currentReasoning = this.engine.getReasoning()
        const result = reasoningCommand(args, currentReasoning)
        if (result.startsWith("REASONING_SELECT:")) {
          const level = result.slice("REASONING_SELECT:".length) as "low" | "medium" | "high" | "max"
          this.engine.setReasoning(level)
          return { handled: true, message: `Reasoning level set to: ${level}\n\nSetup complete. Start coding!` }
        }
        return { handled: true, message: result }
      }

      case "/provider": {
        const providers = listProviders()
        const currentId = this.engine.getCurrentProviderId()
        const result = providerCommand(args, providers, currentId)
        if (result.startsWith("SELECT:")) {
          const providerId = result.slice("SELECT:".length)
          return { handled: true, message: `SETUP_PROVIDER:${providerId}` }
        }
        return { handled: true, message: result }
      }

      case "/oauth": {
        const oauthMgr = this.engine.getOAuthManager()
        oauthCommand(args, oauthMgr).then((msg) => {
          this.engine.emitInfoMessage(msg)
        }).catch((err) => {
          this.engine.emitErrorMessage("OAuth error: " + (err instanceof Error ? err.message : String(err)))
        })
        return { handled: true, message: "Starting OAuth flow..." }
      }

      case "/setup": {
        return { handled: true, message: `SETUP_MENU` }
      }

      case "/clear":
        this.engine.clearSession()
        return { handled: true, message: "Session cleared. Starting fresh." }

      case "/undo":
        return { handled: true, message: this.engine.undoLastExchange() ? "Undo — removed the last response." : "Nothing to undo." }

      case "/exit":
      case "/quit":
        process.exit(0)

      case "/status":
        return { handled: true, message: this.showStatus() }

      // ─── Session Commands ───
      case "/compact":
        return { handled: true, message: compactCommand(this.engine) }

      case "/fork":
        return { handled: true, message: forkCommand(args, this.engine) }

      case "/resume":
        return { handled: true, message: resumeCommand(args, this.engine) }

      case "/rewind":
        return { handled: true, message: rewindCommand(args, this.engine) }

      case "/branch":
        return { handled: true, message: branchCommand(args, this.engine) }

      case "/rename":
        return { handled: true, message: renameCommand(args, this.engine) }

      // ─── Review Commands ───
      case "/diff":
        return { handled: true, message: diffCommand(this.engine) }

      case "/review":
        return { handled: true, message: reviewCommand(args, this.engine) }

      case "/lint":
        return { handled: true, message: lintCommand(this.engine) }

      case "/security":
        return { handled: true, message: securityCommand(this.engine) }

      case "/test":
        return { handled: true, message: testCommand(args, this.engine) }

      // ─── Info Commands ───
      case "/cost":
        return { handled: true, message: costCommand(this.engine) }

      case "/doctor":
        return { handled: true, message: doctorCommand(this.engine) }

      case "/stats":
        return { handled: true, message: statsCommand(this.engine) }

      case "/context":
        return { handled: true, message: contextCommand(this.engine) }

      case "/history":
        return { handled: true, message: historyCommand(args, this.engine) }

      // ─── Setup Commands ───
      case "/update":
        return { handled: true, message: updateCommand(this.engine) }

      case "/install":
        return { handled: true, message: installCommand(args, this.engine) }

      case "/memory":
        return { handled: true, message: memoryCommand(args, this.engine) }

      case "/theme":
        return { handled: true, message: themeCommand(args, this.engine) }

      case "/vim":
        return { handled: true, message: vimCommand(this.engine) }

      case "/voice":
        return { handled: true, message: voiceCommand(this.engine) }

      // ─── Workflow Commands ───
      case "/spec":
        return { handled: true, message: specCommand(args, this.engine) }

      case "/init":
        return { handled: true, message: initCommand(this.engine) }

      case "/pr":
        return { handled: true, message: prCommand(args, this.engine) }

      case "/issue":
        return { handled: true, message: issueCommand(args, this.engine) }

      case "/fix":
        return { handled: true, message: fixCommand(args, this.engine) }

      case "/explain":
        return { handled: true, message: explainCommand(args, this.engine) }

      // ─── Swarm Commands ───
      case "/swarm":
        return { handled: true, message: swarmCommand(args, this.engine.swarm, this.engine, this.engine.sessionId || "none") }

      // ─── Discovery Commands ───
      case "/palette":
        return { handled: true, message: paletteCommand(this.engine) }

      case "/shortcuts":
        return { handled: true, message: shortcutsCommand(this.engine) }

      default:
        return { handled: true, message: `Unknown command: ${cmd}. Type /help for available commands.` }
    }
  }

  private showHelp(): string {
    return `
╔══════════════════════════════════════════════════════════════╗
║                        ARGENT Commands                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Core                                                        ║
║    /agent [name]        Switch agent (build, plan, explore)   ║
║    /model [name]        Switch AI model                       ║
║    /provider [name|#]   Change provider                       ║
║    /oauth <provider>    Start OAuth flow                      ║
║    /oauth status        Show OAuth statuses                   ║
║    /oauth revoke <p>    Revoke OAuth token                    ║
║    /setup               Re-run first-run setup                ║
║    /clear               Start a new session                   ║
║    /undo                Revert last change                    ║
║    /status              Show current status                   ║
║                                                              ║
║  Session                                                     ║
║    /compact             Summarize and reduce context          ║
║    /fork [name]         Fork current session                  ║
║    /resume [session]    Resume a past session                 ║
║    /rewind              Show checkpoint options               ║
║    /branch [name]       Create named session branch           ║
║    /rename [name]       Rename current session                ║
║                                                              ║
║  Review                                                      ║
║    /diff                Show inline diffs                     ║
║    /review              Review pending changes                ║
║    /lint                Run linter and show results           ║
║    /security            Run security scan on changes          ║
║    /test [pattern]      Run tests with optional pattern       ║
║                                                              ║
║  Info                                                        ║
║    /cost                Show detailed cost breakdown          ║
║    /doctor              Diagnose configuration issues         ║
║    /stats               Show usage statistics                 ║
║    /context             Show context window usage             ║
║    /history             Show recent command history           ║
║                                                              ║
║  Setup                                                       ║
║    /update              Check for ARGENT updates              ║
║    /install             Install/upgrade ARGENT                ║
║    /memory              View/edit persistent memory           ║
║    /theme [name]        Switch theme (dark/light/contrast)    ║
║    /vim                 Toggle vim mode keybindings           ║
║    /voice               Toggle voice input mode               ║
║                                                              ║
║  Workflow                                                    ║
║    /spec [topic]        Start spec-driven development         ║
║    /init                Generate AGENTS.md for project        ║
║    /pr [title]          Create a PR with current changes      ║
║    /issue [title]       Create a GitHub issue                 ║
║    /fix [issue]         Attempt to fix a GitHub issue         ║
║    /explain [code]      Explain a piece of code               ║
║                                                              ║
║  Discovery                                                    ║
║    /shortcuts           Show keyboard shortcuts               ║
║    Ctrl+K               Open command palette                  ║
║                                                              ║
║  Other                                                       ║
║    /help                Show this help                        ║
║    /exit                Quit ARGENT                           ║
║                                                              ║
║  Keybinds                                                     ║
║    Tab                  Switch agent                          ║
║    Ctrl+C               Quit                                  ║
║    Ctrl+K               Command palette                       ║
║    Enter                Send message                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`
  }

  private showStatus(): string {
    const info = this.engine.getProviderInfo()
    const agent = this.engine.getAgent()
    const desc = this.engine.getCurrentProviderDescriptor()
    const lines: string[] = []
    lines.push(`Provider: ${info.name}${desc ? ` (${desc.id})` : ""}`)
    lines.push(`Model: ${info.model}`)
    lines.push(`Agent: ${agent?.name || "none"}`)
    lines.push(`Working dir: ${this.engine.config.getWorkingDir()}`)
    if (desc?.authType === "oauth") {
      const oauthMgr = this.engine.getOAuthManager()
      const status = oauthMgr.getStatus(desc.id)
      lines.push(`OAuth: ${status.authenticated ? "authenticated" : "not authenticated"}`)
    }
    return lines.join("\n")
  }
}
