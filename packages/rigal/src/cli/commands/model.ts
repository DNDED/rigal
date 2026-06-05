import type { ProviderDescriptor } from "@rigal/integrations"

export function modelCommand(
  args: string[],
  currentProvider: ProviderDescriptor | null,
  currentModel: string | null
): string {
  if (!currentProvider) {
    return "No provider configured. Use /provider to select one first."
  }

  if (args.length === 0) {
    return renderModelList(currentProvider, currentModel)
  }

  const input = args.join(" ")
  const num = parseInt(input, 10)

  if (!isNaN(num) && num >= 1 && num <= currentProvider.models.length) {
    const selected = currentProvider.models[num - 1]
    if (!selected) return `Invalid selection: ${num}`
    return `MODEL_SELECT:${selected}`
  }

  const match = currentProvider.models.find(
    (m) => m === input || m.toLowerCase().includes(input.toLowerCase())
  )
  if (match) {
    return `MODEL_SELECT:${match}`
  }

  return `MODEL_SELECT:${input}`
}

function renderModelList(provider: ProviderDescriptor, currentModel: string | null): string {
  const lines: string[] = []

  lines.push(`Provider: ${provider.name}`)
  lines.push(`Current model: ${currentModel || provider.defaultModel}`)
  lines.push("")
  lines.push(`┌─────────────────────────────────────────┐`)
  lines.push(`│  Available Models                       │`)
  lines.push(`├─────────────────────────────────────────┤`)

  for (let i = 0; i < provider.models.length; i++) {
    const m = provider.models[i]
    if (!m) continue
    const isCurrent = m === currentModel
    const marker = isCurrent ? "●" : "○"
    const num = String(i + 1).padStart(2, " ")
    const name = m.length > 34 ? m.slice(0, 32) + ".." : m.padEnd(34, " ")
    lines.push(`│  ${marker} [${num}] ${name}   │`)
  }

  lines.push(`└─────────────────────────────────────────┘`)
  lines.push("")
  lines.push("Use /model <number> or /model <name> to switch")

  return lines.join("\n")
}
