import type { ArgentEngine } from "../engine.js"

export function shortcutsCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Keyboard Shortcuts                 ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const shortcuts = [
    { key: "Enter",            action: "Send message" },
    { key: "Ctrl+C",           action: "Quit ARGENT / Cancel" },
    { key: "Ctrl+D",           action: "Exit (EOF)" },
    { key: "Ctrl+L",           action: "Clear screen" },
    { key: "Ctrl+R",           action: "Search command history" },
    { key: "Ctrl+K",           action: "Open command palette" },
    { key: "Ctrl+K, Ctrl+S",   action: "Show shortcuts (this)" },
    { key: "Tab",              action: "Switch agent / Autocomplete" },
    { key: "Shift+Tab",        action: "Previous agent" },
    { key: "Up/Down",          action: "Navigate history" },
    { key: "Ctrl+U",           action: "Clear input line" },
    { key: "Ctrl+W",           action: "Delete previous word" },
    { key: "Ctrl+A",           action: "Go to beginning of line" },
    { key: "Ctrl+E",           action: "Go to end of line" },
    { key: "Ctrl+P",           action: "Change provider" },
    { key: "Ctrl+M",           action: "Change model" },
    { key: "Ctrl+V",           action: "Toggle voice input (if enabled)" },
    { key: "Esc",              action: "Close modal / Normal mode (vim)" },
    { key: "F1",               action: "Show help" },
    { key: "F5",               action: "Refresh / Redraw TUI" },
    { key: "F11",              action: "Toggle fullscreen" },
  ]

  lines.push(`  ┌${"─".repeat(58)}┐`)
  lines.push(`  │  Shortcut                     Action                          │`)
  lines.push(`  ├${"─".repeat(58)}┤`)

  for (const s of shortcuts) {
    const key = s.key.padEnd(28, " ")
    const action = s.action.length > 28 ? s.action.slice(0, 26) + ".." : s.action
    lines.push(`  │ ${key} ${action.padEnd(28, " ")} │`)
  }

  lines.push(`  └${"─".repeat(58)}┘`)

  lines.push("")
  lines.push("  ── Vim Mode Shortcuts (when enabled) ──")
  lines.push("")

  const vimShortcuts = [
    { key: "h / j / k / l", action: "Move cursor" },
    { key: "i",             action: "Enter insert mode" },
    { key: "Esc",           action: "Return to normal mode" },
    { key: "dd",            action: "Delete current line" },
    { key: "yy",            action: "Copy (yank) current line" },
    { key: "p",             action: "Paste after cursor" },
    { key: "u",             action: "Undo last change" },
    { key: "Ctrl+R",        action: "Redo" },
    { key: "/pattern",      action: "Search forward" },
    { key: "?pattern",      action: "Search backward" },
    { key: "n / N",         action: "Next / previous match" },
    { key: "0",             action: "Go to line start" },
    { key: "$",             action: "Go to line end" },
    { key: "gg",            action: "Go to first line" },
    { key: "G",             action: "Go to last line" },
    { key: ":w",            action: "Save (write) file" },
    { key: ":q",            action: "Quit" },
    { key: ":wq",           action: "Save and quit" },
    { key: ":q!",           action: "Force quit" },
  ]

  for (const vs of vimShortcuts) {
    const key = vs.key.padEnd(18, " ")
    const action = vs.action
    lines.push(`  ${key} ${action}`)
  }

  lines.push("")
  lines.push("  ── Mouse / Touch ──")
  lines.push("  Scroll up/down    Navigate output history")
  lines.push("  Click              Focus / select")
  lines.push("  Right-click        Context menu (if supported)")

  return lines.join("\n")
}
