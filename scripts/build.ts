#!/usr/bin/env bun
import { execSync } from "child_process"

const target = process.argv[2] || "rigal"

console.log("Building RIGAL packages...")

try {
  execSync("bun run packages/rigal/script/build.ts", { cwd: __dirname + "/..", stdio: "inherit" })
} catch {
  console.error("Build failed. Make sure bun is installed and packages are linked.")
  process.exit(1)
}

console.log("Build complete. Run with: bun packages/rigal/dist/main.js")
