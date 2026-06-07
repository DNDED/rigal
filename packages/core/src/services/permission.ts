import type { ToolPermission } from "../types.js"

export interface PermissionRequest {
  toolName: string
  params: Record<string, unknown>
  reason: string
  sessionId: string
}

export type PermissionHandler = (req: PermissionRequest) => Promise<boolean>

function paramsHash(params: Record<string, unknown>): string {
  const relevant: string[] = []
  for (const key of Object.keys(params).sort()) {
    const val = params[key]
    if (typeof val === "string") relevant.push(`${key}=${val}`)
    else if (typeof val === "number" || typeof val === "boolean") relevant.push(`${key}=${val}`)
    else if (val === null || val === undefined) continue
    else relevant.push(`${key}=${JSON.stringify(val)}`)
  }
  return relevant.length > 0 ? `:${relevant.join("|")}` : ""
}

export class PermissionService {
  private defaults: Record<string, ToolPermission> = {}
  private handler: PermissionHandler | null = null
  private decisions: Map<string, "allow" | "deny"> = new Map()

  constructor(defaults: Record<string, ToolPermission> = {}) {
    this.defaults = defaults
  }

  setHandler(handler: PermissionHandler): void {
    this.handler = handler
  }

  async check(toolName: string, params: Record<string, unknown>, sessionId: string): Promise<boolean> {
    const paramKey = paramsHash(params)
    const cacheKey = `${sessionId}:${toolName}${paramKey}`
    const cached = this.decisions.get(cacheKey)
    if (cached) return cached === "allow"

    const permission = this.defaults[toolName] || "ask"

    if (permission === "allow") return true
    if (permission === "deny") return false

    if (this.decisions.size > 1000) {
      const keys = [...this.decisions.keys()].slice(0, 200)
      for (const k of keys) this.decisions.delete(k)
    }

    if (this.handler) {
      return this.handler({ toolName, params, reason: `Run ${toolName}`, sessionId })
    }

    return false
  }

  allow(sessionId: string, toolName: string, params?: Record<string, unknown>): void {
    const paramKey = paramsHash(params || {})
    this.decisions.set(`${sessionId}:${toolName}${paramKey}`, "allow")
  }

  allowOnce(sessionId: string, toolName: string): void {
    this.allow(sessionId, toolName)
  }

  deny(sessionId: string, toolName: string, params?: Record<string, unknown>): void {
    const paramKey = paramsHash(params || {})
    this.decisions.set(`${sessionId}:${toolName}${paramKey}`, "deny")
  }

  clearDecision(sessionId: string, toolName: string): void {
    for (const key of this.decisions.keys()) {
      if (key.startsWith(`${sessionId}:${toolName}`)) this.decisions.delete(key)
    }
  }

  reset(sessionId?: string): void {
    if (sessionId) {
      for (const key of this.decisions.keys()) {
        if (key.startsWith(sessionId)) this.decisions.delete(key)
      }
    } else {
      this.decisions.clear()
    }
  }
}
