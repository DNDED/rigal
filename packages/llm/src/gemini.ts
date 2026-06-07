import type { LLMProvider, ProviderOptions, ProviderResponse, ProviderStreamEvent } from "./provider.js"
import type { Message, MessageContent, ToolCall } from "@argent/core"
import { createFetchSignal } from "./fetch-timeout.js"

export function createGeminiProvider(options: ProviderOptions): LLMProvider {
  const apiKey = options.apiKey
  const baseUrl = options.baseUrl || "https://generativelanguage.googleapis.com/v1beta"
  const model = options.model || "gemini-2.5-pro"

  function toGeminiContents(messages: Message[]) {
    return messages.filter(m => m.role !== "system").map((m) => {
      const content = m.content || []
      if (m.role === "user") {
        return { role: "user", parts: content.map((c) => (c.type === "text" ? { text: c.text } : { inline_data: { mime_type: "image/png", data: (c as { imageUrl?: string }).imageUrl } })) }
      }
      if (m.role === "assistant") {
        const parts: Record<string, unknown>[] = content.filter((c) => c.text).map((c) => ({ text: c.text }))
        if (m.toolCalls?.length) {
          for (const tc of m.toolCalls) {
            parts.push({
              functionCall: { name: tc.name, args: tc.arguments },
            })
          }
        }
        return { role: "model", parts: parts.length > 0 ? parts : [{ text: " " }] }
      }
      return {
        role: "function",
        parts: [{ functionResponse: { name: "tool_result", response: { content: content.map((c) => c.text || "").join("\n") } } }],
      }
    })
  }

  function toolsToGeminiDeclarations(tools: unknown[]) {
    if (!tools?.length) return undefined
    return tools.map((t: unknown) => {
      const f = (t as { function: { name: string; description: string; parameters: unknown } }).function
      return { name: f.name, description: f.description, parameters: f.parameters }
    })
  }

  return {
    name: "gemini",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-pro-preview-05-25",
    ],

    async chat(messages, tools, opts) {
      const systemMsgs = messages.filter(m => m.role === "system")
      const nonSystemMsgs = messages.filter(m => m.role !== "system")
      const body: Record<string, unknown> = {
        contents: toGeminiContents(nonSystemMsgs),
        generationConfig: {
          maxOutputTokens: opts?.maxTokens || 8192,
          temperature: opts?.temperature ?? 0.7,
        },
      }
      if (systemMsgs.length > 0) {
        body.systemInstruction = {
          parts: systemMsgs.flatMap(m => (m.content || []).map((c: any) => c.type === "text" ? { text: c.text } : { text: "" })).filter((p: any) => p.text)
        }
      }

      const toolDeclarations = toolsToGeminiDeclarations(tools || [])
      if (toolDeclarations) body.tools = [{ functionDeclarations: toolDeclarations }]

      const res = await fetch(
        `${baseUrl}/models/${opts?.model || model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json", ...(options.headers || {}) },
          body: JSON.stringify(body),
          signal: createFetchSignal(),
        }
      )

      if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`)

      const json = await res.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string; functionCall?: { name: string; args: Record<string, unknown> } }>
          }
          finishReason?: string
        }>
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
      }
      const candidate = json.candidates?.[0]
      const content = candidate?.content

      const parts = content?.parts || []
      const textParts = parts
        .filter((p): p is { text: string } => typeof p.text === "string")
        .map((p) => p.text)
        .join("")
      const toolCalls = parts
        .filter(
          (p): p is { functionCall: { name: string; args: Record<string, unknown> } } =>
            !!p.functionCall && typeof p.functionCall.name === "string"
        )
        .map((p, i: number) => ({
          id: `call_${i}`,
          name: p.functionCall.name,
          arguments: p.functionCall.args || {},
        }))

      return {
        text: textParts,
        toolCalls: toolCalls.length ? toolCalls : undefined,
        usage: {
          inputTokens: json.usageMetadata?.promptTokenCount || 0,
          outputTokens: json.usageMetadata?.candidatesTokenCount || 0,
        },
        stopReason: candidate?.finishReason || "STOP",
      }
    },

    async *stream(messages, tools, opts, signal?) {
      const systemMsgs = messages.filter(m => m.role === "system")
      const nonSystemMsgs = messages.filter(m => m.role !== "system")
      const body: Record<string, unknown> = {
        contents: toGeminiContents(nonSystemMsgs),
        generationConfig: {
          maxOutputTokens: opts?.maxTokens || 8192,
          temperature: opts?.temperature ?? 0.7,
        },
      }
      if (systemMsgs.length > 0) {
        body.systemInstruction = {
          parts: systemMsgs.flatMap(m => (m.content || []).map((c: any) => c.type === "text" ? { text: c.text } : { text: "" })).filter((p: any) => p.text)
        }
      }

      const toolDeclarations = toolsToGeminiDeclarations(tools || [])
      if (toolDeclarations) body.tools = [{ functionDeclarations: toolDeclarations }]

      let res: Response
      try {
        res = await fetch(
          `${baseUrl}/models/${opts?.model || model}:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: "POST",
            headers: { "content-type": "application/json", ...(options.headers || {}) },
            body: JSON.stringify(body),
            signal: createFetchSignal(signal),
          }
        )
      } catch (err) {
        console.error("[argent] Provider fetch error:", (err instanceof Error ? err.message : String(err)).replace(/key=[^&\s]+/, "key=REDACTED"))
        yield { type: "error", error: "Cannot reach the API. Check your network and try again." }
        return
      }

      if (!res.ok) {
        const responseBody = await res.text()
        if (res.status === 401) {
          yield { type: "error", error: "Invalid API key. Check your key at the provider's dashboard or try a different provider." }
        } else if (res.status === 403) {
          yield { type: "error", error: "API key doesn't have access. Check your account permissions." }
        } else if (res.status === 429) {
          yield { type: "error", error: "Rate limited. Wait a moment and try again." }
        } else if (res.status === 404) {
          yield { type: "error", error: "Model not found. Check the model name or try a different one." }
        } else {
          yield { type: "error", error: `API error (${res.status}): ${responseBody.slice(0, 200).replace(/\n/g, " ")}` }
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
      let fullText = ""
      let inputTokens = 0
      let outputTokens = 0
      let finishReason = ""
      let toolCallCounter = 0

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
            if (!data.trim() || data === "[DONE]") continue

            try {
              const event = JSON.parse(data)
              const candidate = event.candidates?.[0]
              if (!candidate) continue

              const parts = candidate.content?.parts || []
              for (const part of parts) {
                if (part.text) {
                  fullText += part.text
                  yield { type: "delta", text: part.text }
                }
                if (part.functionCall) {
                  yield {
                    type: "tool_call",
                    toolCall: {
                      id: `call_${toolCallCounter++}`,
                      name: part.functionCall.name || "unknown",
                      arguments: JSON.stringify(part.functionCall.args || {}),
                    },
                  }
                  yield { type: "tool_call_done" }
                }
              }

              if (event.usageMetadata) {
                inputTokens = event.usageMetadata.promptTokenCount || 0
                outputTokens = event.usageMetadata.candidatesTokenCount || 0
              }

              if (candidate.finishReason) {
                finishReason = candidate.finishReason
              }
            } catch {
              // skip malformed events
            }
          }
        }
      yield { type: "stop", stopReason: finishReason, usage: { inputTokens, outputTokens } }
      } catch (err) {
        yield { type: "error", error: err instanceof Error ? err.message : String(err) }
      } finally {
        reader.releaseLock()
      }
    },
  }
}
