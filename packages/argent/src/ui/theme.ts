export const brandGradient = [
  "#4338ca",
  "#6366f1",
  "#818cf8",
  "#a5b4fc",
  "#c4b5fd",
  "#a78bfa",
  "#7c3aed",
  "#6d28d9",
]

export const surfaceGradient = ["#05050a", "#0a0a14", "#10101d"]

export const statusColors = {
  idle: "#6e6e82",
  streaming: "#818cf8",
  error: "#fb7185",
  success: "#34d399",
  warning: "#fbbf24",
}

export const cardBorder = "#1e1e30"

export const theme = {
  colors: {
    cardBorder: "#1e1e30" as string,
    bg: "#05050a",
    surface: "#0a0a14",
    surfaceRaised: "#10101d",
    surfaceOverlay: "#161626",
    surfaceElevated: "#1c1c30",
    border: "#1a1a2e",
    borderSubtle: "#12121f",
    borderFocus: "#3a3a58",
    borderAccent: "rgba(99, 102, 241, 0.32)",
    accent: "#818cf8",
    accentBright: "#a5b4fc",
    accentDim: "#6366f1",
    accentAlt: "#c084fc",
    accentTertiary: "#22d3ee",
    accentGlow: "rgba(129, 140, 248, 0.14)",
    accentGlowStrong: "rgba(129, 140, 248, 0.28)",
    text: "#c8c8d8",
    textDim: "#8e8ea4",
    textMuted: "#6e6e82",
    textBright: "#f0f0f8",
    statusIdle: statusColors.idle,
    statusStreaming: statusColors.streaming,
    statusError: statusColors.error,
    statusSuccess: statusColors.success,
    statusWarning: statusColors.warning,
    textWhite: "#ffffff",
    success: "#34d399",
    successDim: "rgba(52, 211, 153, 0.14)",
    warning: "#fbbf24",
    warningDim: "rgba(251, 191, 36, 0.14)",
    error: "#fb7185",
    errorDim: "rgba(251, 113, 133, 0.14)",
    info: "#60a5fa",
    code: "#c4b5fd",
    keyword: "#818cf8",
    string: "#34d399",
    number: "#fbbf24",
    comment: "#6e6e82",
    tag: "#fb7185",
    attribute: "#22d3ee",
    type: "#f0ab6b",
    diffAdd: "#34d399",
    diffAddBg: "rgba(52, 211, 153, 0.08)",
    diffDel: "#fb7185",
    diffDelBg: "rgba(251, 113, 133, 0.08)",
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    xxl: 28,
    xxxl: 36,
  },
  chars: {
    thin: "─",
    light: "╌",
    dotted: "┄",
    double: "═",
    round: "╭╮╰╯",
    heavy: "┏┓┗┛",
    vertical: "│",
    verticalLight: "┊",
    branch: "├",
    branchLast: "└",
    connector: "─",
    dot: "●",
    dotEmpty: "○",
    diamond: "◆",
    diamondEmpty: "◇",
    arrow: "▸",
    arrowLeft: "◂",
    bullet: "•",
    dash: "–",
    block: "█",
    blockLight: "░",
    blockMedium: "▒",
    blockHeavy: "▓",
    cursor: "▊",
    check: "✓",
    cross: "✗",
    ellipsis: "…",
    search: "⌕",
    keyEnter: "⏎",
    keyCtrl: "⌃",
    keyShift: "⇧",
    upDown: "↕",
  },
  icons: {
    diamond: "◆",
    dot: "●",
    dotEmpty: "○",
    arrow: "▸",
    bullet: "•",
    branch: "├─",
    branchLast: "└─",
    verticalBar: "│",
    verticalDotted: "┊",
    connector: "─",
    prefix: "▸ ",
    prompt: "❯",
    promptDisabled: "○",
    thinking: "◌",
    success: "✓",
    error: "✗",
    warning: "⚠",
    tool: "⚙",
    search: "⌕",
    keyboard: "⌨",
    agentBuild: "●",
    agentPlan: "○",
    agentExplore: "◇",
    diffAdd: "+",
    diffDel: "-",
    diffMod: "~",
  },
} as const

export function gradient(start: string, end: string, steps: number): string[] {
  if (steps <= 1) return [start]
  const sr = parseInt(start.slice(1, 3), 16)
  const sg = parseInt(start.slice(3, 5), 16)
  const sb = parseInt(start.slice(5, 7), 16)
  const er = parseInt(end.slice(1, 3), 16)
  const eg = parseInt(end.slice(3, 5), 16)
  const eb = parseInt(end.slice(5, 7), 16)

  const colors: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const ease = t * t * (3 - 2 * t)
    const r = Math.round(sr + (er - sr) * ease)
    const g = Math.round(sg + (eg - sg) * ease)
    const b = Math.round(sb + (eb - sb) * ease)
    colors.push(`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`)
  }
  return colors
}

export function multiGradient(stops: string[], steps: number): string[] {
  if (stops.length < 2) return Array(steps).fill(stops[0] || "#ffffff")
  const segmentSize = Math.ceil(steps / (stops.length - 1))
  const colors: string[] = []
  for (let i = 0; i < stops.length - 1; i++) {
    const seg = gradient(stops[i]!, stops[i + 1]!, segmentSize)
    colors.push(...seg)
  }
  return colors.slice(0, steps)
}

export function horizontalRule(width: number, char: string = "─"): string {
  return char.repeat(Math.max(0, width))
}

export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}
