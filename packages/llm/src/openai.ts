import type { Message, ToolCall, MessageContent } from "@argent/core"
import type { LLMProvider, ProviderOptions, ProviderResponse, ProviderStreamEvent } from "./provider.js"
import { createFetchSignal } from "./fetch-timeout.js"

export function createOpenAIProvider(options: ProviderOptions): LLMProvider {
  const apiKey = options.apiKey
  const baseUrl = options.baseUrl || "https://api.openai.com/v1"
  const model = options.model || "gpt-4o"

  function buildHeaders() {
    const h: Record<string, string> = { "content-type": "application/json" }
    if (apiKey) h.authorization = `Bearer ${apiKey}`
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        h[k] = v
      }
    }
    return h
  }

  function toOpenAIMessages(msgs: Message[]) {
    return msgs.map((m) => {
      if (m.role === "system") return { role: "system", content: (m.content || []).map((c) => c.text || "").join("\n") }
      if (m.role === "user") return { role: "user", content: (m.content || []).map((c) => (c.type === "text" ? { type: "text", text: c.text || "" } : { type: "image_url", image_url: { url: c.imageUrl } })) }
      if (m.role === "assistant") {
        const entry: Record<string, unknown> = { role: "assistant", content: (m.content || []).map((c) => c.text || "").join("\n") || null }
        if (m.toolCalls?.length) {
          entry.tool_calls = m.toolCalls.map((tc: ToolCall) => ({
            id: tc.id,
            type: "function",
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          }))
        }
        return entry
      }
      return { role: "tool", tool_call_id: m.toolCallId, content: (m.content || []).map((c) => c.text || "").join("\n") }
    })
  }

  return {
    name: "openai",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o3-mini", "gpt-4.1"],

    async chat(messages, tools, opts) {
      const body: Record<string, unknown> = {
        model: opts?.model || model,
        messages: toOpenAIMessages(messages),
        max_tokens: opts?.maxTokens || 8192,
        temperature: opts?.temperature ?? 0.7,
      }
      if (tools?.length) body.tools = tools

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(body),
        signal: createFetchSignal(),
      })

      if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`)

      const json = await res.json() as {
        choices?: Array<{
          message?: {
            content?: string
            tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>
          }
          finish_reason?: string
        }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }
      const choice = json.choices?.[0]
      const msg = choice?.message

      return {
        text: msg?.content || "",
        toolCalls: msg?.tool_calls?.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: (() => { try { return JSON.parse(tc.function.arguments || "{}") } catch { return {} } })(),
        })),
        usage: {
          inputTokens: json.usage?.prompt_tokens || 0,
          outputTokens: json.usage?.completion_tokens || 0,
        },
        stopReason: choice?.finish_reason || "stop",
      }
    },

    async *stream(messages, tools, opts, signal?) {
      const body: Record<string, unknown> = {
        model: opts?.model || model,
        messages: toOpenAIMessages(messages),
        max_tokens: opts?.maxTokens || 8192,
        temperature: opts?.temperature ?? 0.7,
        stream: true,
      }
      if (tools?.length) body.tools = tools

      let res: Response
      try {
        res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: buildHeaders(),
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
          yield { type: "error", error: `OpenAI API error (${res.status}): ${responseBody.slice(0, 200).replace(/\n/g, " ")}` }
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
              const delta = event.choices?.[0]?.delta

              if (delta?.content) {
                yield { type: "delta", text: delta.content }
              }

              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index as number
                  if (!toolCallBuffers.has(idx)) {
                    toolCallBuffers.set(idx, { id: tc.id || "", name: tc.function?.name || "", arguments: "" })
                  }
                  const buf = toolCallBuffers.get(idx)!
                  if (tc.id) buf.id = tc.id
                  if (tc.function?.name) buf.name = tc.function.name
                  if (tc.function?.arguments) buf.arguments += tc.function.arguments
                }
              }

              if (event.usage) {
                inputTokens = event.usage.prompt_tokens || 0
                outputTokens = event.usage.completion_tokens || 0
              }

              const choice = event.choices?.[0]

              if (choice?.finish_reason) {
                for (const [idx, toolCall] of toolCallBuffers) {
                  try {
                    const parsed = JSON.parse(toolCall.arguments || "{}")
                    yield { type: "tool_call", toolCall: { id: toolCall.id, name: toolCall.name, arguments: JSON.stringify(parsed) } }
                    yield { type: "tool_call_done" }
                  } catch {
                    yield { type: "tool_call", toolCall }
                    yield { type: "tool_call_done" }
                  }
                }
                yield { type: "stop", stopReason: choice.finish_reason, usage: { inputTokens, outputTokens } }
              }

              if (event.error) {
                yield { type: "error", error: event.error.message || "Unknown error" }
              }
            } catch {
              // skip
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
