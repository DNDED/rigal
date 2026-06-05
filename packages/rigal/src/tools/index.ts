export { bashTool } from "./bash.js"
export { readTool } from "./read.js"
export { writeTool } from "./write.js"
export { editTool } from "./edit.js"
export { globTool } from "./glob.js"
export { grepTool } from "./grep.js"
export { webfetchTool } from "./webfetch.js"

import { bashTool } from "./bash.js"
import { readTool } from "./read.js"
import { writeTool } from "./write.js"
import { editTool } from "./edit.js"
import { globTool } from "./glob.js"
import { grepTool } from "./grep.js"
import { webfetchTool } from "./webfetch.js"
import type { ToolDef } from "@rigal/core"

export const builtinTools: ToolDef[] = [
  bashTool,
  readTool,
  writeTool,
  editTool,
  globTool,
  grepTool,
  webfetchTool,
]
