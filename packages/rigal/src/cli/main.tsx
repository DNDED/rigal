#!/usr/bin/env bun
import React from "react"
import { render } from "ink"
import { App } from "./App.js"
import { stdin, stdout } from "process"

if (stdin.isTTY && stdout.isTTY) {
  render(React.createElement(App), {
    patchConsole: false,
    exitOnCtrlC: true,
  })
} else {
  console.log("⬡ RIGAL — Universal AI Coding Harness")
  console.log("=====================================")
  console.log()
  console.log("TTY not available. RIGAL requires a real terminal.")
  console.log()
  console.log("Usage:")
  console.log("  rigal            Start interactive TUI")
  console.log("  rigal --help     Show help")
  console.log()
  console.log("For scripting / headless use:")
  console.log("  export RIGAL_HEADLESS=1")
  console.log("  echo 'search for TODO comments' | bun run headless")
  console.log()
  console.log("Quick setup:")
  console.log("  export ANTHROPIC_API_KEY=your-key")
  console.log("  export OPENAI_API_KEY=your-key")
  console.log()
  process.exit(0)
}
