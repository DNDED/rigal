import type { OAuthManager, OAuthStatus } from "@rigal/integrations"
import { PROVIDERS, getProvider } from "@rigal/integrations"

export async function oauthCommand(
  args: string[],
  oauthManager: OAuthManager
): Promise<string> {
  if (args.length === 0) {
    return renderOAuthHelp()
  }

  const subcmd = args[0] ?? ""

  if (subcmd === "status") {
    return renderOAuthStatuses(oauthManager)
  }

  if (subcmd === "revoke") {
    const providerId = args[1]
    if (!providerId) return "Usage: /oauth revoke <provider>"
    const provider = getProvider(providerId)
    if (!provider) return `Provider "${providerId}" not found.`
    const revoked = oauthManager.revoke(providerId)
    if (revoked) return `OAuth token revoked for ${provider.name}.`
    return `No active token for ${provider.name}.`
  }

  const provider = getProvider(subcmd)
  if (!provider) return `Provider "${subcmd}" not found. Use /oauth status to see available providers.`
  if (provider.authType !== "oauth") return `${provider.name} does not use OAuth. Use an API key instead.`

  try {
    const token = await oauthManager.startFlow(provider)
    if (token) {
      const expires = new Date(token.expiresAt).toLocaleDateString()
      return `Authenticated with ${provider.name}.\nToken expires: ${expires}\nYou can now use this provider.`
    }
    return `OAuth flow cancelled for ${provider.name}.`
  } catch (err) {
    return `OAuth error: ${err instanceof Error ? err.message : String(err)}`
  }
}

function renderOAuthHelp(): string {
  const lines: string[] = []
  lines.push("OAuth Commands:")
  lines.push("  /oauth <provider>   Start OAuth flow for a provider")
  lines.push("  /oauth status       Show all OAuth token statuses")
  lines.push("  /oauth revoke <p>   Revoke token for a provider")
  lines.push("")
  lines.push("OAuth-capable providers:")

  for (const p of Object.values(PROVIDERS)) {
    if (p.authType === "oauth") {
      lines.push(`  ${p.id.padEnd(16)} ${p.name}`)
    }
  }

  return lines.join("\n")
}

function renderOAuthStatuses(oauthManager: OAuthManager): string {
  const lines: string[] = []
  lines.push("OAuth Token Status:")
  lines.push("")

  const oauthProviders = Object.values(PROVIDERS).filter((p) => p.authType === "oauth")

  for (const p of oauthProviders) {
    const status = oauthManager.getStatus(p.id)
    if (status.authenticated) {
      const expires = status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : "unknown"
      lines.push(`  ● ${p.name.padEnd(20)} authenticated (expires: ${expires})`)
    } else {
      lines.push(`  ○ ${p.name.padEnd(20)} not authenticated`)
    }
  }

  return lines.join("\n")
}
