import type { ArgentEngine } from "../engine.js"
import type { ProviderDescriptor } from "@argent/integrations"

export function costCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Cost Breakdown                     ║")
  lines.push("║       (~ approximate, per 1M tokens)     ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const desc = engine.getCurrentProviderDescriptor()
  const info = engine.getProviderInfo()

  lines.push(`  Provider: ${info.name}`)
  lines.push(`  Model:    ${info.model || "unknown"}`)

  const providerModels = desc?.models ?? []
  const pricing = getModelPricing(desc, info.model)

  lines.push("")
  lines.push("  ── Per-Token Pricing (estimated) ──")
  lines.push("")

  if (pricing) {
    lines.push(`  Model:          ${info.model}`)
    lines.push(`  Input:          $${pricing.inputPer1M.toFixed(2)} / 1M tokens`)
    lines.push(`  Output:         $${pricing.outputPer1M.toFixed(2)} / 1M tokens`)

    const totalTokensIn = engine.getTotalTokensIn()
    const totalTokensOut = engine.getTotalTokensOut()

    const estCostIn = (totalTokensIn / 1_000_000) * pricing.inputPer1M
    const estCostOut = (totalTokensOut / 1_000_000) * pricing.outputPer1M

    lines.push("")
    lines.push(`  Session input tokens:  ${totalTokensIn.toLocaleString()}`)
    lines.push(`  Session output tokens: ${totalTokensOut.toLocaleString()}`)
    lines.push(`  Estimated session cost: $${(estCostIn + estCostOut).toFixed(4)}`)
  } else {
    lines.push("  Pricing data unavailable for this provider.")
  }

  if (providerModels.length > 0) {
    lines.push("")
    lines.push("  ── Available Models ──")
    lines.push("")
    lines.push(`  ┌${"─".repeat(50)}┐`)
    for (const m of providerModels) {
      const mp = getModelPricing(desc, m)
      const priceStr = mp ? `$${mp.inputPer1M.toFixed(2)}/${mp.outputPer1M.toFixed(2)}` : "unknown"
      const display = `${m.padEnd(30)} ${priceStr.padEnd(14)}`
      lines.push(`  │ ${display} │`)
    }
    lines.push(`  └${"─".repeat(50)}┘`)
  }

  return lines.join("\n")
}

interface ModelPricing {
  inputPer1M: number
  outputPer1M: number
}

function getModelPricing(desc: ProviderDescriptor | null, model: string | null): ModelPricing | null {
  if (!model) return null

  const pricingMap: Record<string, ModelPricing> = {
    "claude-sonnet-4-20250514": { inputPer1M: 3.0, outputPer1M: 15.0 },
    "claude-3.5-sonnet": { inputPer1M: 3.0, outputPer1M: 15.0 },
    "claude-3-opus": { inputPer1M: 15.0, outputPer1M: 75.0 },
    "claude-3.5-haiku": { inputPer1M: 0.8, outputPer1M: 4.0 },
    "claude-3-haiku": { inputPer1M: 0.25, outputPer1M: 1.25 },
    "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0 },
    "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
    "gpt-4-turbo": { inputPer1M: 10.0, outputPer1M: 30.0 },
    "gpt-4": { inputPer1M: 30.0, outputPer1M: 60.0 },
    "gpt-3.5-turbo": { inputPer1M: 0.5, outputPer1M: 1.5 },
    "o1": { inputPer1M: 15.0, outputPer1M: 60.0 },
    "o1-mini": { inputPer1M: 1.1, outputPer1M: 4.4 },
    "o3-mini": { inputPer1M: 1.1, outputPer1M: 4.4 },
    "gemini-2.5-pro": { inputPer1M: 1.25, outputPer1M: 10.0 },
    "gemini-2.5-flash": { inputPer1M: 0.15, outputPer1M: 0.6 },
    "gemini-2.0-flash": { inputPer1M: 0.1, outputPer1M: 0.4 },
    "deepseek-v3": { inputPer1M: 0.27, outputPer1M: 1.1 },
    "deepseek-r1": { inputPer1M: 0.55, outputPer1M: 2.19 },
    "grok-2": { inputPer1M: 5.0, outputPer1M: 15.0 },
    "grok-3": { inputPer1M: 5.0, outputPer1M: 15.0 },
  }

  let bestMatch: ModelPricing | null = null
  let bestMatchLen = 0
  for (const [key, price] of Object.entries(pricingMap)) {
    if (model.toLowerCase().includes(key.toLowerCase())) {
      if (key.length > bestMatchLen) {
        bestMatch = price
        bestMatchLen = key.length
      }
    }
  }
  if (bestMatch) return bestMatch

  if (desc?.vendor === "anthropic") return { inputPer1M: 3.0, outputPer1M: 15.0 }
  if (desc?.vendor === "openai") return { inputPer1M: 2.5, outputPer1M: 10.0 }
  if (desc?.id === "ollama") return { inputPer1M: 0, outputPer1M: 0 }

  return null
}
