import type { ProviderDescriptor } from "./descriptors/provider.js"

const anthropic: ProviderDescriptor = {
  id: "anthropic",
  name: "Anthropic",
  vendor: "Anthropic",
  transport: "anthropic-native",
  authType: "api-key",
  envVars: ["ANTHROPIC_API_KEY"],
  baseUrl: "https://api.anthropic.com/v1",
  defaultModel: "claude-sonnet-4-20250514",
  models: [
    "claude-sonnet-4-20250514",
    "claude-3-7-sonnet-20250219",
    "claude-3-opus-20240229",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
  ],
  headers: {
    "anthropic-version": "2023-06-01",
  },
  description: "Claude models — best for coding",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const openai: ProviderDescriptor = {
  id: "openai",
  name: "OpenAI",
  vendor: "OpenAI",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["OPENAI_API_KEY"],
  baseUrl: "https://api.openai.com/v1",
  defaultModel: "gpt-4o",
  models: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "o1",
    "o3-mini",
    "gpt-4.1",
  ],
  description: "GPT models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const codex: ProviderDescriptor = {
  id: "codex",
  name: "OpenAI Codex",
  vendor: "OpenAI",
  transport: "codex-responses",
  authType: "oauth",
  envVars: ["CODEX_API_KEY"],
  baseUrl: "https://chatgpt.com/backend-api/codex",
  defaultModel: "o4-mini",
  models: [
    "gpt-5.5-codex",
    "gpt-5",
    "codex",
    "o4-mini",
  ],
  description: "Free tier via browser login",
  oauthConfig: {
    clientId: "app_EMoamEEZ73f0CkXaXp7hrann",
    tokenUrl: "https://auth.openai.com/oauth/token",
    authUrl: "https://auth.openai.com/authorize",
    scopes: ["openid", "email", "profile"],
    grantType: "device_code",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const openrouter: ProviderDescriptor = {
  id: "openrouter",
  name: "OpenRouter",
  vendor: "OpenRouter",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["OPENROUTER_API_KEY"],
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModel: "openai/gpt-4o",
  models: [
    "openai/gpt-4o",
    "anthropic/claude-sonnet-4",
    "google/gemini-2.5-pro",
    "deepseek/deepseek-r1",
    "meta-llama/llama-3.3-70b",
  ],
  description: "200+ models via one key",
  headers: {
    "HTTP-Referer": "https://argent.dev",
    "X-Title": "ARGENT",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const gemini: ProviderDescriptor = {
  id: "gemini",
  name: "Google Gemini",
  vendor: "Google",
  transport: "gemini-native",
  authType: "api-key",
  envVars: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  defaultModel: "gemini-2.5-pro",
  models: [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ],
  description: "Google's latest models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const geminiCli: ProviderDescriptor = {
  id: "gemini-cli",
  name: "Google Gemini CLI",
  vendor: "Google",
  transport: "gemini-native",
  authType: "oauth",
  envVars: ["GEMINI_API_KEY"],
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  defaultModel: "gemini-2.5-pro",
  models: [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ],
  description: "Gemini CLI OAuth",
  oauthConfig: {
    clientId: "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
    tokenUrl: "https://oauth2.googleapis.com/token",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ["https://www.googleapis.com/auth/generative-language"],
    grantType: "authorization_code",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const githubCopilot: ProviderDescriptor = {
  id: "github-copilot",
  name: "GitHub Copilot",
  vendor: "GitHub",
  transport: "openai-compatible",
  authType: "bearer",
  envVars: ["GITHUB_TOKEN", "COPILOT_API_KEY"],
  baseUrl: "https://api.githubcopilot.com",
  defaultModel: "gpt-4o",
  models: [
    "gpt-4o",
    "claude-sonnet-4",
    "gemini-2.5-pro",
  ],
  description: "Copilot API via VS Code token",
  headers: {
    "editor-version": "vscode/1.99.0",
    "copilot-integration-id": "vscode-chat",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
  },
}

const deepseek: ProviderDescriptor = {
  id: "deepseek",
  name: "DeepSeek",
  vendor: "DeepSeek",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["DEEPSEEK_API_KEY"],
  baseUrl: "https://api.deepseek.com/v1",
  defaultModel: "deepseek-chat",
  models: [
    "deepseek-chat",
    "deepseek-reasoner",
  ],
  description: "Strong reasoning models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const groq: ProviderDescriptor = {
  id: "groq",
  name: "Groq",
  vendor: "Groq",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["GROQ_API_KEY"],
  baseUrl: "https://api.groq.com/openai/v1",
  defaultModel: "llama-3.3-70b-versatile",
  models: [
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ],
  description: "Ultra-fast inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const mistral: ProviderDescriptor = {
  id: "mistral",
  name: "Mistral",
  vendor: "Mistral",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["MISTRAL_API_KEY"],
  baseUrl: "https://api.mistral.ai/v1",
  defaultModel: "codestral-latest",
  models: [
    "codestral-latest",
    "mistral-large-latest",
    "mistral-small-latest",
  ],
  description: "Codestral coding model",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const together: ProviderDescriptor = {
  id: "together",
  name: "Together AI",
  vendor: "Together AI",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["TOGETHER_API_KEY"],
  baseUrl: "https://api.together.xyz/v1",
  defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  models: [
    "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "deepseek-ai/DeepSeek-R1",
  ],
  description: "Open-source model hosting",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const fireworks: ProviderDescriptor = {
  id: "fireworks",
  name: "Fireworks AI",
  vendor: "Fireworks AI",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["FIREWORKS_API_KEY"],
  baseUrl: "https://api.fireworks.ai/inference/v1",
  defaultModel: "accounts/fireworks/models/llama-v3p3-70b-instruct",
  models: [
    "accounts/fireworks/models/llama-v3p3-70b-instruct",
    "accounts/fireworks/models/qwen2p5-coder-32b-instruct",
    "accounts/fireworks/models/deepseek-r1",
  ],
  description: "Fast open-source inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const perplexity: ProviderDescriptor = {
  id: "perplexity",
  name: "Perplexity",
  vendor: "Perplexity",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["PERPLEXITY_API_KEY"],
  baseUrl: "https://api.perplexity.ai",
  defaultModel: "sonar-pro",
  models: [
    "sonar-pro",
    "sonar",
    "sonar-reasoning-pro",
  ],
  description: "Search-augmented models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const cerebras: ProviderDescriptor = {
  id: "cerebras",
  name: "Cerebras",
  vendor: "Cerebras",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["CEREBRAS_API_KEY"],
  baseUrl: "https://api.cerebras.ai/v1",
  defaultModel: "llama-3.3-70b",
  models: [
    "llama-3.3-70b",
    "llama-3.1-8b",
  ],
  description: "Wafer-scale inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const sambanova: ProviderDescriptor = {
  id: "sambanova",
  name: "SambaNova",
  vendor: "SambaNova",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["SAMBANOVA_API_KEY"],
  baseUrl: "https://api.sambanova.ai/v1",
  defaultModel: "Meta-Llama-3.3-70B-Instruct",
  models: [
    "Meta-Llama-3.3-70B-Instruct",
    "Qwen2.5-Coder-32B-Instruct",
    "DeepSeek-R1",
  ],
  description: "Enterprise AI inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const xai: ProviderDescriptor = {
  id: "xai",
  name: "xAI Grok",
  vendor: "xAI",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["XAI_API_KEY"],
  baseUrl: "https://api.x.ai/v1",
  defaultModel: "grok-3",
  models: [
    "grok-3",
    "grok-3-mini",
    "grok-2",
  ],
  description: "Grok models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const xaiOauth: ProviderDescriptor = {
  id: "xai-oauth",
  name: "xAI Grok OAuth",
  vendor: "xAI",
  transport: "openai-compatible",
  authType: "oauth",
  envVars: ["XAI_API_KEY"],
  baseUrl: "https://api.x.ai/v1",
  defaultModel: "grok-3",
  models: [
    "grok-3",
    "grok-3-mini",
    "grok-2",
  ],
  description: "xAI OAuth login",
  oauthConfig: {
    clientId: "xai-argent-client",
    tokenUrl: "https://x.ai/.well-known/openid-configuration/token",
    authUrl: "https://x.ai/.well-known/openid-configuration/authorize",
    scopes: ["openid", "email"],
    grantType: "authorization_code",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const cohere: ProviderDescriptor = {
  id: "cohere",
  name: "Cohere",
  vendor: "Cohere",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["COHERE_API_KEY"],
  baseUrl: "https://api.cohere.ai/compatibility/v1",
  defaultModel: "command-r-plus",
  models: [
    "command-r-plus",
    "command-r",
    "command-a-03-2025",
  ],
  description: "Command-R models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const ai21: ProviderDescriptor = {
  id: "ai21",
  name: "AI21 Labs",
  vendor: "AI21 Labs",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["AI21_API_KEY"],
  baseUrl: "https://api.ai21.com/studio/v1",
  defaultModel: "jamba-1.5-large",
  models: [
    "jamba-1.5-large",
    "jamba-1.5-mini",
  ],
  description: "Jamba hybrid models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const replicate: ProviderDescriptor = {
  id: "replicate",
  name: "Replicate",
  vendor: "Replicate",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["REPLICATE_API_KEY"],
  baseUrl: "https://openai-proxy.replicate.com/v1",
  defaultModel: "meta/meta-llama-3.1-405b-instruct",
  models: [
    "meta/meta-llama-3.1-405b-instruct",
    "meta/meta-llama-3-70b-instruct",
  ],
  description: "Run any model via API",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const huggingface: ProviderDescriptor = {
  id: "huggingface",
  name: "Hugging Face",
  vendor: "Hugging Face",
  transport: "openai-compatible",
  authType: "bearer",
  envVars: ["HF_TOKEN", "HUGGINGFACE_API_KEY"],
  baseUrl: "https://api-inference.huggingface.co/v1",
  defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
  models: [
    "meta-llama/Llama-3.3-70B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "deepseek-ai/DeepSeek-R1",
  ],
  description: "Inference API for HF models",
  features: {
    streaming: true,
    toolCalling: false,
    vision: false,
  },
}

const bedrock: ProviderDescriptor = {
  id: "bedrock",
  name: "AWS Bedrock",
  vendor: "Amazon",
  transport: "anthropic-native",
  authType: "aws-sdk",
  envVars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
  baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
  defaultModel: "anthropic.claude-sonnet-4",
  models: [
    "anthropic.claude-sonnet-4",
    "anthropic.claude-3-opus",
    "meta.llama3-70b",
  ],
  description: "AWS managed models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const azure: ProviderDescriptor = {
  id: "azure",
  name: "Azure Foundry",
  vendor: "Microsoft",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["AZURE_API_KEY", "AZURE_ENDPOINT"],
  baseUrl: "https://{resource}.openai.azure.com/openai/deployments",
  defaultModel: "gpt-4o",
  models: [
    "gpt-4o",
    "gpt-4-turbo",
  ],
  description: "Azure-hosted AI models",
  headers: {
    "api-key": "{AZURE_API_KEY}",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
  },
}

const azureOpenai: ProviderDescriptor = {
  id: "azure-openai",
  name: "Azure OpenAI",
  vendor: "Microsoft",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"],
  baseUrl: "",
  defaultModel: "gpt-4o",
  models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1"],
  description: "Azure-hosted OpenAI models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
  },
}

const vertex: ProviderDescriptor = {
  id: "vertex",
  name: "Vertex AI",
  vendor: "Google",
  transport: "openai-compatible",
  authType: "bearer",
  envVars: ["GOOGLE_APPLICATION_CREDENTIALS", "VERTEX_LOCATION", "VERTEX_PROJECT_ID"],
  baseUrl: "",
  defaultModel: "gemini-2.5-pro",
  models: [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro-preview-05-25",
  ],
  description: "Google Cloud AI platform",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
  },
}

const cloudflare: ProviderDescriptor = {
  id: "cloudflare",
  name: "Cloudflare AI",
  vendor: "Cloudflare",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
  baseUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1",
  defaultModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  models: [
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
  ],
  description: "Workers AI edge inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const github: ProviderDescriptor = {
  id: "github",
  name: "GitHub Models",
  vendor: "GitHub",
  transport: "openai-compatible",
  authType: "bearer",
  envVars: ["GITHUB_TOKEN"],
  baseUrl: "https://models.inference.ai.azure.com",
  defaultModel: "gpt-4o",
  models: [
    "gpt-4o",
    "Claude-3.5-Sonnet",
    "Llama-3.3-70B-Instruct",
    "DeepSeek-R1",
  ],
  description: "Free models with GitHub token",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const codexCli: ProviderDescriptor = {
  id: "codex-cli",
  name: "Codex CLI",
  vendor: "OpenAI",
  transport: "codex",
  authType: "oauth",
  envVars: [],
  baseUrl: "https://api.openai.com/v1",
  defaultModel: "o4-mini",
  models: ["o4-mini", "gpt-4o", "o3"],
  description: "OpenAI Codex CLI auth",
  oauthConfig: {
    clientId: "app_EMoamEEZ73f0CkXaXp7hrann",
    tokenUrl: "https://auth.openai.com/oauth/token",
    authUrl: "https://auth.openai.com/authorize",
    scopes: ["openid", "email", "profile"],
    grantType: "device_code",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const warp: ProviderDescriptor = {
  id: "warp",
  name: "Warp",
  vendor: "Warp",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["WARP_API_KEY"],
  baseUrl: "https://api.warp.dev/v1",
  defaultModel: "warp-code",
  models: ["warp-code", "gpt-4o", "claude-sonnet-4-20250514"],
  description: "Warp terminal AI",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const nous: ProviderDescriptor = {
  id: "nous",
  name: "Nous Research",
  vendor: "Nous Research",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["NOUS_API_KEY"],
  baseUrl: "https://api.nousresearch.com/v1",
  defaultModel: "hermes-3-llama-3.1-405b",
  models: [
    "hermes-3-llama-3.1-405b",
    "hermes-3-llama-3.1-70b",
    "deepseek-v4-pro",
    "deepseek-v4-flash",
  ],
  description: "Nous Research models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const qwenOauth: ProviderDescriptor = {
  id: "qwen-oauth",
  name: "Qwen OAuth",
  vendor: "Alibaba",
  transport: "openai-compatible",
  authType: "oauth",
  envVars: ["QWEN_API_KEY"],
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  defaultModel: "qwen-2.5-coder-32b",
  models: [
    "qwen-2.5-coder-32b",
    "qwen-2.5-72b",
    "qwen-max",
  ],
  description: "Qwen OAuth login",
  oauthConfig: {
    clientId: "qwen-argent-client",
    tokenUrl: "https://account.alibabacloud.com/oauth/token",
    authUrl: "https://account.alibabacloud.com/oauth/authorize",
    scopes: ["openid"],
    grantType: "device_code",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const alibaba: ProviderDescriptor = {
  id: "alibaba",
  name: "Alibaba DashScope",
  vendor: "Alibaba",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["DASHSCOPE_API_KEY"],
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  defaultModel: "qwen-2.5-coder-32b",
  models: [
    "qwen-2.5-coder-32b",
    "qwen-2.5-72b",
    "qwen-max",
    "qwen-plus",
  ],
  description: "Alibaba DashScope",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const kimi: ProviderDescriptor = {
  id: "kimi",
  name: "Kimi",
  vendor: "Moonshot",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["KIMI_API_KEY", "MOONSHOT_API_KEY"],
  baseUrl: "https://api.moonshot.cn/v1",
  defaultModel: "moonshot-v1-128k",
  models: [
    "moonshot-v1-128k",
    "moonshot-v1-32k",
    "kimi-k2.5",
    "kimi-k2.6",
  ],
  description: "Kimi models by Moonshot",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const zhipu: ProviderDescriptor = {
  id: "zhipu",
  name: "Z.AI",
  vendor: "Zhipu",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["ZHIPU_API_KEY"],
  baseUrl: "https://open.bigmodel.cn/api/paas/v4",
  defaultModel: "glm-4-plus",
  models: [
    "glm-4-plus",
    "glm-4-flash",
    "glm-5",
    "glm-5.1",
  ],
  description: "Zhipu GLM models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const novita: ProviderDescriptor = {
  id: "novita",
  name: "NovitaAI",
  vendor: "NovitaAI",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["NOVITA_API_KEY"],
  baseUrl: "https://api.novita.ai/v3/openai",
  defaultModel: "openai/gpt-4o",
  models: [
    "openai/gpt-4o",
    "anthropic/claude-sonnet-4",
    "meta-llama/llama-3.3-70b",
  ],
  description: "Novita AI inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
  },
}

const xiaomi: ProviderDescriptor = {
  id: "xiaomi",
  name: "Xiaomi MiMo",
  vendor: "Xiaomi",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["XIAOMI_API_KEY"],
  baseUrl: "https://api.xiaomi.com/v1",
  defaultModel: "mimo-v2-pro",
  models: [
    "mimo-v2-pro",
    "mimo-v2.5-pro",
    "mimo-omni",
  ],
  description: "Xiaomi MiMo models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const nvidia: ProviderDescriptor = {
  id: "nvidia",
  name: "NVIDIA NIM",
  vendor: "NVIDIA",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["NVIDIA_API_KEY"],
  baseUrl: "https://integrate.api.nvidia.com/v1",
  defaultModel: "meta/llama-3.3-70b-instruct",
  models: [
    "meta/llama-3.3-70b-instruct",
    "nvidia/llama-3.1-nemotron-70b",
  ],
  description: "NVIDIA NIM inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const minimax: ProviderDescriptor = {
  id: "minimax",
  name: "MiniMax",
  vendor: "MiniMax",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["MINIMAX_API_KEY"],
  baseUrl: "https://api.minimax.chat/v1",
  defaultModel: "minimax-01",
  models: [
    "minimax-01",
    "minimax-text-01",
    "minimax-m2.5",
    "minimax-m2.7",
  ],
  description: "MiniMax models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const minimaxOauth: ProviderDescriptor = {
  id: "minimax-oauth",
  name: "MiniMax OAuth",
  vendor: "MiniMax",
  transport: "openai-compatible",
  authType: "oauth",
  envVars: ["MINIMAX_API_KEY"],
  baseUrl: "https://api.minimax.chat/v1",
  defaultModel: "minimax-01",
  models: [
    "minimax-01",
    "minimax-text-01",
    "minimax-m2.5",
    "minimax-m2.7",
  ],
  description: "MiniMax OAuth login",
  oauthConfig: {
    clientId: "minimax-argent-client",
    tokenUrl: "https://api.minimax.chat/oauth/token",
    authUrl: "https://api.minimax.chat/oauth/authorize",
    scopes: ["read", "write"],
    grantType: "authorization_code",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const stepfun: ProviderDescriptor = {
  id: "stepfun",
  name: "StepFun",
  vendor: "StepFun",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["STEPFUN_API_KEY"],
  baseUrl: "https://api.stepfun.com/v1",
  defaultModel: "step-1-128k",
  models: [
    "step-1-128k",
    "step-2-16k",
    "step-3.7-flash",
  ],
  description: "StepFun models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const kilocode: ProviderDescriptor = {
  id: "kilocode",
  name: "Kilo Code",
  vendor: "Kilo Code",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["KILOCODE_API_KEY"],
  baseUrl: "https://api.kilocode.ai/v1",
  defaultModel: "gpt-4o",
  models: [
    "gpt-4o",
    "claude-sonnet-4",
  ],
  description: "Kilo Code API",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
  },
}

const opencodeZen: ProviderDescriptor = {
  id: "opencode-zen",
  name: "OpenCode Zen",
  vendor: "OpenCode",
  transport: "openai-compatible",
  authType: "bearer",
  envVars: ["OPENCODE_API_KEY"],
  baseUrl: "https://api.opencode.ai/v1",
  defaultModel: "gpt-4o",
  models: [
    "gpt-4o",
    "claude-sonnet-4",
    "deepseek-v4-pro",
  ],
  description: "OpenCode Zen proxy",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
    thinking: true,
  },
}

const opencodeGo: ProviderDescriptor = {
  id: "opencode-go",
  name: "OpenCode Go",
  vendor: "OpenCode",
  transport: "openai-compatible",
  authType: "bearer",
  envVars: ["OPENCODE_API_KEY"],
  baseUrl: "https://api.opencode.ai/v1",
  defaultModel: "deepseek-v4-pro",
  models: [
    "deepseek-v4-pro",
    "deepseek-v4-flash",
    "glm-5",
    "kimi-k2.5",
    "mimo-v2-pro",
    "minimax-m2.5",
    "qwen-3.6-plus",
  ],
  description: "OpenCode Go proxy",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const gmi: ProviderDescriptor = {
  id: "gmi",
  name: "GMI Cloud",
  vendor: "GMI Cloud",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["GMI_API_KEY"],
  baseUrl: "https://api.gmicloud.ai/v1",
  defaultModel: "gpt-4o",
  models: [
    "gpt-4o",
    "claude-sonnet-4",
    "gemini-2.5-pro",
  ],
  description: "GMI Cloud inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
  },
}

const arcee: ProviderDescriptor = {
  id: "arcee",
  name: "Arcee AI",
  vendor: "Arcee AI",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["ARCEE_API_KEY"],
  baseUrl: "https://api.arcee.ai/v1",
  defaultModel: "arcee-llama-3.3-70b",
  models: [
    "arcee-llama-3.3-70b",
    "arcee-mistral-large",
  ],
  description: "Arcee AI models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const ollamaCloud: ProviderDescriptor = {
  id: "ollama-cloud",
  name: "Ollama Cloud",
  vendor: "Ollama",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["OLLAMA_API_KEY"],
  baseUrl: "https://api.ollama.ai/v1",
  defaultModel: "llama3.3:70b",
  models: [
    "llama3.3:70b",
    "qwen2.5-coder:32b",
    "deepseek-r1:70b",
  ],
  description: "Ollama cloud API",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const ollama: ProviderDescriptor = {
  id: "ollama",
  name: "Ollama",
  vendor: "Ollama",
  transport: "openai-compatible",
  authType: "none",
  envVars: [],
  baseUrl: "http://localhost:11434/v1",
  defaultModel: "qwen2.5-coder:7b",
  models: [
    "qwen2.5-coder:7b",
    "qwen2.5-coder:14b",
    "codellama:7b",
    "codellama:13b",
    "deepseek-r1:8b",
    "llama3.1:8b",
  ],
  description: "Local models — no API key needed",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const lmstudio: ProviderDescriptor = {
  id: "lmstudio",
  name: "LM Studio",
  vendor: "LM Studio",
  transport: "openai-compatible",
  authType: "none",
  envVars: [],
  baseUrl: "http://localhost:1234/v1",
  defaultModel: "local-model",
  models: ["local-model"],
  description: "Local GUI model runner",
  features: {
    streaming: true,
    toolCalling: false,
    vision: false,
  },
}

const jan: ProviderDescriptor = {
  id: "jan",
  name: "Jan",
  vendor: "Jan",
  transport: "openai-compatible",
  authType: "none",
  envVars: [],
  baseUrl: "http://localhost:1337/v1",
  defaultModel: "local-model",
  models: ["local-model"],
  description: "Local open-source ChatGPT",
  features: {
    streaming: true,
    toolCalling: false,
    vision: false,
  },
}

const vllm: ProviderDescriptor = {
  id: "vllm",
  name: "vLLM",
  vendor: "vLLM",
  transport: "openai-compatible",
  authType: "none",
  envVars: [],
  baseUrl: "http://localhost:8000/v1",
  defaultModel: "local-model",
  models: ["local-model"],
  description: "Self-hosted vLLM server",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const textgen: ProviderDescriptor = {
  id: "textgen",
  name: "Text Gen WebUI",
  vendor: "Oobabooga",
  transport: "openai-compatible",
  authType: "none",
  envVars: [],
  baseUrl: "http://localhost:5000/v1",
  defaultModel: "local-model",
  models: ["local-model"],
  description: "Oobabooga text-generation-webui",
  features: {
    streaming: true,
    toolCalling: false,
    vision: false,
  },
}

const litellm: ProviderDescriptor = {
  id: "litellm",
  name: "LiteLLM",
  vendor: "LiteLLM",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["LITELLM_API_KEY"],
  baseUrl: "http://localhost:4000/v1",
  defaultModel: "gpt-4o",
  models: ["gpt-4o", "claude-sonnet-4-20250514", "gemini-2.5-pro"],
  description: "Unified proxy for 100+ LLMs",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const anyscale: ProviderDescriptor = {
  id: "anyscale",
  name: "Anyscale",
  vendor: "Anyscale",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["ANYSCALE_API_KEY"],
  baseUrl: "https://api.endpoints.anyscale.com/v1",
  defaultModel: "meta-llama/Meta-Llama-3.3-70B-Instruct",
  models: [
    "meta-llama/Meta-Llama-3.3-70B-Instruct",
    "mistralai/Mixtral-8x7B-Instruct-v0.1",
  ],
  description: "Ray-based inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const lepton: ProviderDescriptor = {
  id: "lepton",
  name: "Lepton AI",
  vendor: "Lepton AI",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["LEPTON_API_KEY"],
  baseUrl: "https://llama3-3-70b.lepton.run/api/v1",
  defaultModel: "llama3-3-70b",
  models: ["llama3-3-70b", "deepseek-r1"],
  description: "Serverless GPU inference. Note: Each model uses its own subdomain URL.",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const octoai: ProviderDescriptor = {
  id: "octoai",
  name: "OctoAI",
  vendor: "OctoAI",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["OCTOAI_API_KEY"],
  baseUrl: "https://text.octoai.run/v1",
  defaultModel: "meta-llama-3.3-70b-instruct",
  models: [
    "meta-llama-3.3-70b-instruct",
    "qwen-2.5-coder-32b-instruct",
  ],
  description: "Optimized inference platform",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const deepinfra: ProviderDescriptor = {
  id: "deepinfra",
  name: "DeepInfra",
  vendor: "DeepInfra",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["DEEPINFRA_API_KEY"],
  baseUrl: "https://api.deepinfra.com/v1/openai",
  defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
  models: [
    "meta-llama/Llama-3.3-70B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "deepseek-ai/DeepSeek-R1",
  ],
  description: "Pay-per-token inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const friendli: ProviderDescriptor = {
  id: "friendli",
  name: "FriendliAI",
  vendor: "FriendliAI",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["FRIENDLI_API_KEY"],
  baseUrl: "https://inference.friendli.ai/v1",
  defaultModel: "meta-llama-3.3-70b-instruct",
  models: [
    "meta-llama-3.3-70b-instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
  ],
  description: "Orca-optimized inference",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const tencent: ProviderDescriptor = {
  id: "tencent",
  name: "Tencent TokenHub",
  vendor: "Tencent",
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["TENCENT_API_KEY"],
  baseUrl: "https://api.lkeap.cloud.tencent.com/v1",
  defaultModel: "hunyuan-pro",
  models: [
    "hunyuan-pro",
    "hunyuan-standard",
  ],
  description: "Tencent Hunyuan models",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const custom: ProviderDescriptor = {
  id: "custom",
  name: "Custom",
  vendor: "Custom",
  transport: "custom",
  authType: "api-key",
  envVars: ["CUSTOM_API_KEY", "CUSTOM_BASE_URL"],
  baseUrl: "http://localhost:8080/v1",
  defaultModel: "custom-model",
  models: ["custom-model"],
  description: "Any OpenAI-compatible endpoint",
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

export const PROVIDERS: Record<string, ProviderDescriptor> = {
  anthropic,
  openai,
  codex,
  openrouter,
  gemini,
  "gemini-cli": geminiCli,
  "github-copilot": githubCopilot,
  deepseek,
  groq,
  mistral,
  together,
  fireworks,
  perplexity,
  cerebras,
  sambanova,
  xai,
  "xai-oauth": xaiOauth,
  cohere,
  ai21,
  replicate,
  huggingface,
  bedrock,
  azure,
  "azure-openai": azureOpenai,
  vertex,
  cloudflare,
  github,
  "codex-cli": codexCli,
  warp,
  nous,
  "qwen-oauth": qwenOauth,
  alibaba,
  kimi,
  zhipu,
  novita,
  xiaomi,
  nvidia,
  minimax,
  "minimax-oauth": minimaxOauth,
  stepfun,
  kilocode,
  "opencode-zen": opencodeZen,
  "opencode-go": opencodeGo,
  gmi,
  arcee,
  "ollama-cloud": ollamaCloud,
  ollama: ollama,
  lmstudio,
  jan,
  vllm,
  textgen,
  litellm,
  anyscale,
  lepton,
  octoai,
  deepinfra,
  friendli,
  tencent,
  custom,
}

export function getProvider(id: string): ProviderDescriptor | undefined {
  return PROVIDERS[id]
}

export function listProviders(): ProviderDescriptor[] {
  return Object.values(PROVIDERS)
}

export function findProviderByModel(model: string): ProviderDescriptor | undefined {
  return Object.values(PROVIDERS).find((p) => p.models.includes(model))
}

export function findProviderByEnvVar(envVar?: string): ProviderDescriptor | undefined {
  if (envVar) {
    return Object.values(PROVIDERS).find((p) => p.envVars.includes(envVar))
  }
  for (const provider of Object.values(PROVIDERS)) {
    for (const envVar of provider.envVars) {
      if (process.env[envVar]) {
        return provider
      }
    }
  }
  return undefined
}
