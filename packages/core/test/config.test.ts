import { describe, test, expect, beforeEach } from "bun:test"
import { ConfigService } from "../src/services/config.js"

describe("ConfigService", () => {
  test("sets up defaults when no env vars", () => {
    const cfg = new ConfigService("/tmp")
    const agents = cfg.getAgents()

    expect(agents.length).toBe(2)
    expect(agents[0]!.name).toBe("build")
    expect(agents[1]!.name).toBe("plan")

    const build = cfg.getAgent("build")!
    expect(build.mode).toBe("primary")
    expect(build.tools.bash).toBe("allow")
    expect(build.tools.write).toBe("allow")

    const plan = cfg.getAgent("plan")!
    expect(plan.tools.write).toBe("deny")
    expect(plan.tools.edit).toBe("deny")
    expect(plan.tools.bash).toBe("ask")
  })

  test("gets default permissions", () => {
    const cfg = new ConfigService("/tmp")
    expect(cfg.getPermission("bash")).toBe("ask")
    expect(cfg.getPermission("read")).toBe("allow")
    expect(cfg.getPermission("unknown")).toBe("ask")
  })

  test("returns working directory", () => {
    const cfg = new ConfigService("/tmp/rigal-test")
    expect(cfg.getWorkingDir()).toBe("/tmp/rigal-test")
  })

  test("setProvider updates config", () => {
    const cfg = new ConfigService("/tmp")
    cfg.setProvider({ type: "openai", apiKey: "sk-test", model: "gpt-4o" })
    const provider = cfg.getProvider()
    expect(provider?.type).toBe("openai")
    expect(provider?.model).toBe("gpt-4o")
    expect(provider?.apiKey).toBe("sk-test")
  })

  test("addAgent adds custom agent", () => {
    const cfg = new ConfigService("/tmp")
    cfg.addAgent({
      name: "custom",
      description: "A custom agent",
      mode: "primary",
      tools: { bash: "allow", read: "allow" },
      systemPrompt: "You are custom",
    })

    const agent = cfg.getAgent("custom")
    expect(agent?.name).toBe("custom")
  })
})
