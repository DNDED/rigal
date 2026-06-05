import type { Message, ToolCall, MessageContent, AssistantMessage, ToolResultMessage } from "@rigal/core"
import type { LLMProvider, ProviderOptions, ProviderResponse, ProviderStreamEvent } from "./provider.js"

export function createAnthropicProvider(options: ProviderOptions): LLMProvider {
  const apiKey = options.apiKey
  const baseUrl = options.baseUrl || "https://api.anthropic.com/v1"
  const model = options.model || "claude-sonnet-4-20250514"

  function toAnthropicMessages(msgs: Message[]) {
    return msgs.map((m) => {
      if (m.role === "user") return { role: "user", content: contentToAnthropic(m.content) }
      if (m.role === "assistant") {
        const block: Record<string, unknown> = { role: "assistant", content: contentToAnthropic(m.content) }
        if (m.toolCalls?.length) {
          block.content = m.toolCalls.map((tc: ToolCall) => ({
            type: "tool_use",
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          }))
        }
        return block
      }
      const r = m as ToolResultMessage
      return {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: r.toolCallId, content: r.content.map((c) => c.text || "").join("\n") }],
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
      "claude-3-opus-20240229",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
    ],

    async chat(messages, tools, opts) {
      const body: Record<string, unknown> = {
        model: opts?.model || model,
        max_tokens: opts?.maxTokens || 8192,
        messages: toAnthropicMessages(messages),
      }
      if (tools?.length) {
        body.tools = tools.map((t: unknown) => (t as { function: { name: string; description: string; parameters: unknown } }).function)
      }

      const res = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`)

      const json = await res.json()

      const textContent = json.content?.filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("") || ""

      const toolCalls = json.content
        ?.filter((c: { type: string }) => c.type === "tool_use")
        .map((c: { id: string; name: string; input: Record<string, unknown> }) => ({
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

    async *stream(messages, tools, opts) {
      const body: Record<string, unknown> = {
        model: opts?.model || model,
        max_tokens: opts?.maxTokens || 8192,
        messages: toAnthropicMessages(messages),
        stream: true,
      }
      if (tools?.length) {
        body.tools = tools.map((t: unknown) => (t as { function: { name: string; description: string; parameters: unknown } }).function)
      }

      const res = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        yield { type: "error", error: `Anthropic API error: ${res.status}` }
        return
      }

      yield { type: "start" }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let currentToolCall: { id: string; name: string; arguments: string } | null = null
      let inputTokens = 0
      let outputTokens = 0
      let stopReason = ""

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

              if (event.type === "message_start") {
                inputTokens = event.message?.usage?.input_tokens || 0
              }

              if (event.type === "content_block_delta") {
                if (event.delta?.type === "text_delta") {
                  yield { type: "delta", text: event.delta.text }
                }
                if (event.delta?.type === "input_json_delta") {
                  if (currentToolCall) {
                    currentToolCall.arguments += event.delta.partial_json
                  }
                }
              }

              if (event.type === "content_block_start") {
                if (event.content_block?.type === "tool_use") {
                  currentToolCall = {
                    id: event.content_block.id,
                    name: event.content_block.name,
                    arguments: "",
                  }
                }
              }

              if (event.type === "content_block_stop") {
                if (event.index !== undefined && currentToolCall) {
                  yield { type: "tool_call", toolCall: currentToolCall }
                  yield { type: "tool_call_done" }
                  currentToolCall = null
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
      }
    },
  }
}
