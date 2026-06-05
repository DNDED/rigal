import { AuthStore } from "./auth-store.js"
import type { OAuthToken } from "./auth-store.js"
import { startCodexOAuth } from "./codex.js"
import { startXaiOAuth } from "./xai.js"
import { startGeminiOAuth } from "./gemini.js"
import { startQwenOAuth } from "./qwen.js"
import { startMinimaxOAuth } from "./minimax.js"
import { startNousOAuth } from "./nous.js"
import type { ProviderDescriptor } from "../descriptors/provider.js"

export { AuthStore } from "./auth-store.js"
export type { OAuthToken } from "./auth-store.js"

export interface OAuthStatus {
  providerId: string
  authenticated: boolean
  expiresAt?: number
  email?: string
}

const SUPPORTED_PROVIDERS = ["codex", "xai", "gemini", "qwen", "minimax", "nous"] as const
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number]

const OAUTH_HANDLERS: Record<SupportedProvider, (store: AuthStore) => Promise<OAuthToken>> = {
  codex: startCodexOAuth,
  xai: startXaiOAuth,
  gemini: startGeminiOAuth,
  qwen: startQwenOAuth,
  minimax: startMinimaxOAuth,
  nous: startNousOAuth,
}

export class OAuthManager {
  private authStore: AuthStore

  constructor(authStore?: AuthStore) {
    this.authStore = authStore ?? new AuthStore()
  }

  async startOAuth(provider: string): Promise<OAuthToken> {
    const key = provider.toLowerCase() as SupportedProvider
    const handler = OAUTH_HANDLERS[key]
    if (!handler) {
      throw new Error(
        `Unsupported OAuth provider "${provider}". Supported: ${SUPPORTED_PROVIDERS.join(", ")}`
      )
    }
    return handler(this.authStore)
  }

  async getAccessToken(provider: string): Promise<string | null> {
    if (this.authStore.isTokenValid(provider)) {
      const token = this.authStore.getToken(provider)
      return token?.accessToken ?? null
    }

    const existing = this.authStore.getToken(provider)
    if (!existing) return null

    if (existing.refreshToken) {
      try {
        const refreshed = await this.authStore.refreshToken(provider, async (refreshToken) => {
          const res = await fetch(getRefreshUrl(provider), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: refreshToken,
              client_id: getRefreshClientId(provider),
            }).toString(),
          })

          if (!res.ok) {
            const text = await res.text()
            throw new Error(`Token refresh failed (${res.status}): ${text}`)
          }

          const data = await res.json() as Record<string, unknown>

          return {
            accessToken: data["access_token"] as string,
            refreshToken: (data["refresh_token"] as string) ?? refreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + ((data["expires_in"] as number) ?? 3600),
            tokenType: (data["token_type"] as string) ?? "Bearer",
            scope: (data["scope"] as string) ?? undefined,
            provider,
          }
        })
        return refreshed.accessToken
      } catch {
        return null
      }
    }

    return null
  }

  getTokenStatus(provider: string): { valid: boolean; expiresAt?: number; provider: string } {
    const token = this.authStore.getToken(provider)
    if (!token) {
      return { valid: false, provider }
    }
    return {
      valid: this.authStore.isTokenValid(provider),
      expiresAt: token.expiresAt,
      provider,
    }
  }

  revokeToken(provider: string): void {
    this.authStore.deleteToken(provider)
  }

  getToken(providerId: string): OAuthToken | undefined {
    const token = this.authStore.getToken(providerId)
    if (!token) return undefined
    if (!this.authStore.isTokenValid(providerId)) return undefined
    return token
  }

  getStatus(providerId: string): OAuthStatus {
    const token = this.authStore.getToken(providerId)
    if (!token) {
      return { providerId, authenticated: false }
    }
    if (!this.authStore.isTokenValid(providerId)) {
      return { providerId, authenticated: false }
    }
    return {
      providerId,
      authenticated: true,
      expiresAt: token.expiresAt,
    }
  }

  getAllStatuses(): OAuthStatus[] {
    const tokens = this.authStore.listTokens()
    return Object.keys(tokens).map((id) => this.getStatus(id))
  }

  revoke(providerId: string): boolean {
    const token = this.authStore.getToken(providerId)
    if (!token) return false
    this.authStore.deleteToken(providerId)
    return true
  }

  async startFlow(provider: ProviderDescriptor): Promise<OAuthToken | null> {
    if (provider.authType !== "oauth") {
      throw new Error(`Provider "${provider.name}" does not support OAuth`)
    }
    try {
      return await this.startOAuth(provider.vendor)
    } catch {
      return null
    }
  }
}

function getRefreshUrl(provider: string): string {
  const urls: Record<string, string> = {
    codex: "https://auth.openai.com/oauth/token",
    xai: "https://auth.x.ai/oauth/token",
    gemini: "https://oauth2.googleapis.com/token",
    qwen: "https://chat.qwen.ai/api/v1/oauth2/token",
  }
  return urls[provider] ?? ""
}

function getRefreshClientId(provider: string): string {
  const ids: Record<string, string> = {
    codex: "app_EMoamEEZ73f0CkXaXp7hrann",
    xai: "rigal-cli",
    gemini: "rigal-cli.apps.googleusercontent.com",
    qwen: "rigal-cli",
  }
  return ids[provider] ?? "rigal-cli"
}
