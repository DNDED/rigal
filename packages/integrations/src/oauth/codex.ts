import { randomBytes, createHash } from "node:crypto"
import { exec } from "node:child_process"
import type { AuthStore, OAuthToken } from "./auth-store.js"

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
const TOKEN_URL = "https://auth.openai.com/oauth/token"
const AUTH_URL = "https://auth.openai.com/oauth/authorize"
const SCOPES = "openai.public"

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url")
  const challenge = createHash("sha256").update(verifier).digest("base64url")
  return { verifier, challenge }
}

function openBrowser(url: string): void {
  const platform = process.platform
  const cmd =
    platform === "darwin" ? `open "${url}"` :
    platform === "win32" ? `start "" "${url}"` :
    `xdg-open "${url}"`
  exec(cmd, () => {})
}

function startCallbackServer() {
  let codeResolver!: (val: { code: string; close: () => void }) => void
  let codeRejecter!: (err: Error) => void
  let resolved = false
  let server: ReturnType<typeof Bun.serve> | null = null

  const codePromise = new Promise<{ code: string; close: () => void }>((resolve, reject) => {
    codeResolver = resolve
    codeRejecter = reject
  })

  return {
    serverPromise: new Promise<{ port: number }>((resolve) => {
      server = Bun.serve({
        port: 0,
        hostname: "127.0.0.1",
        fetch(req) {
          const url = new URL(req.url)
          const code = url.searchParams.get("code")
          const error = url.searchParams.get("error")

          if (error) {
            if (!resolved) {
              resolved = true
              codeRejecter(new Error(`OAuth error: ${error} - ${url.searchParams.get("error_description") ?? ""}`))
            }
            return new Response("<html><body><h1>Authentication failed. You can close this window.</h1></body></html>", {
              headers: { "Content-Type": "text/html" },
            })
          }

          if (!code) {
            return new Response("<html><body><h1>Missing authorization code.</h1></body></html>", {
              headers: { "Content-Type": "text/html" },
            })
          }

          if (!resolved) {
            resolved = true
            codeResolver({
              code,
              close: () => server!.stop(true),
            })
          }

          return new Response("<html><body><h1>Authentication successful! You can close this window.</h1></body></html>", {
            headers: { "Content-Type": "text/html" },
          })
        },
      })
      resolve({ port: server!.port! })

      setTimeout(() => {
        if (!resolved) {
          resolved = true
          server?.stop(true)
          codeRejecter(new Error("OAuth callback timed out after 120 seconds"))
        }
      }, 120_000)
    }),
    codePromise,
  }
}

async function exchangeCodeForToken(
  code: string,
  port: number,
  verifier: string
): Promise<OAuthToken> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: `http://127.0.0.1:${port}/callback`,
    code_verifier: verifier,
  })

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }

  const data = await res.json() as Record<string, unknown>

  return {
    accessToken: data["access_token"] as string,
    refreshToken: (data["refresh_token"] as string) ?? undefined,
    expiresAt: Math.floor(Date.now() / 1000) + ((data["expires_in"] as number) ?? 3600),
    tokenType: (data["token_type"] as string) ?? "Bearer",
    scope: (data["scope"] as string) ?? undefined,
    provider: "codex",
  }
}

export async function startCodexOAuth(authStore: AuthStore): Promise<OAuthToken> {
  const { verifier, challenge } = generatePKCE()

  const { serverPromise, codePromise } = startCallbackServer()
  const { port: callbackPort } = await serverPromise

  const redirectUri = `http://127.0.0.1:${callbackPort}/callback`

  const authParams = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: "S256",
  })

  const authUrl = `${AUTH_URL}?${authParams.toString()}`

  console.log("Opening browser for OpenAI Codex authentication...")
  console.log(`If the browser doesn't open, visit:\n${authUrl}\n`)
  openBrowser(authUrl)

  const { code, close } = await codePromise
  close()

  const token = await exchangeCodeForToken(code, callbackPort, verifier)
  await authStore.setToken("codex", token)

  console.log("Codex authentication successful!")
  return token
}
