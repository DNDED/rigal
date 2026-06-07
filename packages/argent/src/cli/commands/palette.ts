import type { ArgentEngine } from "../engine.js"

export interface PaletteAction {
  id: string
  label: string
  description: string
  shortcut?: string
  command: string
}

export function paletteCommand(_engine: ArgentEngine): string {
  return `PALETTE_OPEN`
}


