import type { ArgentEngine } from "../engine.js"

let vimMode = false

export function isVimMode(): boolean {
  return vimMode
}

export function vimCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Vim Mode                           ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  vimMode = !vimMode

  if (vimMode) {
    lines.push("  ● Vim mode ENABLED.")
    lines.push("")
    lines.push("  Keybindings:")
    lines.push("    h/j/k/l     Move cursor")
    lines.push("    i           Insert mode")
    lines.push("    ESC         Normal mode")
    lines.push("    dd          Delete line")
    lines.push("    yy          Copy line")
    lines.push("    p           Paste")
    lines.push("    u           Undo")
    lines.push("    Ctrl+R      Redo")
    lines.push("    /pattern    Search")
    lines.push("    :w          Save (write)")
    lines.push("    :q          Quit")
    lines.push("    :wq         Save and quit")
  } else {
    lines.push("  ● Vim mode DISABLED.")
    lines.push("")
    lines.push("  Standard keybindings restored.")
    lines.push("  Run /vim to toggle back on.")
  }

  return lines.join("\n")
}
