import { listProviders } from "@rigal/integrations"
import type { ProviderDescriptor } from "@rigal/integrations"

export interface SetupResult {
  provider: string
  apiKey?: string
  model?: string
}

export function renderSetupPrompt(): string {
  const providers = listProviders()
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║                                          ║")
  lines.push("║  ⬡  R  I  G  A  L                       ║")
  lines.push("║                                          ║")
  lines.push("║  Welcome! Let's set up your provider     ║")
  lines.push("║                                          ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")
  lines.push("Choose a provider:")
  lines.push("")

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i]
    if (!p) continue
    const num = String(i + 1).padStart(2, " ")
    const name = p.name.padEnd(20, " ")
    const authLabel = formatAuthLabel(p)
    lines.push(`  [${num}]  ${name} (${authLabel})`)
  }

  lines.push("")
  lines.push("Enter number (or 'q' to quit):")

  return lines.join("\n")
}

export function processSetupSelection(input: string): SetupResult | null | "invalid" | "quit" {
  if (input.toLowerCase() === "q" || input.toLowerCase() === "quit") {
    return "quit"
  }

  const num = parseInt(input.trim(), 10)
  const providers = listProviders()

  if (isNaN(num) || num < 1 || num > providers.length) {
    return "invalid"
  }

  const selected = providers[num - 1]
  if (!selected) return "invalid"

  return {
    provider: selected.id,
    model: selected.defaultModel,
  }
}

export function renderApiKeyPrompt(provider: ProviderDescriptor): string {
  if (provider.authType === "none") {
    return `${provider.name} requires no authentication. Ready to go!`
  }

  if (provider.authType === "oauth") {
    return `${provider.name} uses OAuth. Run /oauth ${provider.id} to authenticate.`
  }

  const envVar = provider.envVar || "API_KEY"
  return `Enter your ${provider.name} API key (or set ${envVar} env var):\n  Key: `
}

function formatAuthLabel(provider: ProviderDescriptor): string {
  switch (provider.authType) {
    case "api-key":
      return "API key"
    case "oauth":
      return "free — browser login"
    case "bearer":
      return "bearer token"
    case "none":
      return "no auth needed"
    default:
      return provider.authType
  }
}
