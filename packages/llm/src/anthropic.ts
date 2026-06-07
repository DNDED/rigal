import type { Message, ToolCall, MessageContent, AssistantMessage, ToolResultMessage } from "@argent/core"
import type { LLMProvider, ProviderOptions, ProviderResponse, ProviderStreamEvent } from "./provider.js"
import { createFetchSignal } from "./fetch-timeout.js"

export function createAnthropicProvider(options: ProviderOptions): LLMProvider {
  const apiKey = options.apiKey
  const baseUrl = options.baseUrl || "https://api.anthropic.com/v1"
  const model = options.model || "claude-sonnet-4-20250514"

  function toAnthropicMessages(msgs: Message[]) {
    return msgs.map((m) => {
      if (m.role === "system") return { role: "user", content: contentToAnthropic(m.content || []) }
      if (m.role === "user") return { role: "user", content: contentToAnthropic(m.content || []) }
      if (m.role === "assistant") {
        const block: Record<string, unknown> = { role: "assistant", content: contentToAnthropic(m.content || []) }
        if (m.toolCalls?.length) {
          const blocks: Record<string, unknown>[] = []
          if (m.content?.some((c) => c.text)) {
            blocks.push({ type: "text", text: m.content.map((c) => c.text || "").join("\n") })
          }
          for (const tc of m.toolCalls) {
            blocks.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.arguments })
          }
          block.content = blocks
        }
        return block
      }
      const r = m as ToolResultMessage
      return {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: r.toolCallId, content: (r.content || []).map((c) => c.text || "").join("\n") }],
      }
    })
  }

  function contentToAnthropic(content: MessageContent[]) {
    return content.map((c) => {
      if (c.type === "text") return { type: "text", text: c.text }
      if (c.type === "image") return { type: "image", source: { type: "base64", media_type: "image/png", data: c.imageUrl } }
      return { type: "text", text: "" }
    })
  }

  return {
    name: "anthropic",
    models: [
      "claude-sonnet-4-20250514",
      "claude-3-7-sonnet-20250219",
      "claude-3-opus-20240229",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
    ],

    async chat(messages, tools, opts) {
      const systemMsgs = messages.filter(m => m.role === "system")
      const nonSystemMsgs = messages.filter(m => m.role !== "system")
      const systemContent = systemMsgs.map(m => (m.content || []).map((c: any) => c.text || "").join("\n")).join("\n\n")
      const body: Record<string, unknown> = {
        model: opts?.model || model,
        max_tokens: opts?.maxTokens || 8192,
        messages: toAnthropicMessages(nonSystemMsgs),
      }
      if (systemContent) body.system = systemContent
      if (tools?.length) {
        body.tools = tools.map((t: unknown) => (t as { function: { name: string; description: string; parameters: unknown } }).function)
      }

      const headers: Record<string, string> = { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" }
      if (options.headers) {
        for (const [k, v] of Object.entries(options.headers)) {
          headers[k] = v
        }
      }
      const res = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: createFetchSignal(),
      })

      if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`)

      const json = await res.json() as {
        content?: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>
        usage?: { input_tokens?: number; output_tokens?: number }
        stop_reason?: string
      }

      const textContent = (json.content || [])
        .filter((c): c is { type: string; text: string } => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text)
        .join("")

      const toolCalls = (json.content || [])
        .filter(
          (c): c is { type: string; id: string; name: string; input: Record<string, unknown> } =>
            c.type === "tool_use" && typeof c.id === "string" && typeof c.name === "string" && !!c.input
        )
        .map((c) => ({
          id: c.id,
          name: c.name,
          arguments: c.input,
        }))

      return {
        text: textContent,
        toolCalls,
        usage: {
          inputTokens: json.usage?.input_tokens || 0,
          outputTokens: json.usage?.output_tokens || 0,
        },
        stopReason: json.stop_reason,
      }
    },

    async *stream(messages, tools, opts, signal?) {
      const systemMsgs = messages.filter(m => m.role === "system")
      const nonSystemMsgs = messages.filter(m => m.role !== "system")
      const systemContent = systemMsgs.map(m => (m.content || []).map((c: any) => c.text || "").join("\n")).join("\n\n")
      const body: Record<string, unknown> = {
        model: opts?.model || model,
        max_tokens: opts?.maxTokens || 8192,
        messages: toAnthropicMessages(nonSystemMsgs),
        stream: true,
      }
      if (systemContent) body.system = systemContent
      if (tools?.length) {
        body.tools = tools.map((t: unknown) => (t as { function: { name: string; description: string; parameters: unknown } }).function)
      }

      let res: Response
      try {
        res = await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json", ...(options.headers || {}) },
          body: JSON.stringify(body),
          signal: createFetchSignal(signal),
        })
      } catch (err) {
        console.error("[argent] Provider fetch error:", err instanceof Error ? err.message : String(err))
        yield { type: "error", error: "Cannot reach the API. Check your network and try again." }
        return
      }

      if (!res.ok) {
        const responseBody = await res.text()
        if (res.status === 429) {
          yield { type: "error", error: "Rate limited (429). Wait a moment and try again." }
        } else {
          yield { type: "error", error: `Anthropic API error (${res.status}): ${responseBody.slice(0, 200).replace(/\n/g, " ")}` }
        }
        return
      }

      yield { type: "start" }

      if (!res.body) {
        yield { type: "error", error: "Response body is null" }
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      const toolCallBuffers: Map<number, { id: string; name: string; arguments: string }> = new Map()
      let inputTokens = 0
      let outputTokens = 0
      let stopReason = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          if (buffer.length > 1024 * 1024) { yield { type: "error", error: "Stream data too large" }; return }
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6)

            if (data === "[DONE]") continue

            try {
              const event = JSON.parse(data)

              if (event.type === "message_start") {
                inputTokens = event.message?.usage?.input_tokens || 0
              }

              if (event.type === "content_block_delta") {
                if (event.delta?.type === "text_delta") {
                  yield { type: "delta", text: event.delta.text }
                }
                if (event.delta?.type === "input_json_delta") {
                  const buf = toolCallBuffers.get(event.index)
                  if (buf) {
                    buf.arguments += event.delta.partial_json
                  }
                }
                if (event.delta?.type === "thinking_delta") {
                  yield { type: "delta", text: event.delta.thinking }
                }
                if (event.delta?.type === "signature_delta") {
                }
              }

              if (event.type === "content_block_start") {
                if (event.content_block?.type === "tool_use") {
                  toolCallBuffers.set(event.index, {
                    id: event.content_block.id,
                    name: event.content_block.name,
                    arguments: "",
                  })
                } else if (event.content_block?.type === "thinking") {
                  if (event.content_block.thinking) {
                    yield { type: "delta", text: event.content_block.thinking }
                  }
                } else if (event.content_block?.type === "redacted_thinking") {
                  if (event.content_block.data) {
                    yield { type: "delta", text: event.content_block.data }
                  }
                } else {
                  toolCallBuffers.delete(event.index)
                }
              }

              if (event.type === "content_block_stop") {
                if (event.index !== undefined) {
                  const tc = toolCallBuffers.get(event.index)
                  if (tc) {
                    yield { type: "tool_call", toolCall: tc }
                    yield { type: "tool_call_done" }
                  }
                }
              }

              if (event.type === "message_delta") {
                outputTokens = event.usage?.output_tokens || 0
                stopReason = event.delta?.stop_reason || ""
              }

              if (event.type === "message_stop") {
                yield { type: "stop", stopReason, usage: { inputTokens, outputTokens } }
              }

              if (event.type === "error") {
                yield { type: "error", error: event.error?.message || "Unknown error" }
              }

              if (event.type === "ping") continue
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (err) {
        yield { type: "error", error: err instanceof Error ? err.message : String(err) }
      } finally {
        reader.releaseLock()
      }
    },
  }
}
