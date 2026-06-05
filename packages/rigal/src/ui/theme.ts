export const theme = {
  colors: {
    bg: "#0a0a0f",
    surface: "#13131a",
    surfaceRaised: "#1a1a24",
    surfaceOverlay: "#1e1e2e",
    border: "#2a2a3a",
    borderFocus: "#3a3a5a",
    accent: "#00e5ff",
    accentAlt: "#7c3aed",
    accentGlow: "rgba(0, 229, 255, 0.15)",
    text: "#e0e0e0",
    textDim: "#8888a0",
    textBright: "#ffffff",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#f43f5e",
    code: "#a78bfa",
    keyword: "#00e5ff",
    string: "#10b981",
    comment: "#666680",
  },
  fonts: {
    ui: "Geist, Inter, system-ui",
    code: "JetBrains Mono, Fira Code, monospace",
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    full: "9999px",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
} as const

export function gradient(start: string, end: string, steps: number): string[] {
  const sr = parseInt(start.slice(1, 3), 16)
  const sg = parseInt(start.slice(3, 5), 16)
  const sb = parseInt(start.slice(5, 7), 16)
  const er = parseInt(end.slice(1, 3), 16)
  const eg = parseInt(end.slice(3, 5), 16)
  const eb = parseInt(end.slice(5, 7), 16)

  const colors: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const r = Math.round(sr + (er - sr) * t)
    const g = Math.round(sg + (eg - sg) * t)
    const b = Math.round(sb + (eb - sb) * t)
    colors.push(`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`)
  }
  return colors
}
