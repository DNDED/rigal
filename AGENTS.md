# RIGAL Agents

This file provides instructions for RIGAL when working in this repository.

## Build Commands
- `bun run build` — Build all packages
- `bun run typecheck` — Type-check all packages
- `bun test` — Run all tests
- `bun packages/rigal/dist/main.js` — Run RIGAL from source

## Project Structure
- `packages/core/` — Effect-TS engine: types, session, config, permissions
- `packages/llm/` — Provider abstraction: Anthropic, OpenAI, Ollama
- `packages/integrations/` — Descriptor-first provider definitions
- `packages/rigal/` — CLI/TUI entrypoint (the rigal binary)
- `packages/rigal/src/tools/` — Built-in tool implementations
- `packages/rigal/src/ui/` — Premium TUI components
- `packages/rigal/src/cli/` — Engine, commands, main app
- `packages/app/` — SolidJS web app (future)
- `packages/desktop/` — Electron desktop (future)

## Code Conventions
- TypeScript with ESNext target
- No semicolons (prettier config)
- Effect-TS for core services
- React + Ink for terminal UI
- SolidJS for web UI
- Tool definitions as pure async functions
- Follow existing patterns in packages/rigal/src/tools/
