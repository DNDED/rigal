import { describe, test, expect, beforeEach } from "bun:test"
import { ToolRegistry } from "../src/services/tool-registry.js"
import type { ToolDef, ToolResult } from "../src/types.js"

const echoTool: ToolDef = {
  name: "echo",
  description: "Echoes back the message",
  parameters: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
    required: ["message"],
  },
  async execute(params): Promise<ToolResult> {
    return { content: [{ type: "text", text: `echo: ${params.message}` }] }
  },
}

const failTool: ToolDef = {
  name: "fail",
  description: "Always fails",
  parameters: { type: "object", properties: {} },
  async execute(): Promise<ToolResult> {
    throw new Error("intentional failure")
  },
}

describe("ToolRegistry", () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = new ToolRegistry()
  })

  test("registers and lists tools", () => {
    registry.register(echoTool)
    expect(registry.list().length).toBe(1)
    expect(registry.get("echo")?.name).toBe("echo")
  })

  test("registers multiple tools", () => {
    registry.registerAll([echoTool, failTool])
    expect(registry.list().length).toBe(2)
  })

  test("executes a tool", async () => {
    registry.register(echoTool)
    const result = await registry.execute("echo", { message: "hello" }, {
      sessionId: "test",
      workingDirectory: "/tmp",
      agentName: "build",
    })

    expect(result.isError).toBeFalsy()
    expect(result.content[0]!.text).toBe("echo: hello")
  })

  test("returns error for unknown tool", async () => {
    const result = await registry.execute("nonexistent", {}, {
      sessionId: "test",
      workingDirectory: "/tmp",
      agentName: "build",
    })

    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toContain("not found")
  })

  test("returns error when tool throws", async () => {
    registry.register(failTool)
    const result = await registry.execute("fail", {}, {
      sessionId: "test",
      workingDirectory: "/tmp",
      agentName: "build",
    })

    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toContain("intentional failure")
  })

  test("listAllowed filters by permission map", () => {
    registry.registerAll([echoTool, failTool])
    const allowed = registry.listAllowed({ echo: "allow", fail: "deny" })

    expect(allowed.length).toBe(1)
    expect(allowed[0]!.name).toBe("echo")
  })

  test("listAllowed includes ask permissions", () => {
    registry.registerAll([echoTool, failTool])
    const allowed = registry.listAllowed({ echo: "ask", fail: "ask" })

    expect(allowed.length).toBe(2)
  })

  test("toOpenAIFormat returns function definitions", () => {
    registry.register(echoTool)
    const openAITools = registry.toOpenAIFormat()

    expect(openAITools.length).toBe(1)
    expect(openAITools[0]!.type).toBe("function")
    expect(openAITools[0]!.function.name).toBe("echo")
  })
})
