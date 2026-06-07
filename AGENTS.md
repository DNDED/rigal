# ARGENT Agents

This file provides instructions for ARGENT when working in this repository.

## Build Commands
- `bun run build` — Build all packages
- `bun run typecheck` — Type-check all packages
- `bun test` — Run all tests
- `bun packages/argent/dist/main.js` — Run ARGENT from source

## Project Structure
- `packages/core/` — Effect-TS engine: types, session, config, permissions
- `packages/llm/` — Provider abstraction: Anthropic, OpenAI, Ollama
- `packages/integrations/` — Descriptor-first provider definitions
- `packages/argent/` — CLI/TUI entrypoint (the argent binary)
- `packages/argent/src/tools/` — Built-in tool implementations
- `packages/argent/src/ui/` — Premium TUI components
- `packages/argent/src/cli/` — Engine, commands, main app

## Code Conventions
- TypeScript with ESNext target
- No semicolons (prettier config)
- Effect-TS for core services
- React + Ink for terminal UI
- SolidJS for web UI
- Tool definitions as pure async functions
- Follow existing patterns in packages/argent/src/tools/
