import type { ToolDef } from "@argent/core"
import type { SwarmEngine } from "../cli/swarm.js"

export function createSwarmTools(
  swarmEngine: SwarmEngine,
  getSessionId: () => string
): ToolDef[] {
  return [
    swarmSpawnTool(swarmEngine, getSessionId),
    swarmStatusTool(swarmEngine),
    swarmCancelTool(swarmEngine),
    swarmOutputTool(swarmEngine),
  ]
}

function swarmSpawnTool(swarmEngine: SwarmEngine, getSessionId: () => string): ToolDef {
  return {
    name: "swarmSpawn",
    description:
      "Spawn multiple parallel sub-agent tasks to explore, build, or plan simultaneously. Each task runs independently with its own model. Use this when you need to search across multiple areas, analyze several files, or delegate work in parallel. Wait for tasks to complete before reading their output.",
    parameters: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          description: "List of tasks to spawn in parallel",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Short descriptive name for this task",
              },
              description: {
                type: "string",
                description:
                  "Detailed instructions for the sub-agent. Include exactly what to search for, read, or report on. Be specific about expected output format.",
              },
              agentType: {
                type: "string",
                description:
                  "Type of sub-agent: 'explore' (read-only search/analysis, fast), 'build' (full dev access), 'plan' (read-only planning)",
                enum: ["explore", "build", "plan"],
              },
              model: {
                type: "string",
                description: "Optional cheaper/faster model override for this task (e.g. 'gpt-4o-mini', 'claude-3-5-haiku-20241022')",
              },
              maxSteps: {
                type: "number",
                description: "Maximum agent loop iterations (default 25)",
              },
            },
            required: ["name", "description", "agentType"],
          },
        },
      },
      required: ["tasks"],
    },
    execute: async (params) => {
      const taskSpecs = Array.isArray(params.tasks) ? params.tasks : [params.tasks]
      const tasks = swarmEngine.spawn(
        taskSpecs.map((t: Record<string, unknown>) => {
          if (!t) return { name: "untitled", description: "", agentType: "explore", model: undefined, maxSteps: undefined }
          const ms = t.maxSteps ? Number(t.maxSteps) : undefined
          return {
            name: String(t.name || "untitled"),
            description: String(t.description || ""),
            agentType: (() => { const at = String(t.agentType || "explore"); return ["explore", "build", "plan"].includes(at) ? at : "explore" })(),
            model: t.model ? String(t.model) : undefined,
            maxSteps: (ms !== undefined && !isNaN(ms) && isFinite(ms) && ms > 0) ? ms : undefined,
          }
        })
      )

      const sessionId = getSessionId()
      swarmEngine.executeAll(
        tasks.map((t) => t.id),
        sessionId
      ).catch((err) => { console.error("[argent] Swarm executeAll error:", err instanceof Error ? err.message : String(err)) })

      const listing = tasks
        .filter((t): t is NonNullable<typeof t> => !!t)
        .map((t) => `  ${t.id}: ${t.name} [${t.agentType}]`)
        .join("\n")

      return {
        content: [
          {
            type: "text",
            text: `Spawned ${tasks.length} swarm task(s). Use swarmStatus to check progress, swarmOutput to read results.\n${listing}`,
          },
        ],
      }
    },
  }
}

function swarmStatusTool(swarmEngine: SwarmEngine): ToolDef {
  return {
    name: "swarmStatus",
    description:
      "Check the progress of all spawned swarm tasks. Returns each task's ID, name, agent type, status, and any errors. Use this to monitor parallel task completion.",
    parameters: {
      type: "object",
      properties: {},
    },
    execute: async () => {
      const tasks = swarmEngine.getAllStatuses()
      if (tasks.length === 0) {
        return {
          content: [{ type: "text", text: "No swarm tasks have been spawned yet." }],
        }
      }
      const text = tasks
        .map((t) => {
          const elapsed = t.startTime
            ? `${((Date.now() - t.startTime) / 1000).toFixed(1)}s`
            : "-"
          return `${t.id}: ${t.name} [${t.status}] ${t.error ? `ERROR: ${t.error}` : `(${elapsed})`}`
        })
        .join("\n")
      return { content: [{ type: "text", text }] }
    },
  }
}

function swarmCancelTool(swarmEngine: SwarmEngine): ToolDef {
  return {
    name: "swarmCancel",
    description:
      "Cancel a running or pending swarm task by its ID. Cancelled tasks cannot be resumed. Use this to stop tasks that are no longer needed.",
    parameters: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "The ID of the task to cancel (e.g. 'swarm-...' from spawn output)",
        },
      },
      required: ["taskId"],
    },
    execute: async (params) => {
      const taskId = String(params.taskId)
      const prior = swarmEngine.getStatus(taskId)
      if (!prior) {
        return {
          content: [{ type: "text", text: `Swarm task not found: ${taskId}` }],
        }
      }
      if (prior.status === "cancelled") {
        return {
          content: [{ type: "text", text: `Swarm task ${taskId} was already cancelled` }],
        }
      }
      if (prior.status === "completed" || prior.status === "failed") {
        return {
          content: [{ type: "text", text: `Swarm task ${taskId} already finished (${prior.status})` }],
        }
      }
      swarmEngine.cancel(taskId)
      const after = swarmEngine.getStatus(taskId)
      return {
        content: [{ type: "text", text: `Cancelled swarm task: ${taskId} (was ${prior.status}, now ${after?.status || "unknown"})` }],
      }
    },
  }
}

function swarmOutputTool(swarmEngine: SwarmEngine): ToolDef {
  return {
    name: "swarmOutput",
    description:
      "Read the final output of a completed swarm task. The task must be in 'completed' status. Returns the sub-agent's full response text. Use this to retrieve results from parallel exploration or analysis tasks.",
    parameters: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "The ID of the task to read output from (e.g. 'swarm-...' from spawn output)",
        },
      },
      required: ["taskId"],
    },
    execute: async (params) => {
      const taskId = String(params.taskId)
      const output = swarmEngine.getOutput(taskId)
      return { content: [{ type: "text", text: output }] }
    },
  }
}
