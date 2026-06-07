import type { Session, Message, ModelRef } from "../types.js"
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, renameSync } from "node:fs"
import { join } from "node:path"
import { homedir, tmpdir } from "node:os"

let SESSIONS_DIR: string
try {
  SESSIONS_DIR = join(homedir(), ".argent", "sessions")
} catch {
  SESSIONS_DIR = "/tmp/argent-sessions"
}

function ensureSessionsDir() {
  if (!existsSync(SESSIONS_DIR)) {
    try {
      mkdirSync(SESSIONS_DIR, { recursive: true })
    } catch (err) {
      console.error("[argent] Failed to create sessions directory, falling back to tmpdir:", err instanceof Error ? err.message : String(err))
      try {
  SESSIONS_DIR = join(tmpdir(), "argent-sessions")
        mkdirSync(SESSIONS_DIR, { recursive: true })
      } catch (err2) {
        console.error("[argent] Failed to create sessions directory:", err2 instanceof Error ? err2.message : String(err2))
      }
    }
  }
}

interface SerializedSession {
  id: string
  agentName: string
  model: ModelRef
  messages: Message[]
  workingDirectory: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, string>
}

function serializeSession(s: Session): SerializedSession {
  return {
    id: s.id,
    agentName: s.agentName,
    model: s.model,
    messages: s.messages,
    workingDirectory: s.workingDirectory,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    metadata: s.metadata,
  }
}

function deserializeSession(d: SerializedSession): Session {
  return {
    id: d.id,
    agentName: d.agentName,
    model: d.model,
    messages: d.messages,
    workingDirectory: d.workingDirectory,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
    metadata: d.metadata,
  }
}

let sessionCounter = 0

export class SessionService {
  private sessions: Map<string, Session> = new Map()
  private dirtyIds: Set<string> = new Set()
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    this.loadExistingSessions()
  }

  private loadExistingSessions(): void {
    ensureSessionsDir()

    let entries: string[]
    try {
      entries = readdirSync(SESSIONS_DIR)
    } catch {
      return
    }

    const loaded: Session[] = []

    for (const entry of entries) {
      if (!entry.endsWith(".json")) continue
      const id = entry.slice(0, -5)
      if (id === "index") continue

      try {
        const raw = readFileSync(join(SESSIONS_DIR, entry), "utf-8")
        const data = JSON.parse(raw)
        if (!data || typeof data !== "object") {
          console.error("[argent] Skipping invalid session file " + entry + ": not a valid JSON object")
          continue
        }
        if (!data.id || typeof data.id !== "string" || !Array.isArray(data.messages) || !data.createdAt || !data.updatedAt || isNaN(new Date(data.createdAt).getTime()) || isNaN(new Date(data.updatedAt).getTime())) {
          console.error("[argent] Skipping session " + entry + ": missing required fields")
          continue
        }
        const session = deserializeSession(data as SerializedSession)
        loaded.push(session)
      } catch (err) {
        console.error("[argent] Failed to load session " + entry + ":", err instanceof Error ? err.message : String(err))
      }
    }

    loaded.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    let maxCounter = 0
    for (const s of loaded) {
      this.sessions.set(s.id, s)
      const parts = s.id.split("-")
      const n = parseInt(parts[parts.length - 1] || "0", 10)
      if (!isNaN(n) && n > maxCounter) maxCounter = n
    }
    sessionCounter = maxCounter
  }

  private scheduleSave(sessionId: string): void {
    this.dirtyIds.add(sessionId)
    if (this.flushTimer) return
    this.flushTimer = setTimeout(() => {
      this.flushSaves()
    }, 1000)
  }

  private flushSaves(): void {
    this.flushTimer = null
    ensureSessionsDir()

    const ids = Array.from(this.dirtyIds)
    this.dirtyIds.clear()

    for (const id of ids) {
      const session = this.sessions.get(id)
      if (!session) {
        const path = join(SESSIONS_DIR, `${id}.json`)
        try { unlinkSync(path) } catch {}
        continue
      }
      try {
        const json = JSON.stringify(serializeSession(session))
        const tmpPath = join(SESSIONS_DIR, `${id}.json.tmp`)
        const finalPath = join(SESSIONS_DIR, `${id}.json`)
        writeFileSync(tmpPath, json, "utf-8")
        try {
          renameSync(tmpPath, finalPath)
        } catch {
          try { unlinkSync(tmpPath) } catch {}
        }
      } catch (err) { console.error("[argent] Session save error:", err instanceof Error ? err.message : String(err)) }
    }
  }

  create(agentName: string, model: ModelRef, workingDir: string): Session {
    const id = `argent-${Date.now()}-${++sessionCounter}`
    const session: Session = {
      id,
      agentName,
      model,
      messages: [],
      workingDirectory: workingDir,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    }
    this.sessions.set(id, session)
    this.scheduleSave(id)
    return session
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id)
  }

  addMessage(sessionId: string, message: Message): void {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    session.messages.push(message)
    session.updatedAt = new Date()
    this.scheduleSave(sessionId)
  }

  getMessages(sessionId: string): Message[] {
    return this.sessions.get(sessionId)?.messages || []
  }

  updateModel(sessionId: string, model: ModelRef): void {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    session.model = model
    session.updatedAt = new Date()
    this.scheduleSave(sessionId)
  }

  switchAgent(sessionId: string, agentName: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    session.agentName = agentName
    session.updatedAt = new Date()
    this.scheduleSave(sessionId)
  }

  delete(sessionId: string): boolean {
    const result = this.sessions.delete(sessionId)
    if (result) {
      this.scheduleSave(sessionId)
    }
    return result
  }

  list(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  undo(sessionId: string): Message | undefined {
    const session = this.sessions.get(sessionId)
    if (!session || session.messages.length === 0) return undefined

    let popped = false
    while (session.messages.length > 0 && (session.messages[session.messages.length - 1]!.role === "tool" || session.messages[session.messages.length - 1]!.role === "system")) {
      session.messages.pop()
      popped = true
    }
    if (session.messages.length > 0 && session.messages[session.messages.length - 1]!.role === "assistant") {
      const undone = session.messages.pop()
      this.scheduleSave(sessionId)
      return undone
    }
    if (popped) {
      session.updatedAt = new Date()
      this.scheduleSave(sessionId)
    }
    return undefined
  }

  rewindToUserMessage(sessionId: string, index: number): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const messages = session.messages
    if (index < 0 || index >= messages.length) return false
    if (messages[index]?.role !== "user") return false

    session.messages = messages.slice(0, index)
    session.updatedAt = new Date()
    this.scheduleSave(sessionId)
    return true
  }

  dispose(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    this.flushSaves()
  }

  markDirty(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.updatedAt = new Date()
    this.scheduleSave(sessionId)
  }
}
