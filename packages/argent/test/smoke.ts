#!/usr/bin/env bun
import { ArgentEngine } from "../src/cli/engine.js"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..")

async function smokeTest() {
  console.log("⬡ ARGENT Smoke Test")
  console.log("===================")

  const engine = new ArgentEngine("/tmp")
  const info = engine.getProviderInfo()

  console.log(`  Provider: ${info.name}`)
  console.log(`  Model: ${info.model}`)
  console.log(`  Agents: ${engine.getAgents().map((a) => a.name).join(", ")}`)
  console.log(`  Tools: ${engine.tools.list().map((t) => t.name).join(", ")}`)

  // Test tool execution
  const result = await engine.tools.execute("read", { filePath: "/tmp" }, {
    sessionId: "test",
    workingDirectory: "/tmp",
    agentName: "build",
  })

  console.log()
  console.log("Tool test (read /tmp):")
  console.log(`  isError: ${result.isError}`)
  console.log(`  content: ${result.content[0]?.text?.slice(0, 200)}`)

  // Test bash tool
  const bashResult = await engine.tools.execute("bash", {
    command: "echo 'ARGENT smoke test success' && date",
    timeout: 5000,
  }, {
    sessionId: "test",
    workingDirectory: "/tmp",
    agentName: "build",
  })

  console.log()
  console.log("Bash test:")
  console.log(`  isError: ${bashResult.isError}`)
  console.log(`  output: ${bashResult.content[0]?.text?.trim()}`)

  // Test grep
  const grepResult = await engine.tools.execute("grep", {
    pattern: "export",
    path: resolve(repoRoot, "packages/argent/src"),
    include: "*.ts",
  }, {
    sessionId: "test",
    workingDirectory: repoRoot,
    agentName: "build",
  })

  console.log()
  console.log("Grep test (export in src):")
  console.log(`  matches: ${grepResult.content[0]?.text?.split("\n").length} lines found`)

  // Test glob
  const globResult = await engine.tools.execute("glob", {
    pattern: "**/*.ts",
    path: resolve(repoRoot, "packages/argent/src"),
  }, {
    sessionId: "test",
    workingDirectory: repoRoot,
    agentName: "build",
  })

  console.log()
  console.log("Glob test (**/*.ts in argent/src):")
  console.log(`  files: ${globResult.content[0]?.text?.split("\n").length} found`)

  console.log()
  console.log("All smoke tests passed!")
}

smokeTest().catch((err) => {
  console.error("Smoke test failed:", err)
  process.exit(1)
})
