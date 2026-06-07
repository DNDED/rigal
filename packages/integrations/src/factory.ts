import type { LLMProvider, ProviderOptions } from "@argent/llm"
import type { ProviderDescriptor } from "./descriptors/provider.js"
import { createAnthropicProvider } from "@argent/llm/anthropic"
import { createOpenAIProvider } from "@argent/llm/openai"
import { createGeminiProvider } from "@argent/llm/gemini"

export interface ProviderCredentials {
  apiKey?: string
  oauthToken?: string
  baseUrl?: string
  model?: string
  headers?: Record<string, string>
}

export function createProviderFromDescriptor(
  descriptor: ProviderDescriptor,
  credentials: ProviderCredentials
): LLMProvider {
  const apiKey = credentials.apiKey || credentials.oauthToken || (descriptor.authType === "none" ? "none" : "")
  const baseUrl = credentials.baseUrl || descriptor.baseUrl || ""
  const model = credentials.model || descriptor.defaultModel
  const headers = {
    ...(descriptor.headers || {}),
    ...(credentials.headers || {}),
  }

  const options: ProviderOptions = {
    apiKey,
    baseUrl,
    model,
    headers,
  }

  if (descriptor.authType === "aws-sdk") {
    throw new Error("AWS Bedrock SigV4 auth not yet supported")
  }

  switch (descriptor.transport) {
    case "anthropic-native":
      return createAnthropicProvider(options)

    case "openai-compatible":
      return createOpenAIProvider(options)

    case "codex":
    case "codex-responses":
      return createOpenAIProvider({
        ...options,
        headers: {
          "OpenAI-Beta": "responses=v1",
          ...headers,
        },
      })

    case "gemini":
    case "gemini-native":
      return createGeminiProvider(options)

    case "custom":
      return createOpenAIProvider(options)

    default:
      return createOpenAIProvider(options)
  }
}

export function createProviderFromEnv(descriptor: ProviderDescriptor): LLMProvider | null {
  let apiKey: string | undefined

  for (const envVar of descriptor.envVars) {
    const val = process.env[envVar]
    if (val) {
      apiKey = val
      break
    }
  }

  if (!apiKey && descriptor.authType !== "none") {
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
  for (const descriptor of Object.values(descriptors)) {
    for (const envVar of descriptor.envVars) {
      const apiKey = process.env[envVar]
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
