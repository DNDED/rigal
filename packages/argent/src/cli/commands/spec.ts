import type { ArgentEngine } from "../engine.js"

export function specCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Spec-Driven Development            ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const topic = args.join(" ") || "feature"

  if (!args.length) {
    lines.push("  Start by describing your feature or project.")
    lines.push("")
    lines.push("  Usage: /spec <topic>")
    lines.push("  Example: /spec user authentication system")
    lines.push("")
    lines.push("  The spec workflow:")
    lines.push("    1. Interview — ARGENT asks clarifying questions")
    lines.push("    2. Spec draft — generates SPEC.md")
    lines.push("    3. Review — iterate on the spec")
    lines.push("    4. Implement — ARGENT follows the spec")
    lines.push("")
    lines.push("  This ensures alignment before writing code.")
    return lines.join("\n")
  }

  lines.push(`  Topic: ${topic}`)
  lines.push("")
  lines.push("  ── Interview Phase ──")
  lines.push("")
  lines.push("  Answer these questions to refine the spec:")
  lines.push("")

  const questions = [
    "  1. What problem does this solve?",
    "  2. Who are the users or consumers?",
    "  3. What are the core inputs and outputs?",
    "  4. Are there existing systems to integrate with?",
    "  5. What are the performance requirements?",
    "  6. What security or compliance constraints exist?",
    "  7. How will you know it's done? (success criteria)",
    "  8. What are the edge cases or failure modes?",
  ]

  for (const q of questions) {
    lines.push(q)
  }

  lines.push("")
  lines.push("  ── Next Steps ──")
  lines.push("  After answering, ARGENT will generate a SPEC.md")
  lines.push("  containing:")
  lines.push("  - Problem statement")
  lines.push("  - Architecture overview")
  lines.push("  - API/interface design")
  lines.push("  - Implementation plan with milestones")
  lines.push("  - Test strategy")
  lines.push("")
  lines.push("  Reply to continue the spec interview.")

  return lines.join("\n")
}
