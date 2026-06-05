import type { LLMProvider, ProviderOptions, ProviderResponse } from "./provider.js"
import type { Message } from "@rigal/core"

export function createOllamaProvider(options: ProviderOptions): LLMProvider {
  const baseUrl = options.baseUrl || "http://localhost:11434/v1"
  const model = options.model || "qwen2.5-coder:7b"
  const apiKey = options.apiKey || "ollama"

  return {
    name: "ollama",
    models: ["qwen2.5-coder:7b", "qwen2.5-coder:14b", "codellama:7b", "codellama:13b", "deepseek-r1:8b", "deepseek-r1:14b", "llama3.1:8b", "mistral:7b"],

    async chat(messages: Message[]) {
      const body: Record<string, unknown> = {
        model,
        messages: messages.map((m) => {
          if (m.role === "user") return { role: "user", content: m.content.map((c) => c.text || "").join("\n") }
          if (m.role === "assistant") return { role: "assistant", content: m.content.map((c) => c.text || "").join("\n") }
          return { role: "tool", content: m.content.map((c) => c.text || "").join("\n") }
        }),
        stream: false,
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Ollama API error: ${res.status} ${await res.text()}`)

      const json = await res.json()
      const choice = json.choices?.[0]

      return {
        text: choice?.message?.content || "",
        usage: {
          inputTokens: json.usage?.prompt_tokens || 0,
          outputTokens: json.usage?.completion_tokens || 0,
        },
        stopReason: choice?.finish_reason || "stop",
      }
    },

    async *stream(messages: Message[]) {
      const body = {
        model,
        messages: messages.map((m) => {
          if (m.role === "user") return { role: "user", content: m.content.map((c) => c.text || "").join("\n") }
          if (m.role === "assistant") return { role: "assistant", content: m.content.map((c) => c.text || "").join("\n") }
          return { role: "tool", content: m.content.map((c) => c.text || "").join("\n") }
        }),
        stream: true,
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        yield { type: "error", error: `Ollama API error: ${res.status}` }
        return
      }

      yield { type: "start" }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const event = JSON.parse(line)
              const delta = event.choices?.[0]?.delta
              if (delta?.content) {
                yield { type: "delta", text: delta.content }
              }
              if (event.done) {
                yield {
                  type: "stop",
                  stopReason: "stop",
                  usage: {
                    inputTokens: event.prompt_eval_count || 0,
                    outputTokens: event.eval_count || 0,
                  },
                }
              }
            } catch {}
          }
        }
      } catch (err) {
        yield { type: "error", error: err instanceof Error ? err.message : String(err) }
      }
    },
  }
}
