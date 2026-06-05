import React, { useState, useCallback } from "react"
import { Box, Text, useInput } from "ink"
import TextInput from "ink-text-input"
import { listProviders, getProvider } from "@rigal/integrations"
import type { ProviderDescriptor } from "@rigal/integrations"
import { theme, gradient } from "../../ui/theme.js"

interface SetupWizardProps {
  onComplete: (providerId: string, apiKey?: string) => void
  onSkip: () => void
}

type SetupStep = "select" | "apikey" | "done"

export function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const providers = listProviders()
  const [step, setStep] = useState<SetupStep>("select")
  const [input, setInput] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<ProviderDescriptor | null>(null)
  const [error, setError] = useState("")

  const handleSelectSubmit = useCallback(
    (value: string) => {
      if (value.toLowerCase() === "q" || value.toLowerCase() === "quit") {
        onSkip()
        return
      }

      const num = parseInt(value.trim(), 10)
      if (!isNaN(num) && num >= 1 && num <= providers.length) {
        const selected = providers[num - 1]
        if (!selected) {
          setError("Invalid selection")
          return
        }
        setSelectedProvider(selected)
        setInput("")

        if (selected.authType === "none") {
          onComplete(selected.id)
          return
        }

        if (selected.authType === "oauth") {
          onComplete(selected.id)
          return
        }

        const envKey = selected.envVar ? process.env[selected.envVar] : undefined
        if (envKey) {
          onComplete(selected.id, envKey)
          return
        }

        setStep("apikey")
        return
      }

      const match = providers.find(
        (p) => p.id === value.trim() || p.name.toLowerCase() === value.trim().toLowerCase()
      )
      if (match) {
        setSelectedProvider(match)
        setInput("")

        if (match.authType === "none" || match.authType === "oauth") {
          onComplete(match.id)
          return
        }

        setStep("apikey")
        return
      }

      setError(`Invalid selection: "${value}". Enter a number 1-${providers.length} or 'q' to skip.`)
      setInput("")
    },
    [providers, onComplete, onSkip]
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

  useInput((_input, key) => {
    if (key.escape) {
      if (step === "apikey") {
        if (selectedProvider) {
          onComplete(selectedProvider.id)
        }
        return
      }
      onSkip()
    }
  })

  const auroraColors = gradient(theme.colors.accent, theme.colors.accentAlt, 6)

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text>
          <Text bold color={auroraColors[0]}>╔══════════════════════════════════════════════╗</Text>
        </Text>
        <Text>
          <Text color={auroraColors[0]}>║</Text>
          <Text color={theme.colors.surface}>                                              </Text>
          <Text color={auroraColors[5]}>║</Text>
        </Text>
        <Text>
          <Text color={auroraColors[1]}>║</Text>
          <Text>  </Text>
          <Text color={theme.colors.accent}>⬡</Text>
          <Text bold color={theme.colors.textBright}>  R  I  G  A  L</Text>
          <Text>                               </Text>
          <Text color={auroraColors[4]}>║</Text>
        </Text>
        <Text>
          <Text color={auroraColors[2]}>║</Text>
          <Text>  </Text>
          <Text color={theme.colors.textDim}>Welcome! Let's set up your provider</Text>
          <Text>          </Text>
          <Text color={auroraColors[3]}>║</Text>
        </Text>
        <Text>
          <Text color={auroraColors[3]}>║</Text>
          <Text color={theme.colors.surface}>                                              </Text>
          <Text color={auroraColors[2]}>║</Text>
        </Text>
        <Text>
          <Text bold color={auroraColors[5]}>╚══════════════════════════════════════════════╝</Text>
        </Text>
      </Box>

      {step === "select" && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={theme.colors.textDim}>Choose a provider:</Text>
          </Box>

          <Box flexDirection="column">
            {providers.map((p, i) => (
              <Box key={p.id} paddingLeft={2}>
                <Text color={theme.colors.text}>
                  <Text color={theme.colors.accent}>[</Text>
                  <Text color={theme.colors.textBright}>{String(i + 1).padStart(2, " ")}</Text>
                  <Text color={theme.colors.accent}>]</Text>
                  <Text>  </Text>
                  <Text color={theme.colors.text}>{p.name.padEnd(20, " ")}</Text>
                  <Text color={theme.colors.textDim}> ({formatAuthLabel(p)})</Text>
                </Text>
              </Box>
            ))}
          </Box>

          <Box marginTop={1} flexDirection="column">
            {error ? (
              <Box marginBottom={1}>
                <Text color={theme.colors.error}>  {error}</Text>
              </Box>
            ) : null}
            <Box>
              <Text color={theme.colors.accent}>  ▸ </Text>
              <TextInput
                value={input}
                onChange={setInput}
                onSubmit={handleSelectSubmit}
                placeholder="Enter number (or 'q' to skip)"
              />
            </Box>
          </Box>
        </Box>
      )}

      {step === "apikey" && selectedProvider && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={theme.colors.text}>
              Provider: <Text color={theme.colors.accent}>{selectedProvider.name}</Text>
            </Text>
          </Box>

          {selectedProvider.envVar && (
            <Box marginBottom={1}>
              <Text color={theme.colors.textDim}>
                Or set <Text color={theme.colors.code}>{selectedProvider.envVar}</Text> environment variable
              </Text>
            </Box>
          )}

          {error ? (
            <Box marginBottom={1}>
              <Text color={theme.colors.error}>  {error}</Text>
            </Box>
          ) : null}

          <Box>
            <Text color={theme.colors.accent}>  API Key ▸ </Text>
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={handleApiKeySubmit}
              mask="*"
              placeholder="Paste your API key"
            />
          </Box>

          <Box marginTop={1}>
            <Text color={theme.colors.comment}>  Press Escape to skip (you can set it later with /provider)</Text>
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
      return "free — browser login"
    case "bearer":
      return "bearer token"
    case "none":
      return "no auth needed"
    default:
      return provider.authType
  }
}
