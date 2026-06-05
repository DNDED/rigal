import { describe, test, expect, beforeEach } from "bun:test"
import { SessionService } from "../src/services/session.js"
import type { Message } from "../src/types.js"

describe("SessionService", () => {
  let sessions: SessionService

  beforeEach(() => {
    sessions = new SessionService()
  })

  test("creates a session with an ID and defaults", () => {
    const session = sessions.create("build", { provider: "openai", model: "gpt-4o" }, "/tmp/test")

    expect(session.id).toMatch(/^rigal-/)
    expect(session.agentName).toBe("build")
    expect(session.model.provider).toBe("openai")
    expect(session.model.model).toBe("gpt-4o")
    expect(session.workingDirectory).toBe("/tmp/test")
    expect(session.messages).toEqual([])
  })

  test("adds and retrieves messages", () => {
    const session = sessions.create("build", { provider: "openai", model: "gpt-4o" }, "/tmp")

    const msg: Message = {
      role: "user",
      content: [{ type: "text", text: "hello" }],
    }

    sessions.addMessage(session.id, msg)
    const msgs = sessions.getMessages(session.id)

    expect(msgs.length).toBe(1)
    expect(msgs[0]?.role).toBe("user")
    expect(msgs[0]?.content[0]?.text).toBe("hello")
  })

  test("switches agent", () => {
    const session = sessions.create("build", { provider: "openai", model: "gpt-4o" }, "/tmp")
    sessions.switchAgent(session.id, "plan")

    const updated = sessions.get(session.id)
    expect(updated?.agentName).toBe("plan")
  })

  test("undo removes last messages", () => {
    const session = sessions.create("build", { provider: "openai", model: "gpt-4o" }, "/tmp")

    sessions.addMessage(session.id, { role: "user", content: [{ type: "text", text: "q1" }] })
    sessions.addMessage(session.id, { role: "assistant", content: [{ type: "text", text: "a1" }] })

    sessions.undo(session.id)

    expect(sessions.getMessages(session.id).length).toBe(0)
  })

  test("deletes session", () => {
    const session = sessions.create("build", { provider: "openai", model: "gpt-4o" }, "/tmp")
    expect(sessions.delete(session.id)).toBe(true)
    expect(sessions.get(session.id)).toBeUndefined()
  })

  test("lists sessions sorted by update time", async () => {
    const s1 = sessions.create("build", { provider: "openai", model: "gpt-4o" }, "/tmp")
    await new Promise((r) => setTimeout(r, 5))
    const s2 = sessions.create("plan", { provider: "anthropic", model: "claude" }, "/tmp")

    sessions.addMessage(s2.id, { role: "user", content: [{ type: "text", text: "hello" }] })

    const list = sessions.list()
    expect(list[0]!.id).toBe(s2.id)
  })
})
