import type { LLMProvider, ProviderOptions, ProviderResponse } from "./provider.js"
import type { Message } from "@argent/core"
import { createFetchSignal } from "./fetch-timeout.js"

export function createOllamaProvider(options: ProviderOptions): LLMProvider {
  const baseUrl = options.baseUrl || "http://localhost:11434/v1"
  const model = options.model || "qwen2.5-coder:7b"
  const apiKey = options.apiKey || "ollama"

  return {
    name: "ollama",
    models: ["qwen2.5-coder:7b", "qwen2.5-coder:14b", "codellama:7b", "codellama:13b", "deepseek-r1:8b", "deepseek-r1:14b", "llama3.1:8b", "mistral:7b"],

    async chat(messages: Message[], tools?: unknown[], options?: Partial<ProviderOptions>) {
      const body: Record<string, unknown> = {
        model: options?.model || model,
        messages: messages.map((m) => {
          if (m.role === "system") return { role: "system", content: (m.content || []).map((c: any) => c.text || "").join("\n") }
          if (m.role === "user") return { role: "user", content: (m.content || []).map((c: any) => c.text || "").join("\n") }
          if (m.role === "assistant") return { role: "assistant", content: (m.content || []).map((c: any) => c.text || "").join("\n") }
          return { role: "tool", tool_call_id: (m as any).toolCallId, content: (m.content || []).map((c: any) => c.text || "").join("\n") }
        }),
        stream: false,
      }
      if (tools?.length) body.tools = tools

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: createFetchSignal(),
      })

      if (!res.ok) throw new Error(`Ollama API error: ${res.status} ${await res.text()}`)

      const json = await res.json() as {
        choices?: Array<{ message?: { content?: string; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> }; finish_reason?: string }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }
      const choice = json.choices?.[0]

      const toolCalls = choice?.message?.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: (() => { try { return JSON.parse(tc.function.arguments || "{}") } catch { return {} } })(),
      }))

      return {
        text: choice?.message?.content || "",
        toolCalls,
        usage: {
          inputTokens: json.usage?.prompt_tokens || 0,
          outputTokens: json.usage?.completion_tokens || 0,
        },
        stopReason: choice?.finish_reason || "stop",
      }
    },

    async *stream(messages: Message[], tools?: unknown[], opts?: Partial<ProviderOptions>, signal?: AbortSignal) {
      const body: Record<string, unknown> = {
        model: opts?.model || model,
        messages: messages.map((m) => {
          if (m.role === "system") return { role: "system", content: (m.content || []).map((c: any) => c.text || "").join("\n") }
          if (m.role === "user") return { role: "user", content: (m.content || []).map((c: any) => c.text || "").join("\n") }
          if (m.role === "assistant") return { role: "assistant", content: (m.content || []).map((c: any) => c.text || "").join("\n") }
          return { role: "tool", tool_call_id: (m as any).toolCallId, content: (m.content || []).map((c: any) => c.text || "").join("\n") }
        }),
        stream: true,
      }
      if (opts?.maxTokens !== undefined) body.max_tokens = opts.maxTokens
      if (opts?.temperature !== undefined) body.temperature = opts.temperature
      if (tools?.length) body.tools = tools

      const headers: Record<string, string> = {
        "content-type": "application/json",
      }
      if (apiKey && apiKey !== "ollama") headers.authorization = `Bearer ${apiKey}`
      if (options.headers) Object.assign(headers, options.headers)

      let res: Response
      try {
        res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers,
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
          yield { type: "error", error: `Ollama API error (${res.status}): ${responseBody.slice(0, 200).replace(/\n/g, " ")}` }
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
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            let parsedLine = line
            if (parsedLine.startsWith("data: ")) parsedLine = parsedLine.slice(6)
            if (!parsedLine.trim()) continue
            if (parsedLine === "[DONE]") continue
            try {
              const event = JSON.parse(parsedLine)
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
                inputTokens = event.usage.prompt_tokens || event.prompt_eval_count || 0
                outputTokens = event.usage.completion_tokens || event.eval_count || 0
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
              } else if (event.done) {
                yield { type: "stop", stopReason: "stop", usage: { inputTokens, outputTokens } }
              }
            } catch {}
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
