import type { ToolDef, ToolContext, ToolResult } from "@argent/core"

export const webfetchTool: ToolDef = {
  name: "webfetch",
  description: "Fetches content from a URL and converts to specified format. Supports text, markdown, and HTML output.",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "URL to fetch" },
      format: { type: "string", description: "Output format: text, markdown, or html (default: markdown)" },
      timeout: { type: "number", description: "Optional timeout in seconds (max 120)" },
    },
    required: ["url"],
  },
  permission: { type: "ask", reason: "Web requests may expose information" },

  async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    if (typeof params.url !== "string") return { content: [{ type: "text", text: "url must be a string" }], isError: true }
    const url = params.url as string
    const format = (params.format as string) ?? "markdown"
    const rawTimeout = (params.timeout as number) ?? 30
    const timeout = (isNaN(rawTimeout) || !isFinite(rawTimeout)) ? 30000 : Math.max(1, Math.min(rawTimeout, 120)) * 1000

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return { content: [{ type: "text", text: `Invalid URL: ${url}` }], isError: true }
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { content: [{ type: "text", text: `Blocked protocol: ${parsed.protocol}. Only http(s) allowed.` }], isError: true }
    }

    let hostname = parsed.hostname.toLowerCase()
    const blockedHosts = new Set(["localhost", "0.0.0.0", "[::1]", "metadata.google.internal", "169.254.169.254"])
    const ipv4Mapped = hostname.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
    if (ipv4Mapped && ipv4Mapped[1]) {
      hostname = ipv4Mapped[1]
    }
    if (blockedHosts.has(hostname) || /^0\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return {
        content: [{ type: "text", text: `Blocked internal/private host: ${hostname}` }],
        isError: true,
      }
    }

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "user-agent": "ARGENT/0.1 (coding-agent)" },
        redirect: "manual",
      })

      if ([300, 301, 302, 303, 307, 308].includes(res.status)) {
        clearTimeout(timer)
        const location = res.headers.get("location") || "unknown"
        return { content: [{ type: "text", text: `Redirect blocked (${res.status} to ${location}). Do not follow redirects.` }], isError: true }
      }

      if (!res.ok) {
        clearTimeout(timer)
        let bodyText = ""
        try {
          bodyText = await res.text()
        } catch {}
        return { content: [{ type: "text", text: `HTTP ${res.status}: ${bodyText.slice(0, 500)}` }], isError: true }
      }

      const contentType = res.headers.get("content-type") || ""

      if (format === "html") {
        const html = await readBody(res, controller)
        clearTimeout(timer)
        return { content: [{ type: "text", text: html.slice(0, 100000) + (html.length > 100000 ? "\n[truncated]" : "") }] }
      }

      const text = await readBody(res, controller)
      clearTimeout(timer)
      const stripped = stripHtml(text)

      if (stripped.length > 100000) {
        return { content: [{ type: "text", text: stripped.slice(0, 100000) + "\n[content truncated at 100000 characters]" }] }
      }

      return { content: [{ type: "text", text: stripped || "(empty response)" }] }
    } catch (err) {
      console.error("[argent] webfetch:", err instanceof Error ? err.message : String(err))
      return {
        content: [{ type: "text", text: "Web fetch failed" }],
        isError: true,
      }
    }
  },
}

async function readBody(res: Response, controller: AbortController): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const onAbort = () => reject(new DOMException("Body read aborted", "AbortError"))
    controller.signal.addEventListener("abort", onAbort, { once: true })
    res.text().then(
      (text) => {
        controller.signal.removeEventListener("abort", onAbort)
        resolve(text)
      },
      (err) => {
        controller.signal.removeEventListener("abort", onAbort)
        reject(err)
      }
    )
  })
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
