import type { ArgentEngine } from "../engine.js"

export function statsCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Usage Statistics                   ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const sessions = engine.sessions.list()
  const allMessages = sessions.flatMap((s) => s.messages)

  const userMsgs = allMessages.filter((m) => m.role === "user").length
  const assistantMsgs = allMessages.filter((m) => m.role === "assistant").length
  const toolMsgs = allMessages.filter((m) => m.role === "tool").length
  const toolCalls = allMessages
    .filter((m) => m.role === "assistant")
    .reduce((sum, m) => sum + ("toolCalls" in m ? (m.toolCalls?.length ?? 0) : 0), 0)

  const activeSession = engine.sessionId ? engine.sessions.get(engine.sessionId) : null

  lines.push("  ── Sessions ──")
  lines.push(`  Total sessions:         ${sessions.length}`)
  lines.push(`  Active session:         ${activeSession ? "Yes" : "No"}`)

  if (activeSession) {
    lines.push(`  Current agent:          ${activeSession.agentName}`)
    lines.push(`  Current messages:       ${activeSession.messages.length}`)
    lines.push(`  Session age:            ${msToHuman(Date.now() - activeSession.createdAt.getTime())}`)
  }

  lines.push("")
  lines.push("  ── Messages ──")
  lines.push(`  User messages:          ${userMsgs}`)
  lines.push(`  Assistant responses:    ${assistantMsgs}`)
  lines.push(`  Tool results:           ${toolMsgs}`)
  lines.push(`  Tool calls made:        ${toolCalls}`)

  lines.push("")
  lines.push("  ── Agents Used ──")
  const agentCounts: Record<string, number> = {}
  for (const s of sessions) {
    agentCounts[s.agentName] = (agentCounts[s.agentName] || 0) + 1
  }
  for (const [agent, count] of Object.entries(agentCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${agent.padEnd(16)} ${count} session${count > 1 ? "s" : ""}`)
  }

  lines.push("")
  lines.push("  ── Tool Usage ──")
  type ToolUsage = { tool: string; count: number }
  const toolUsage: ToolUsage[] = []

  for (const s of sessions) {
    for (let mi = 0; mi < s.messages.length; mi++) {
      const tcm = s.messages[mi]
      if (!tcm || tcm.role !== "tool") continue

      let prevMsgIdx = mi - 1
      while (prevMsgIdx >= 0) {
        const pm = s.messages[prevMsgIdx]
        if (pm && pm.role === "assistant" && "toolCalls" in pm && pm.toolCalls?.some((tc) => tc.id === tcm.toolCallId)) {
          break
        }
        prevMsgIdx--
      }

      const prevMsg = prevMsgIdx >= 0 ? s.messages[prevMsgIdx] : undefined
      if (prevMsg && "toolCalls" in prevMsg && prevMsg.toolCalls) {
        const tc = prevMsg.toolCalls.find((tc) => tc.id === tcm.toolCallId)
        if (tc) {
          const existing = toolUsage.find((tu) => tu.tool === tc.name)
          if (existing) {
            existing.count++
          } else {
            toolUsage.push({ tool: tc.name, count: 1 })
          }
        }
      }
    }
  }

  toolUsage.sort((a, b) => b.count - a.count)
  if (toolUsage.length > 0) {
    lines.push(`  ┌${"─".repeat(40)}┐`)
    for (const tu of toolUsage.slice(0, 10)) {
      const tool = tu.tool.padEnd(22, " ")
      const count = String(tu.count).padStart(6, " ")
      lines.push(`  │ ${tool} ${count} calls │`)
    }
    lines.push(`  └${"─".repeat(40)}┘`)
  } else {
    lines.push("  No tool calls recorded yet.")
  }

  lines.push("")
  lines.push("  ── Working Directory ──")
  lines.push(`  ${engine.config.getWorkingDir()}`)

  return lines.join("\n")
}

function msToHuman(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
