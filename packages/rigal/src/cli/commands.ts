import type { Agent, ProviderConfig } from "@rigal/core"
import type { RigalEngine, UIEvent } from "./engine.js"
import { providerCommand } from "./commands/provider.js"
import { modelCommand } from "./commands/model.js"
import { oauthCommand } from "./commands/oauth.js"
import { renderSetupPrompt, processSetupSelection, renderApiKeyPrompt } from "./commands/setup.js"
import { listProviders, getProvider, PROVIDERS } from "@rigal/integrations"
import type { ProviderDescriptor } from "@rigal/integrations"

export class CommandHandler {
  private engine: RigalEngine

  constructor(engine: RigalEngine) {
    this.engine = engine
  }

  handle(input: string): { handled: boolean; message?: string } {
    if (!input.startsWith("/")) return { handled: false }

    const parts = input.split(/\s+/)
    const cmd = parts[0]?.toLowerCase()
    const args = parts.slice(1)

    if (!cmd) return { handled: true }

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
          return { handled: true, message: `Model set to: ${modelName}` }
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
          this.engine.emitStatusMessage(msg)
        })
        return { handled: true, message: "Starting OAuth flow..." }
      }

      case "/setup": {
        return { handled: true, message: `SETUP_WIZARD` }
      }

      case "/clear":
        this.engine.sessionId = null
        return { handled: true, message: "Session cleared. Starting fresh." }

      case "/undo":
        return { handled: true, message: "Undo — reverting last change." }

      case "/exit":
      case "/quit":
        process.exit(0)

      case "/status":
        return { handled: true, message: this.showStatus() }

      default:
        return { handled: true, message: `Unknown command: ${cmd}. Type /help for available commands.` }
    }
  }

  private showHelp(): string {
    return `
Available Commands:
  /agent [name]         Switch agent (build, plan, explore)
  /model [name]         Switch model
  /provider [name|#]    Change provider (37 available)
  /oauth <provider>     Start OAuth flow
  /oauth status         Show OAuth token statuses
  /oauth revoke <p>     Revoke OAuth token
  /setup                Re-run first-run setup
  /clear                Start a new session
  /undo                 Revert last change
  /status               Show current status
  /help                 Show this help
  /exit                 Quit RIGAL

Default keybinds:
  Tab               Switch agent
  Ctrl+C            Quit
  Enter             Send message
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
