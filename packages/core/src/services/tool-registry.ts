import type { ToolDef, ToolContext, ToolResult } from "../types.js"

export class ToolRegistry {
  private tools: Map<string, ToolDef> = new Map()

  register(tool: ToolDef): void {
    this.tools.set(tool.name, tool)
  }

  registerAll(tools: ToolDef[]): void {
    for (const tool of tools) this.register(tool)
  }

  get(name: string): ToolDef | undefined {
    return this.tools.get(name)
  }

  list(): ToolDef[] {
    return Array.from(this.tools.values())
  }

  listAllowed(allowed: Record<string, string>): ToolDef[] {
    return this.list().filter((t) => {
      const perm = allowed[t.name]
      return perm === "allow" || perm === "ask"
    })
  }

  async execute(name: string, params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(name)
    if (!tool) {
      return { content: [{ type: "text", text: `Tool "${name}" not found. Available: ${this.list().map((t) => t.name).join(", ")}` }], isError: true }
    }
    try {
      return await tool.execute(params, ctx)
    } catch (err) {
      return { content: [{ type: "text", text: `Tool error: ${err instanceof Error ? err.message : String(err)}` }], isError: true }
    }
  }

  toOpenAIFormat(): Array<{ type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } }> {
    return this.list().map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))
  }
}
