import type { Message, ToolCall, MessageContent } from "@rigal/core"
import type { LLMProvider, ProviderOptions, ProviderResponse, ProviderStreamEvent } from "./provider.js"

export function createOpenAIProvider(options: ProviderOptions): LLMProvider {
  const apiKey = options.apiKey
  const baseUrl = options.baseUrl || "https://api.openai.com/v1"
  const model = options.model || "gpt-4o"

  function toOpenAIMessages(msgs: Message[]) {
    return msgs.map((m) => {
      if (m.role === "user") return { role: "user", content: m.content.map((c) => (c.type === "text" ? { type: "text", text: c.text || "" } : { type: "image_url", image_url: { url: c.imageUrl } })) }
      if (m.role === "assistant") {
        const entry: Record<string, unknown> = { role: "assistant", content: m.content.map((c) => c.text || "").join("\n") || null }
        if (m.toolCalls?.length) {
          entry.tool_calls = m.toolCalls.map((tc: ToolCall) => ({
            id: tc.id,
            type: "function",
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          }))
        }
        return entry
      }
      return { role: "tool", tool_call_id: m.toolCallId, content: m.content.map((c) => c.text || "").join("\n") }
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
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          ...(options.headers || {}),
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`)

      const json = await res.json()
      const choice = json.choices?.[0]
      const msg = choice?.message

      return {
        text: msg?.content || "",
        toolCalls: msg?.tool_calls?.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || "{}"),
        })),
        usage: {
          inputTokens: json.usage?.prompt_tokens || 0,
          outputTokens: json.usage?.completion_tokens || 0,
        },
        stopReason: choice?.finish_reason || "stop",
      }
    },

    async *stream(messages, tools, opts) {
      const body: Record<string, unknown> = {
        model: opts?.model || model,
        messages: toOpenAIMessages(messages),
        max_tokens: opts?.maxTokens || 8192,
        temperature: opts?.temperature ?? 0.7,
        stream: true,
        stream_options: { include_usage: true },
      }
      if (tools?.length) body.tools = tools

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          ...(options.headers || {}),
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        yield { type: "error", error: `OpenAI API error: ${res.status}` }
        return
      }

      yield { type: "start" }

      const reader = res.body!.getReader()
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
      }
    },
  }
}
