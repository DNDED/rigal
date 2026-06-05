import type { ToolDef, ToolContext, ToolResult } from "@rigal/core"

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
    const url = params.url as string
    const format = (params.format as string) || "markdown"
    const timeout = ((params.timeout as number) || 30) * 1000

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "user-agent": "RIGAL/0.1 (coding-agent)" },
      })

      clearTimeout(timer)

      if (!res.ok) {
        return { content: [{ type: "text", text: `HTTP ${res.status}: ${res.statusText}` }], isError: true }
      }

      const contentType = res.headers.get("content-type") || ""

      if (format === "html" || contentType.includes("html")) {
        const html = await res.text()
        return { content: [{ type: "text", text: html.slice(0, 100000) + (html.length > 100000 ? "\n[truncated]" : "") }] }
      }

      const text = await res.text()
      const stripped = stripHtml(text)

      if (stripped.length > 100000) {
        return { content: [{ type: "text", text: stripped.slice(0, 100000) + "\n[content truncated at 100000 characters]" }] }
      }

      return { content: [{ type: "text", text: stripped || "(empty response)" }] }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Fetch failed: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  },
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
