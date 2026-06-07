import type { ArgentEngine } from "../engine.js"

let voiceMode = false

export function isVoiceMode(): boolean {
  return voiceMode
}

export function voiceCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Voice Input Mode                   ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  voiceMode = !voiceMode

  if (voiceMode) {
    lines.push("  ● Voice input ENABLED.")
    lines.push("")
    lines.push("  Voice input allows you to speak commands")
    lines.push("  and ARGENT will transcribe them to text.")
    lines.push("")
    lines.push("  Requirements:")
    lines.push("    - Microphone access")
    lines.push("    - Whisper API key (optional)")
    lines.push("    - Or: local speech-to-text")
    lines.push("")
    lines.push("  Voice commands:")
    lines.push("    Ctrl+V        Toggle voice recording")
    lines.push("    Speak...      Your input is transcribed")
    lines.push("")
    lines.push("  Note: Voice mode is a TUI feature.")
    lines.push("  Microphone permissions must be granted.")
  } else {
    lines.push("  ● Voice input DISABLED.")
    lines.push("")
    lines.push("  Run /voice to toggle back on at any time.")
  }

  return lines.join("\n")
}
