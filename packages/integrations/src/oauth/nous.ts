import { exec } from "node:child_process"
import type { AuthStore, OAuthToken } from "./auth-store.js"

const CLIENT_ID = "argent-cli"
const DEVICE_CODE_URL = "https://auth.nousresearch.com/oauth/device/code"
const TOKEN_URL = "https://auth.nousresearch.com/oauth/token"
const AUTH_URL = "https://auth.nousresearch.com/activate"
const POLL_INTERVAL_MS = 5000
const POLL_TIMEOUT_MS = 300_000

function openBrowser(url: string): void {
  const platform = process.platform
  const cmd =
    platform === "darwin" ? `open "${url}"` :
    platform === "win32" ? `start "" "${url}"` :
    `xdg-open "${url}"`
  exec(cmd, () => {})
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestDeviceCode(): Promise<{ userCode: string; deviceCode: string; verificationUri: string }> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: "openid profile email",
  })

  const res = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to request device code (${res.status}): ${text}`)
  }

  const data = await res.json() as Record<string, unknown>

  return {
    userCode: data["user_code"] as string,
    deviceCode: data["device_code"] as string,
    verificationUri: (data["verification_uri"] as string) ?? AUTH_URL,
  }
}

async function pollForToken(deviceCode: string): Promise<OAuthToken> {
  const startTime = Date.now()

  while (Date.now() - startTime < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS)

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      client_id: CLIENT_ID,
      device_code: deviceCode,
    })

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, unknown>
      const error = data["error"] as string | undefined

      if (error === "authorization_pending") continue
      if (error === "slow_down") {
        await sleep(POLL_INTERVAL_MS)
        continue
      }
      if (error === "expired_token") {
        throw new Error("Device code expired. Please try again.")
      }
      if (error === "access_denied") {
        throw new Error("User denied the authorization request.")
      }

      throw new Error(`Token poll failed: ${error ?? `HTTP ${res.status}`}`)
    }

    const data = await res.json() as Record<string, unknown>

    return {
      accessToken: data["access_token"] as string,
      refreshToken: (data["refresh_token"] as string) ?? undefined,
      expiresAt: Math.floor(Date.now() / 1000) + ((data["expires_in"] as number) ?? 3600),
      tokenType: (data["token_type"] as string) ?? "Bearer",
      scope: (data["scope"] as string) ?? undefined,
      provider: "nous",
    }
  }

  throw new Error("Timed out waiting for Nous Research authentication")
}

export async function startNousOAuth(authStore: AuthStore): Promise<OAuthToken> {
  const { userCode, deviceCode, verificationUri } = await requestDeviceCode()

  const loginUrl = `${verificationUri}?user_code=${encodeURIComponent(userCode)}`

  console.log("Nous Research Authentication")
  console.log(`Your device code: ${userCode}`)
  console.log(`\nOpening browser for sign-in...`)
  console.log(`If the browser doesn't open, visit:\n${loginUrl}\n`)
  openBrowser(loginUrl)

  const token = await pollForToken(deviceCode)
  await authStore.setToken("nous", token)

  console.log("Nous Research authentication successful!")
  return token
}
