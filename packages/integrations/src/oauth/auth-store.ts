import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, rmdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const REFRESH_SKEW_SECONDS = 120

export interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
  scope?: string
  provider: string
}

interface AuthStoreData {
  tokens: Record<string, OAuthToken>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class AuthStore {
  private storePath: string
  private storeDir: string
  private lockPath: string

  constructor() {
    this.storeDir = join(homedir(), ".rigal")
    this.storePath = join(this.storeDir, "auth.json")
    this.lockPath = join(this.storeDir, ".auth.lock")
    if (!existsSync(this.storeDir)) {
      mkdirSync(this.storeDir, { recursive: true, mode: 0o700 })
    }
  }

  private readStore(): AuthStoreData {
    if (!existsSync(this.storePath)) {
      return { tokens: {} }
    }
    try {
      const raw = readFileSync(this.storePath, "utf-8")
      return JSON.parse(raw) as AuthStoreData
    } catch {
      return { tokens: {} }
    }
  }

  private writeStore(data: AuthStoreData): void {
    const tmp = `${this.storePath}.tmp`
    writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 })
    renameSync(tmp, this.storePath)
  }

  private async acquireLock(retries = 10, delayMs = 100): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        mkdirSync(this.lockPath, { mode: 0o700 })
        return
      } catch {
        if (i === retries - 1) {
          throw new Error("Failed to acquire lock on auth store after multiple retries")
        }
        await sleep(delayMs * (i + 1))
      }
    }
  }

  private releaseLock(): void {
    try {
      rmdirSync(this.lockPath)
    } catch {}
  }

  private async withLock<T>(fn: () => Promise<T> | T): Promise<T> {
    await this.acquireLock()
    try {
      return await fn()
    } finally {
      this.releaseLock()
    }
  }

  getToken(provider: string): OAuthToken | null {
    const data = this.readStore()
    return data.tokens[provider] ?? null
  }

  setToken(provider: string, token: OAuthToken): void {
    const data = this.readStore()
    data.tokens[provider] = { ...token, provider }
    this.writeStore(data)
  }

  deleteToken(provider: string): void {
    const data = this.readStore()
    delete data.tokens[provider]
    this.writeStore(data)
  }

  isTokenValid(provider: string): boolean {
    const token = this.getToken(provider)
    if (!token) return false
    const now = Math.floor(Date.now() / 1000)
    return token.expiresAt - REFRESH_SKEW_SECONDS > now
  }

  async refreshToken(
    provider: string,
    refreshFn: (refreshToken: string) => Promise<OAuthToken>
  ): Promise<OAuthToken> {
    return this.withLock(async () => {
      const token = this.getToken(provider)
      if (!token) throw new Error(`No token found for provider "${provider}"`)
      if (!token.refreshToken) throw new Error(`No refresh token available for provider "${provider}"`)

      const newToken = await refreshFn(token.refreshToken)
      this.setToken(provider, newToken)
      return newToken
    })
  }

  listTokens(): Record<string, OAuthToken> {
    const data = this.readStore()
    return { ...data.tokens }
  }
}
