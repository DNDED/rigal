import React, { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { Box, Text, useInput } from "ink"
import TextInput from "ink-text-input"
import { listProviders } from "@argent/integrations"
import type { ProviderDescriptor } from "@argent/integrations"
import { theme, multiGradient } from "../../ui/theme.js"

const API_KEY_URLS: Record<string, string> = {
  anthropic: "https://console.anthropic.com/settings/keys",
  openai: "https://platform.openai.com/api-keys",
  openrouter: "https://openrouter.ai/keys",
  gemini: "https://aistudio.google.com/app/apikey",
  deepseek: "https://platform.deepseek.com/api_keys",
  groq: "https://console.groq.com/keys",
  mistral: "https://console.mistral.ai/api-keys/",
  together: "https://api.together.xyz/settings/api-keys",
  fireworks: "https://fireworks.ai/account/api-keys",
  perplexity: "https://www.perplexity.ai/settings/api",
  cerebras: "https://cloud.cerebras.ai/",
  sambanova: "https://cloud.sambanova.ai/",
  xai: "https://console.x.ai/",
  cohere: "https://dashboard.cohere.com/api-keys",
  ai21: "https://studio.ai21.com/account/api-key",
  replicate: "https://replicate.com/account/api-tokens",
  huggingface: "https://huggingface.co/settings/tokens",
  cloudflare: "https://dash.cloudflare.com/profile/api-tokens",
  github: "https://github.com/settings/tokens",
  warp: "https://app.warp.dev/",
  nous: "https://api.nousresearch.com/",
  alibaba: "https://dashscope.console.aliyun.com/",
  kimi: "https://platform.moonshot.cn/",
  zhipu: "https://open.bigmodel.cn/",
  novita: "https://novita.ai/",
  xiaomi: "https://platform.xiaomi.com/",
  nvidia: "https://build.nvidia.com/",
  minimax: "https://api.minimax.chat/",
  stepfun: "https://platform.stepfun.com/",
  kilocode: "https://kilocode.ai/",
  gmi: "https://console.gmicloud.ai/",
  arcee: "https://arcee.ai/",
  ollama: "https://ollama.com/",
  custom: "https://github.com/DNDED/argent",
}

function isFreeGroup(p: ProviderDescriptor) {
  return p.authType === "none" || p.authType === "oauth"
}

function sortProviderPriority(a: ProviderDescriptor, b: ProviderDescriptor): number {
  const order: Record<string, number> = { none: 0, oauth: 1, "api-key": 2, bearer: 3 }
  return (order[a.authType] ?? 4) - (order[b.authType] ?? 4)
}

interface SetupWizardProps {
  onComplete: (providerId: string, apiKey?: string) => void
  onSkip: () => void
}

type SetupStep = "select" | "apikey"

const PAGE_SIZE = 10

export function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const allProviders = listProviders()
  const sortedAllProviders = useMemo(() => [...allProviders].sort(sortProviderPriority), [allProviders])
  const [step, setStep] = useState<SetupStep>("select")
  const [input, setInput] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<ProviderDescriptor | null>(null)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [localOllamaDetected, setLocalOllamaDetected] = useState(false)
  const hasInteracted = useRef(false)

  const filterText = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) return ""
    const num = parseInt(trimmed, 10)
    if (!isNaN(num) && String(num) === trimmed) return ""
    return trimmed
  }, [input])

  const filtered = useMemo(() => {
    if (!filterText) return sortedAllProviders
    const q = filterText.toLowerCase()
    return sortedAllProviders.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    )
  }, [sortedAllProviders, filterText])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageSlice = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const highlightedIndex = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) return -1
    const num = parseInt(trimmed, 10)
    if (!isNaN(num) && String(num) === trimmed && num >= 1 && num <= filtered.length) {
      return num - 1
    }
    return -1
  }, [input, filtered])

  const handleSelectSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim().toLowerCase()

      if (trimmed === "q" || trimmed === "quit") {
        onSkip()
        return
      }

      let match: ProviderDescriptor | undefined

      if (filterText) {
        match = filtered[0]
        if (!match) {
          setError(`No providers match "${filterText}"`)
          setInput("")
          return
        }
      } else {
        const num = parseInt(trimmed, 10)
        if (!isNaN(num) && num >= 1 && num <= filtered.length) {
          match = filtered[num - 1]
        } else {
          match = sortedAllProviders.find(
            (p) => p.id === trimmed || p.name.toLowerCase() === trimmed
          )
        }
      }

      if (!match) {
        setError(`Invalid selection. Enter a number 1-${filtered.length} or provider name.`)
        setInput("")
        return
      }

      setSelectedProvider(match)
      setInput("")
      setError("")
      setPage(0)

      if (match.authType === "none" || match.authType === "oauth") {
        onComplete(match.id)
        return
      }

      const firstEnvVar = match.envVars[0]
      const envKey = firstEnvVar ? process.env[firstEnvVar] : undefined
      if (envKey) {
        onComplete(match.id, envKey)
        return
      }

      setStep("apikey")
    },
    [filtered, allProviders, filterText, onComplete, onSkip]
  )

  const handleApiKeySubmit = useCallback(
    (value: string) => {
      if (!selectedProvider) return
      if (value.trim()) {
        onComplete(selectedProvider.id, value.trim())
      } else {
        setError("API key cannot be empty. Enter a key or press Escape to skip.")
      }
    },
    [selectedProvider, onComplete]
  )

  useInput((input, key) => {
    hasInteracted.current = true

    if (key.escape) {
      if (step === "apikey") {
        onSkip()
        return
      }
      onSkip()
    }

    if (step === "select") {
      if (key.leftArrow || key.rightArrow) {
        if (key.leftArrow) {
          setPage((p) => Math.max(0, p - 1))
        } else {
          setPage((p) => Math.min(totalPages - 1, p + 1))
        }
        setError("")
        return
      }
      if (input === "<") {
        setPage((p) => Math.max(0, p - 1))
        setError("")
        return
      }
      if (input === ">") {
        setPage((p) => Math.min(totalPages - 1, p + 1))
        setError("")
        return
      }
    }
  })

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    fetch("http://localhost:11434/api/tags", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("not ok")
        return res.json()
      })
      .then(() => {
        setLocalOllamaDetected(true)
      })
      .catch((err) => {
        console.error("[argent] Ollama auto-detect failed:", err.message || err)
      })
      .finally(() => clearTimeout(timeoutId))

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (!localOllamaDetected) return

    const timer = setTimeout(() => {
      if (!hasInteracted.current) {
        onComplete("ollama")
      }
    }, 4000)

    return () => clearTimeout(timer)
  }, [localOllamaDetected, onComplete])

  const maxName = Math.max(8, ...filtered.map((p) => p.name.length))
  const maxAuth = Math.max(4, ...filtered.map((p) => formatAuthLabel(p).length))
  const maxModel = Math.max(13, ...filtered.map((p) => (p.defaultModel || "").length))

  const headerName = "Provider".padEnd(maxName)
  const headerAuth = "Auth".padEnd(maxAuth)
  const headerModel = "Default Model".padEnd(maxModel)

  const headerRow = `│  #   ${headerName}  ${headerAuth}  ${headerModel}  │`
  const tableW = headerRow.length
  const topBorder = `┌${"─".repeat(tableW - 2)}┐`
  const midBorder = `├${"─".repeat(tableW - 2)}┤`
  const botBorder = `└${"─".repeat(tableW - 2)}┘`

  const makeRow = (
    i: number,
    p: ProviderDescriptor,
    highlight: boolean
  ) => {
    const num = String(i + 1).padStart(2)
    const prefix = highlight ? `${theme.chars.arrow} ` : "  "
    return `│${prefix}${num}   ${p.name.padEnd(maxName)}  ${formatAuthLabel(p).padEnd(maxAuth)}  ${(p.defaultModel || "").padEnd(maxModel)}  │`
  }

  const aurora = multiGradient(
    [theme.colors.accentDim, theme.colors.accent, theme.colors.accentAlt],
    6
  )

  const bannerW = Math.min(tableW - 4, 58)

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text>
          <Text color={aurora[0]}>{theme.chars.round[0]}</Text>
          <Text color={aurora[1]}>{theme.chars.thin.repeat(bannerW)}</Text>
          <Text color={aurora[5]}>{theme.chars.round[1]}</Text>
        </Text>
        <Box>
          <Text color={aurora[1]}>{theme.chars.vertical}</Text>
          <Text>{"  "}</Text>
          <Text bold color={theme.colors.textWhite}>
            Welcome to ARGENT
          </Text>
          <Text>{" ".repeat(Math.max(0, bannerW - 18))}</Text>
          <Text color={aurora[4]}>{theme.chars.vertical}</Text>
        </Box>
        <Text>
          <Text color={aurora[5]}>{theme.chars.round[2]}</Text>
          <Text color={aurora[4]}>{theme.chars.thin.repeat(bannerW)}</Text>
          <Text color={aurora[0]}>{theme.chars.round[3]}</Text>
        </Text>
      </Box>

      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text color={theme.colors.textDim}>
          Choose a provider to get started. No API key required for local models.
        </Text>
      </Box>

      {localOllamaDetected && (
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          <Text color={theme.colors.success}>
            {"\u2B22"} Ollama detected locally! Select option 1 for instant setup.
          </Text>
        </Box>
      )}

      {step === "select" && (
        <Box flexDirection="column">
          <Box marginBottom={1} paddingLeft={1}>
            <Text color={theme.colors.textDim}>
              {theme.chars.arrow} Choose a provider:
            </Text>
          </Box>

          <Box flexDirection="column" paddingLeft={1}>
            <Text color={theme.colors.border}>{topBorder}</Text>
            <Text color={theme.colors.border}>{headerRow}</Text>
            <Text color={theme.colors.border}>{midBorder}</Text>
            {filtered.length === 0 ? (
              <Text color={theme.colors.error}>
                {"  "}No providers available. Check your installation.
              </Text>
            ) : (
              pageSlice.map((p, idx) => {
                const globalIdx = safePage * PAGE_SIZE + idx
                const isHighlighted = globalIdx === highlightedIndex
                const isFirst = globalIdx === 0
                const prev = globalIdx > 0 ? filtered[globalIdx - 1] : undefined
                const showFreeHeader = isFirst && isFreeGroup(p)
                const showPaidHeader = prev !== undefined && isFreeGroup(prev) && !isFreeGroup(p)
                return (
                  <React.Fragment key={p.id}>
                    {showFreeHeader && (
                      <Text color={theme.colors.accentDim}>
                        {"  "}{"─── Free / No API Key ───"}
                      </Text>
                    )}
                    {showPaidHeader && (
                      <Text color={theme.colors.accentDim}>
                        {"  "}{"─── Requires API Key ───"}
                      </Text>
                    )}
                    <Text color={isHighlighted ? theme.colors.textBright : theme.colors.border}>
                      {makeRow(globalIdx, p, isHighlighted)}
                    </Text>
                  </React.Fragment>
                )
              })
            )}
            <Text color={theme.colors.border}>{botBorder}</Text>
          </Box>

          {filtered.length > PAGE_SIZE && (
            <Box marginTop={1} paddingLeft={2}>
              <Text color={theme.colors.textMuted}>
                Page {safePage + 1}/{totalPages} — Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}. Type a number to select any.
              </Text>
            </Box>
          )}

          {filterText && (
            <Box marginTop={1} paddingLeft={2}>
              <Text color={theme.colors.accentDim}>
                {theme.chars.search} Search:{" "}
                <Text color={theme.colors.textDim}>{filterText}</Text>
              </Text>
            </Box>
          )}

          <Box marginTop={1} flexDirection="column" paddingLeft={1}>
            {error ? (
              <Box marginBottom={1}>
                <Text color={theme.colors.error}>
                  {"  "}
                  {theme.icons.error} {error}
                </Text>
              </Box>
            ) : null}
            <Box>
              <Text color={theme.colors.accentBright}>  {theme.chars.arrow} </Text>
              <TextInput
                value={input}
                onChange={setInput}
                onSubmit={handleSelectSubmit}
                placeholder={`Enter number or name`}
              />
            </Box>
          </Box>

          <Box marginTop={1} paddingLeft={1}>
            <Text color={theme.colors.textMuted}>
              [Esc] skip setup    [q] quit
            </Text>
          </Box>
        </Box>
      )}

      {step === "apikey" && selectedProvider && (
        <Box flexDirection="column" paddingLeft={1}>
          <Box marginBottom={1}>
            <Text color={theme.colors.textDim}>
              {theme.chars.arrow} Provider:{" "}
              <Text bold color={theme.colors.accent}>
                {selectedProvider.name}
              </Text>
            </Text>
          </Box>

          {API_KEY_URLS[selectedProvider.id] && (
            <Box marginBottom={1} paddingLeft={2}>
              <Text color={theme.colors.success}>
                {theme.chars.bullet} Get your key:{" "}
                <Text color={theme.colors.textBright}>{API_KEY_URLS[selectedProvider.id]}</Text>
              </Text>
            </Box>
          )}

          <Box marginBottom={1} paddingLeft={2}>
            <Text color={theme.colors.textMuted}>
              {theme.chars.bullet} Or set{" "}
              <Text color={theme.colors.code}>{selectedProvider.envVars[0]}</Text>{" "}
              environment variable
            </Text>
          </Box>

          {error ? (
            <Box marginBottom={1}>
              <Text color={theme.colors.error}>
                {"  "}
                {theme.icons.error} {error}
              </Text>
            </Box>
          ) : null}

          <Box marginBottom={1} paddingLeft={1}>
            <Box flexDirection="column">
              <Text color={theme.colors.textMuted}>{"  "}{theme.chars.vertical} ••••••••••••••••••••••••••</Text>
              <Text color={theme.colors.textMuted}>{"  "}{theme.chars.vertical}</Text>
            </Box>
          </Box>

          <Box paddingLeft={1}>
            <Text color={theme.colors.accentBright}>  API Key {theme.chars.arrow} </Text>
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={handleApiKeySubmit}
              mask="*"
              placeholder="Paste your API key"
            />
          </Box>

          <Box marginTop={1} paddingLeft={1}>
            <Text color={theme.colors.textMuted}>
              [Esc] skip setup    [q] quit
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}

function formatAuthLabel(provider: ProviderDescriptor): string {
  switch (provider.authType) {
    case "api-key":
      return "API key"
    case "oauth":
      return "OAuth"
    case "bearer":
      return "bearer token"
    case "none":
      return "no auth"
    default:
      return provider.authType
  }
}
