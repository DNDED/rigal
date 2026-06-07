#!/usr/bin/env bun
import React from "react"
import { render } from "ink"
import { App } from "./App.js"
import { ArgentEngine, type UIEvent } from "./engine.js"
import type { Message } from "@argent/core"
import { stdin, stdout } from "process"

const args = process.argv.slice(2)
const isHeadless = args.includes("--headless") || args.includes("-H")
const showHelp = args.includes("--help") || args.includes("-h")
const autoApprove = args.includes("--auto-approve") || args.includes("-y")

if (showHelp) {
  console.log("⬡ ARGENT — Universal AI Coding Harness")
  console.log("")
  console.log("Usage:")
  console.log("  argent                  Start interactive TUI")
  console.log("  argent --headless       Run in headless/script mode")
  console.log("  argent --headless -y    Headless with auto-approve tools")
  console.log("  argent --help           Show this help")
  console.log("")
  console.log("Setup:")
  console.log("  export ANTHROPIC_API_KEY=your-key")
  console.log("  export OPENAI_API_KEY=your-key")
  console.log("")
  console.log("Headless mode reads from stdin:")
  console.log("  echo 'fix the lint errors' | argent --headless -y")
  console.log("  argent --headless < instructions.txt")
  process.exit(0)
}

if (isHeadless) {
  runHeadless().catch((err) => {
    console.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  })
} else if (stdin.isTTY && stdout.isTTY) {
  render(React.createElement(App), {
    patchConsole: false,
    exitOnCtrlC: true,
  })
} else {
  console.log("⬡ ARGENT — Universal AI Coding Harness")
  console.log("")
  console.log("TTY not available. Use --headless for pipe/script mode:")
  console.log("  echo 'your prompt' | argent --headless -y")
  console.log("")
  process.exit(0)
}

async function runHeadless(): Promise<void> {
  let inputText = ""
  if (!stdin.isTTY) {
    const chunks: Buffer[] = []
    for await (const chunk of stdin) {
      chunks.push(chunk as Buffer)
    }
    inputText = Buffer.concat(chunks).toString("utf-8").trim()
  }

  if (!inputText) {
    console.error("No input provided to headless mode. Pipe a prompt to stdin.")
    console.error("  Example: echo 'list all .ts files' | argent --headless -y")
    process.exit(1)
  }

  let cwd: string
  try { cwd = process.cwd() } catch { cwd = require("os").tmpdir() }
  const engine = new ArgentEngine(cwd)

  if (!engine.hasProvider()) {
    console.error("No provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.")
    process.exit(1)
  }

  const info = engine.getProviderInfo()
  const agent = engine.getAgent()
  console.error("⬡ ARGENT [" + info.name + "/" + info.model + "] [" + (agent?.name || "build") + "]")
  console.error("")

  let done = false
  let finalMessages: Message[] = []

  engine.setEventEmitter((event: UIEvent) => {
    switch (event.type) {
      case "stream_delta":
        process.stdout.write(event.text)
        break
      case "stream_start":
        break
      case "stream_stop":
        done = true
        break
      case "permission_needed":
        if (autoApprove) {
          engine.resolveAllow()
        } else {
          console.error("[permission needed: " + event.toolName + "]")
          console.error("[reason: " + event.reason + "]")
          console.error("[auto-denied. Use -y to auto-approve tools.]")
          engine.resolveDeny()
        }
        break
      case "permission_denied":
        console.error("[tool denied: " + event.toolName + "]")
        break
      case "tool_call":
        if (!autoApprove) {
          console.error("[tool: " + event.toolCall.name + "]")
        }
        break
      case "tool_result":
        break
      case "error":
        console.error("[error: " + event.message + "]")
        done = true
        break
      case "doom_loop_warning":
        console.error("[" + event.message + "]")
        done = true
        break
      case "message":
        finalMessages.push(event.message)
        break
      case "messages_reset":
        break
      case "status":
        break
      case "swarm_updated":
        break
    }
  })

  engine.sendMessage(inputText)

  let intervalId: ReturnType<typeof setInterval> | null = null
  await Promise.race([
    new Promise<void>((resolve) => {
      intervalId = setInterval(() => {
        if (done) {
          clearInterval(intervalId!)
          intervalId = null
          resolve()
        }
      }, 100)
    }),
    new Promise<void>((resolve) => setTimeout(() => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      console.error("[headless: timeout after 5 minutes, forcing exit]")
      resolve()
    }, 300000)),
  ])

  process.stdout.write("\n")

  const lastAssistant = [...finalMessages].reverse().find((m) => m.role === "assistant")
  if (!lastAssistant && finalMessages.length > 0) {
    const last = finalMessages[finalMessages.length - 1]
    if (last) {
      for (const c of last.content) {
        if (c.type === "text" && c.text) process.stdout.write(c.text + "\n")
      }
    }
  }
}
