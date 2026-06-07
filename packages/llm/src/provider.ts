import type { Message } from "@argent/core"

export interface ProviderOptions {
  apiKey: string
  baseUrl?: string
  model: string
  headers?: Record<string, string>
  maxTokens?: number
  temperature?: number
}

export interface ProviderResponse {
  text: string
  toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>
  usage?: { inputTokens: number; outputTokens: number }
  stopReason?: string
}

export interface LLMProvider {
  readonly name: string
  readonly models: string[]
  chat(messages: Message[], tools?: unknown[], options?: Partial<ProviderOptions>): Promise<ProviderResponse>
  stream(messages: Message[], tools?: unknown[], options?: Partial<ProviderOptions>, signal?: AbortSignal): AsyncGenerator<ProviderStreamEvent>
}

export type ProviderStreamEvent =
  | { type: "start" }
  | { type: "delta"; text: string }
  | { type: "tool_call"; toolCall: { id: string; name: string; arguments: string } }
  | { type: "tool_call_done" }
  | { type: "stop"; stopReason: string; usage?: { inputTokens: number; outputTokens: number } }
  | { type: "error"; error: string }
