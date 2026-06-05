import type { Session, Message, ModelRef } from "../types.js"

let sessionCounter = 0

export class SessionService {
  private sessions: Map<string, Session> = new Map()

  create(agentName: string, model: ModelRef, workingDir: string): Session {
    const id = `rigal-${Date.now()}-${++sessionCounter}`
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
  }

  getMessages(sessionId: string): Message[] {
    return this.sessions.get(sessionId)?.messages || []
  }

  updateModel(sessionId: string, model: ModelRef): void {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    session.model = model
  }

  switchAgent(sessionId: string, agentName: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    session.agentName = agentName
  }

  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }

  list(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  undo(sessionId: string): Message | undefined {
    const session = this.sessions.get(sessionId)
    if (!session || session.messages.length === 0) return undefined

    session.messages.pop()
    return session.messages.pop()
  }
}
