export type ToolPermission = "allow" | "deny" | "ask"

export interface ToolDef {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (params: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>
  permission?: {
    type: ToolPermission
    reason?: string
  }
}

export interface ToolContext {
  sessionId: string
  workingDirectory: string
  agentName: string
  signal?: AbortSignal
}

export interface ToolResult {
  content: ToolResultContent[]
  isError?: boolean
}

export interface ToolResultContent {
  type: "text" | "image" | "resource"
  text?: string
  data?: string
  mimeType?: string
}

export interface UserMessage {
  role: "user"
  content: MessageContent[]
}

export interface AssistantMessage {
  role: "assistant"
  content: MessageContent[]
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResultMessage {
  role: "tool"
  toolCallId: string
  content: ToolResultContent[]
}

export type Message = UserMessage | AssistantMessage | ToolResultMessage

export interface MessageContent {
  type: "text" | "image"
  text?: string
  imageUrl?: string
}

export interface Agent {
  name: string
  description: string
  mode: "primary" | "subagent"
  model?: ModelRef
  tools: Record<string, ToolPermission>
  systemPrompt: string
  color?: string
  hidden?: boolean
}

export interface ModelRef {
  provider: string
  model: string
}

export interface Session {
  id: string
  agentName: string
  model: ModelRef
  messages: Message[]
  workingDirectory: string
  createdAt: Date
  updatedAt: Date
  metadata: Record<string, string>
}

export interface ProviderConfig {
  type: string
  apiKey?: string
  baseUrl?: string
  model?: string
  headers?: Record<string, string>
}

export interface RigalConfig {
  provider?: ProviderConfig
  permission?: Record<string, ToolPermission>
  reference?: Record<string, string>
  mcp?: Record<string, unknown>
  agentModels?: Record<string, { baseUrl: string; apiKey: string }>
  agentRouting?: Record<string, string>
  tools?: Record<string, boolean>
}
