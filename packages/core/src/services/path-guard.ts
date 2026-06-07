import type { ToolContext } from "../types.js"
import { resolve, isAbsolute, sep } from "node:path"
import { realpathSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"

const ALLOWED_EXTERNAL_DIRS = [tmpdir()]

export function resolveSafePath(requestedPath: string, ctx: ToolContext): string | null {
  const absolute = isAbsolute(requestedPath)
    ? resolve(requestedPath)
    : resolve(ctx.workingDirectory, requestedPath)

  let real: string
  try {
    real = existsSync(absolute) ? realpathSync(absolute) : realpathDir(absolute)
  } catch {
    real = absolute
  }

  let workspaceReal: string
  try {
    workspaceReal = existsSync(ctx.workingDirectory)
      ? realpathSync(ctx.workingDirectory)
      : resolve(ctx.workingDirectory)
  } catch {
    workspaceReal = resolve(ctx.workingDirectory)
  }

  if (real.startsWith(workspaceReal + sep) || real === workspaceReal) {
    return absolute
  }

  for (const allowed of ALLOWED_EXTERNAL_DIRS) {
    const allowedReal = resolve(allowed)
    if (real.startsWith(allowedReal + sep) || real === allowedReal) {
      return absolute
    }
  }

  return null
}

function realpathDir(p: string): string {
  const separator = p.lastIndexOf(sep)
  if (separator <= 0) return p
  const dir = p.slice(0, separator)
  try {
    return resolve(realpathSync(dir), p.slice(separator + 1))
  } catch {
    return p
  }
}

const SECRET_PATTERNS = [
  /\.env$/,
  /\.env\.[a-z]+$/,
  /\.pem$/,
  /\.key$/,
  /^id_rsa/,
  /\/\.ssh\//,
  /credentials\./,
  /secrets\./,
  /\.secret$/,
  /\.token$/,
  /config\/credentials\./,
]

export function isSecretPath(filePath: string): boolean {
  const basename = filePath.split(sep).pop() || ""
  const lower = basename.toLowerCase()
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(lower) || pattern.test(filePath.toLowerCase())) {
      return true
    }
  }
  return false
}
