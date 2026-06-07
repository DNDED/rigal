import type { ProviderDescriptor } from "@argent/integrations"

export function providerCommand(
  args: string[],
  providers: ProviderDescriptor[],
  currentProvider: string | null
): string {
  if (args.length === 0 || args[0] === "list") {
    return renderProviderList(providers, currentProvider)
  }

  const input = args[0] ?? ""
  const num = parseInt(input, 10)

  if (!isNaN(num) && num >= 1 && num <= providers.length) {
    const selected = providers[num - 1]
    if (!selected) return `Invalid selection: ${num}`
    return `SELECT:${selected.id}`
  }

  const match = providers.find(
    (p) => p.id === input || p.name.toLowerCase() === input.toLowerCase()
  )
  if (match) {
    return `SELECT:${match.id}`
  }

  return `Provider "${input}" not found. Use /provider to see the list.`
}

function renderProviderList(providers: ProviderDescriptor[], currentProvider: string | null): string {
  const lines: string[] = []
  const width = 52

  lines.push(`┌${"─".repeat(width)}┐`)
  lines.push(`│  Providers${" ".repeat(width - 11)}│`)
  lines.push(`├${"─".repeat(width)}┤`)

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i]
    if (!p) continue
    const isCurrent = p.id === currentProvider
    const marker = isCurrent ? "●" : "○"
    const num = String(i + 1).padStart(2, " ")
    const name = p.name.padEnd(20, " ")
    const defaultModel = p.defaultModel || "unknown"
    const model = defaultModel.length > 20 ? defaultModel.slice(0, 18) + ".." : defaultModel.padEnd(20, " ")
    const line = `│  ${marker} [${num}] ${name} ${model}│`
    lines.push(line)
  }

  lines.push(`└${"─".repeat(width)}┘`)
  lines.push("")
  lines.push("Use /provider <number> or /provider <name> to select")

  return lines.join("\n")
}
