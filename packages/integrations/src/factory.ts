import type { LLMProvider, ProviderOptions } from "@rigal/llm"
import type { ProviderDescriptor } from "./registry/index.js"
import { createAnthropicProvider } from "@rigal/llm/anthropic"
import { createOpenAIProvider } from "@rigal/llm/openai"
import { createOllamaProvider } from "@rigal/llm/ollama"

export interface ProviderCredentials {
  apiKey?: string
  oauthToken?: string
  baseUrl?: string
  model?: string
}

export function createProviderFromDescriptor(
  descriptor: ProviderDescriptor,
  credentials: ProviderCredentials
): LLMProvider {
  const apiKey = credentials.apiKey || credentials.oauthToken || ""
  const baseUrl = credentials.baseUrl || descriptor.baseUrl || ""
  const model = credentials.model || descriptor.defaultModel

  const options: ProviderOptions = {
    apiKey,
    baseUrl,
    model,
    headers: descriptor.headers,
  }

  switch (descriptor.transport) {
    case "anthropic-native":
      return createAnthropicProvider(options)

    case "openai-compatible":
      return createOpenAIProvider(options)

    case "codex":
      return createOpenAIProvider({
        ...options,
        headers: {
          ...descriptor.headers,
          "OpenAI-Beta": "responses=v1",
        },
      })

    case "gemini":
      return createOpenAIProvider(options)

    case "custom":
      return createOpenAIProvider(options)

    default:
      return createOpenAIProvider(options)
  }
}

export function createProviderFromEnv(descriptor: ProviderDescriptor): LLMProvider | null {
  let apiKey: string | undefined

  if (descriptor.envVar) {
    apiKey = process.env[descriptor.envVar]
  }

  if (!apiKey && descriptor.authType !== "none" && descriptor.authType !== "oauth") {
    return null
  }

  return createProviderFromDescriptor(descriptor, {
    apiKey: apiKey || "none",
    baseUrl: descriptor.baseUrl,
    model: descriptor.defaultModel,
  })
}

export function autoDetectProvider(descriptors: Record<string, ProviderDescriptor>): {
  provider: ProviderDescriptor
  credentials: ProviderCredentials
} | null {
  for (const [id, descriptor] of Object.entries(descriptors)) {
    if (descriptor.envVar) {
      const apiKey = process.env[descriptor.envVar]
      if (apiKey) {
        return {
          provider: descriptor,
          credentials: {
            apiKey,
            baseUrl: descriptor.baseUrl,
            model: descriptor.defaultModel,
          },
        }
      }
    }
  }

  return null
}
