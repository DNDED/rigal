export interface ProviderDescriptor {
  id: string
  vendor: string
  name: string
  transport: "anthropic-native" | "openai-compatible" | "codex" | "gemini" | "custom"
  authType: "api-key" | "oauth" | "bearer" | "none"
  envVar?: string
  baseUrl?: string
  defaultModel: string
  models: string[]
  headers?: Record<string, string>
  description?: string
}

export interface GatewayDescriptor {
  name: string
  baseUrl: string
  providers: string[]
  authType: "api-key" | "bearer"
}

export function defineProvider(desc: ProviderDescriptor): ProviderDescriptor {
  return desc
}

export function defineGateway(desc: GatewayDescriptor): GatewayDescriptor {
  return desc
}
