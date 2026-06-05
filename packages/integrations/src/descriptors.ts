export interface ProviderDescriptor {
  id: string
  name: string
  vendor: string
  transport: "anthropic-native" | "openai-compatible" | "codex-responses" | "gemini-native"
  authType: "api-key" | "oauth" | "bearer" | "aws-sdk" | "none"
  envVars: string[]
  baseUrl: string
  defaultModel: string
  models: string[]
  headers?: Record<string, string>
  oauthConfig?: {
    clientId: string
    tokenUrl: string
    authUrl?: string
    scopes?: string[]
    grantType: "device_code" | "authorization_code" | "user_code"
  }
  features?: {
    streaming?: boolean
    toolCalling?: boolean
    vision?: boolean
    thinking?: boolean
  }
}

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
    "claude-3-opus-20240229",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
  ],
  headers: {
    "anthropic-version": "2023-06-01",
  },
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
    "gpt-5",
    "gpt-5.5",
  ],
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
  defaultModel: "gpt-5.5",
  models: [
    "gpt-5.5",
    "gpt-5.5-codex",
    "gpt-5",
    "codex",
    "o4-mini",
  ],
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
  headers: {
    "HTTP-Referer": "https://rigal.dev",
    "X-Title": "RIGAL",
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
    "deepseek-v4-pro",
    "deepseek-v4-flash",
  ],
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
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
  oauthConfig: {
    clientId: "xai-rigal-client",
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
  oauthConfig: {
    clientId: "qwen-rigal-client",
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
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const alibabaCoding: ProviderDescriptor = {
  id: "alibaba-coding",
  name: "Alibaba Coding Plan",
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
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const kimiCn: ProviderDescriptor = {
  id: "kimi-cn",
  name: "Kimi CN",
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
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
  },
}

const minimaxCn: ProviderDescriptor = {
  id: "minimax-cn",
  name: "MiniMax CN",
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
  oauthConfig: {
    clientId: "minimax-rigal-client",
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
  ],
  features: {
    streaming: true,
    toolCalling: false,
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
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
    thinking: true,
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
  headers: {
    "api-key": "{AZURE_API_KEY}",
  },
  features: {
    streaming: true,
    toolCalling: true,
    vision: true,
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
  features: {
    streaming: true,
    toolCalling: true,
    vision: false,
  },
}

const ollamaLocal: ProviderDescriptor = {
  id: "ollama-local",
  name: "Ollama Local",
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
    "deepseek-r1:8b",
    "llama3.1:8b",
  ],
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
  models: [
    "local-model",
  ],
  features: {
    streaming: true,
    toolCalling: false,
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
  transport: "openai-compatible",
  authType: "api-key",
  envVars: ["CUSTOM_API_KEY", "CUSTOM_BASE_URL"],
  baseUrl: "http://localhost:8080/v1",
  defaultModel: "custom-model",
  models: [
    "custom-model",
  ],
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
  xai,
  "xai-oauth": xaiOauth,
  nous,
  "qwen-oauth": qwenOauth,
  alibaba,
  "alibaba-coding": alibabaCoding,
  kimi,
  "kimi-cn": kimiCn,
  zhipu,
  novita,
  xiaomi,
  nvidia,
  minimax,
  "minimax-cn": minimaxCn,
  "minimax-oauth": minimaxOauth,
  stepfun,
  huggingface,
  kilocode,
  "opencode-zen": opencodeZen,
  "opencode-go": opencodeGo,
  bedrock,
  azure,
  gmi,
  arcee,
  "ollama-cloud": ollamaCloud,
  "ollama-local": ollamaLocal,
  lmstudio,
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

export function findProviderByEnvVar(envVar: string): ProviderDescriptor | undefined {
  return Object.values(PROVIDERS).find((p) => p.envVars.includes(envVar))
}
