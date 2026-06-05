import type { ToolPermission } from "../types.js"

export interface PermissionRequest {
  toolName: string
  params: Record<string, unknown>
  reason: string
  sessionId: string
}

export type PermissionHandler = (req: PermissionRequest) => Promise<boolean>

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
    const cacheKey = `${sessionId}:${toolName}`
    const cached = this.decisions.get(cacheKey)
    if (cached) return cached === "allow"

    const permission = this.defaults[toolName] || "ask"

    if (permission === "allow") return true
    if (permission === "deny") return false

    if (this.handler) {
      const allowed = await this.handler({ toolName, params, reason: `Run ${toolName}`, sessionId })
      this.decisions.set(cacheKey, allowed ? "allow" : "deny")
      return allowed
    }

    return true
  }

  allowOnce(sessionId: string, toolName: string): void {
    this.decisions.set(`${sessionId}:${toolName}`, "allow")
  }

  deny(sessionId: string, toolName: string): void {
    this.decisions.set(`${sessionId}:${toolName}`, "deny")
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
