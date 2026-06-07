import { describe, test, expect, beforeEach } from "bun:test"
import { PermissionService } from "../src/services/permission.js"

describe("PermissionService", () => {
  test("allows when default is allow", async () => {
    const perms = new PermissionService({ bash: "allow" })
    const result = await perms.check("bash", {}, "session-1")
    expect(result).toBe(true)
  })

  test("denies when default is deny", async () => {
    const perms = new PermissionService({ bash: "deny" })
    const result = await perms.check("bash", {}, "session-1")
    expect(result).toBe(false)
  })

  test("asks handler when default is ask", async () => {
    const perms = new PermissionService({ bash: "ask" })
    perms.setHandler(async () => true)

    const result = await perms.check("bash", {}, "session-1")
    expect(result).toBe(true)
  })

  test("uses fallback when no handler and default is ask", async () => {
    const perms = new PermissionService({ bash: "ask" })
    const result = await perms.check("bash", {}, "session-1")
    expect(result).toBe(false)
  })

  test("re-asks handler until a decision is stored", async () => {
    const perms = new PermissionService({ bash: "ask" })
    let called = 0
    perms.setHandler(async () => { called++; return false })

    await perms.check("bash", {}, "session-1")
    await perms.check("bash", {}, "session-1")

    expect(called).toBe(2)
  })

  test("allow caches decisions per session", async () => {
    const perms = new PermissionService({ bash: "ask" })
    perms.allow("session-1", "bash")

    const result = await perms.check("bash", {}, "session-1")
    expect(result).toBe(true)
  })

  test("allowOnce overrides", async () => {
    const perms = new PermissionService({ bash: "deny" })
    perms.allowOnce("session-1", "bash")

    const result = await perms.check("bash", {}, "session-1")
    expect(result).toBe(true)
  })

  test("deny caches decisions per session", async () => {
    const perms = new PermissionService({ bash: "ask" })
    perms.deny("session-1", "bash")

    const result = await perms.check("bash", {}, "session-1")
    expect(result).toBe(false)
  })

  test("reset clears decisions", async () => {
    const perms = new PermissionService({ bash: "ask" })
    let called = 0
    perms.setHandler(async () => { called++; return true })

    await perms.check("bash", {}, "session-1")
    perms.reset("session-1")
    await perms.check("bash", {}, "session-1")

    expect(called).toBe(2)
  })
})
