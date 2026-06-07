import type { ArgentEngine } from "../engine.js"
import { existsSync, readFileSync, statSync } from "fs"
import { join } from "path"

export function explainCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Explain Code                       ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const input = args.join(" ")

  if (!input) {
    lines.push("  Usage: /explain <file-path>[:line]")
    lines.push("")
    lines.push("  Explains a file, function, or code snippet.")
    lines.push("")
    lines.push("  Examples:")
    lines.push("    /explain src/main.ts")
    lines.push("    /explain src/main.ts:42")
    lines.push("    /explain function calculateTotal")
    lines.push("")
    lines.push("  ARGENT will analyze the code and provide:")
    lines.push("    - What it does")
    lines.push("    - How it works")
    lines.push("    - Dependencies and side effects")
    lines.push("    - Potential issues or improvements")
    return lines.join("\n")
  }

  const wd = engine.config.getWorkingDir()

  const fileMatch = input.match(/^(.+?):(\d+)$/)
  let filePath = input
  let targetLine: number | null = null

  if (fileMatch) {
    filePath = fileMatch[1]!
    targetLine = parseInt(fileMatch[2]!, 10)
  }

  const resolvedPath = join(wd, filePath)

  if (existsSync(resolvedPath) && !statSync(resolvedPath).isDirectory()) {
    lines.push(`  File: ${filePath}`)

    try {
      const content = readFileSync(resolvedPath, "utf-8")
      const allLines = content.split("\n")
      let sourceLines = allLines
      let startLine = 0

      if (targetLine !== null && targetLine >= 1 && targetLine <= allLines.length) {
        const contextBefore = 10
        const contextAfter = 15
        startLine = Math.max(0, targetLine - contextBefore - 1)
        const endLine = Math.min(allLines.length, targetLine + contextAfter)
        sourceLines = allLines.slice(startLine, endLine)
        lines.push(`  Context: lines ${startLine + 1}–${endLine}`)
      } else {
        if (allLines.length > 50) {
          sourceLines = allLines.slice(0, 50)
          lines.push(`  Showing first 50 of ${allLines.length} lines`)
        }
      }

      lines.push("")
      lines.push("  ── Source ──")
      lines.push("")

      const len = String(startLine + sourceLines.length).length
      for (let i = 0; i < sourceLines.length; i++) {
        const lineNum = startLine + i + 1
        const prefix = String(lineNum).padStart(len, " ")
        const marker = targetLine === lineNum ? "▶" : "│"
        lines.push(`  ${marker} ${prefix} ${sourceLines[i]}`)
      }

      lines.push("")
      lines.push("  ── Analysis ──")
      lines.push("")

      const ext = filePath.split(".").pop()?.toLowerCase() ?? ""

      const analysis = analyzeCode(sourceLines.join("\n"), ext, targetLine)
      for (const a of analysis) {
        lines.push(a)
      }

    } catch (err) {
      lines.push(`  Error reading file: ${err instanceof Error ? err.message : String(err)}`)
    }
  } else {
    lines.push(`  File not found: ${filePath}`)
    lines.push(`  Looked in: ${resolvedPath}`)
    lines.push("")
    lines.push("  Tip: Use relative paths from the project root.")
  }

  return lines.join("\n")
}

function analyzeCode(code: string, ext: string, targetLine: number | null): string[] {
  const lines: string[] = []

  if (ext === "ts" || ext === "tsx") {
    lines.push("  Language: TypeScript")

    if (code.includes("export ")) lines.push("  ● Has exports (public API surface)")
    if (code.includes("import ")) lines.push("  ● Has imports (external dependencies)")
    if (code.includes("async")) lines.push("  ● Contains async operations")
    if (code.includes("class ")) lines.push("  ● Defines a class")
    if (code.includes("interface ")) lines.push("  ● Defines an interface")
    if (code.includes("type ")) lines.push("  ● Uses type aliases")
    if (code.includes("function ")) lines.push("  ● Defines functions")
    if (code.includes("const ") && code.includes("=>")) lines.push("  ● Uses arrow functions")
    if (code.includes("useState") || code.includes("useEffect")) lines.push("  ● React hooks detected")
    if (code.includes("try")) lines.push("  ● Has error handling (try/catch)")
    if (code.includes(".map(")) lines.push("  ● Uses array transformations")
    if (code.includes("Promise")) lines.push("  ● Works with Promises")

  } else if (ext === "js" || ext === "jsx") {
    lines.push("  Language: JavaScript")
    if (code.includes("async")) lines.push("  ● Contains async operations")
    if (code.includes("class ")) lines.push("  ● Defines a class")
    if (code.includes("function ")) lines.push("  ● Defines functions")

  } else if (ext === "py") {
    lines.push("  Language: Python")
    if (code.includes("def ")) lines.push("  ● Defines functions")
    if (code.includes("class ")) lines.push("  ● Defines a class")
    if (code.includes("import ")) lines.push("  ● Has imports")

  } else if (ext === "rs") {
    lines.push("  Language: Rust")
    if (code.includes("fn ")) lines.push("  ● Defines functions")
    if (code.includes("struct ")) lines.push("  ● Defines structs")
    if (code.includes("impl ")) lines.push("  ● Has implementations")

  } else if (ext === "go") {
    lines.push("  Language: Go")
    if (code.includes("func ")) lines.push("  ● Defines functions")
    if (code.includes("struct {")) lines.push("  ● Defines structs")

  } else {
    lines.push(`  Language: ${ext || "unknown"}`)
  }

  const lineCount = code.split("\n").length
  lines.push(`  Lines: ~${lineCount}`)

  if (targetLine !== null) {
    const allLines = code.split("\n")
    const lineIdx = targetLine - 1
    if (lineIdx >= 0 && lineIdx < allLines.length) {
      const line = allLines[lineIdx]?.trim() ?? ""
      if (line) {
        lines.push("")
        lines.push(`  Line ${targetLine}: \`${line.trim().slice(0, 60)}${line.length > 60 ? "..." : ""}\``)
      }
    }
  }

  return lines
}
