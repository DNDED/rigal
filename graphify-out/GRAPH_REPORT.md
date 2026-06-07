# Graph Report - argent  (2026-06-07)

## Corpus Check
- 110 files · ~48,578 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 722 nodes · 1485 edges · 38 communities (34 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f1e1df44`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]

## God Nodes (most connected - your core abstractions)
1. `ArgentEngine` - 90 edges
2. `theme` - 36 edges
3. `ConfigService` - 29 edges
4. `AuthStore` - 22 edges
5. `compilerOptions` - 22 edges
6. `SessionService` - 21 edges
7. `ToolDef` - 20 edges
8. `SwarmEngine` - 20 edges
9. `ProviderDescriptor` - 19 edges
10. `Message` - 17 edges

## Surprising Connections (you probably didn't know these)
- `ChatViewProps` --references--> `Message`  [EXTRACTED]
  packages/argent/src/ui/components/ChatView.tsx → packages/core/src/types.ts
- `ArgentEngine` --references--> `SwarmEngine`  [EXTRACTED]
  packages/argent/src/cli/engine.ts → packages/argent/src/cli/swarm.ts
- `ArgentEngine` --references--> `OAuthManager`  [EXTRACTED]
  packages/argent/src/cli/engine.ts → packages/integrations/src/oauth/index.ts
- `ArgentEngine` --references--> `ConfigService`  [EXTRACTED]
  packages/argent/src/cli/engine.ts → packages/core/src/services/config.ts
- `ArgentEngine` --references--> `PermissionService`  [EXTRACTED]
  packages/argent/src/cli/engine.ts → packages/core/src/services/permission.ts

## Import Cycles
- None detected.

## Communities (38 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (15): branchCommand(), lintCommand(), prCommand(), renameCommand(), specCommand(), Header(), HeaderProps, PermissionPromptProps (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (41): AuthStore, AuthStoreData, OAuthToken, sleep(), exchangeCodeForToken(), generatePKCE(), openBrowser(), startCallbackServer() (+33 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (59): ai21, alibaba, anthropic, anyscale, arcee, azure, azureOpenai, bedrock (+51 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (28): ALLOWED_EXTERNAL_DIRS, isSecretPath(), realpathDir(), resolveSafePath(), SECRET_PATTERNS, ToolRegistry, ToolContext, ToolDef (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (6): CommandHandler, ArgentEngine, ProviderDescriptor, CommandDef, ProviderConfig, repoRoot

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (27): deserializeSession(), ensureSessionsDir(), SerializedSession, serializeSession(), SessionService, createAnthropicProvider(), autoDetectProvider(), createProviderFromDescriptor() (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (12): diffCommand(), doctorCommand(), installCommand(), memoryCommand(), reasoningCommand(), renderReasoningList(), formatAuthLabel(), processSetupSelection() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (7): fixCommand(), issueCommand(), getFileIcon(), reviewCommand(), msToHuman(), statsCommand(), swarmCommand()

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (32): author, bin, argent, dependencies, effect, ink, ink-spinner, ink-text-input (+24 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (14): SwarmEngine, ConfigService, DEFAULT_AGENTS, DEFAULT_CONFIG, findClosingDelimiter(), loadDotEnv(), loadEnvFile(), loadJsoncFile() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (27): compilerOptions, allowImportingTsExtensions, baseUrl, exactOptionalPropertyTypes, jsx, jsxImportSource, lib, module (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (21): description, devDependencies, oxlint, prettier, @types/bun, typescript, engines, node (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): dependencies, solid-js, @solidjs/router, devDependencies, autoprefixer, postcss, @solidjs/start, tailwindcss (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (12): ChatView(), ChatViewProps, getMaxVisible(), HighlightedLine(), highlightTS(), MarkdownBlock, MarkdownContent(), MarkdownToken (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (16): 37 Providers, Agents, ARGENT, Building From Source, Commands, Configuration, curl (standalone binary), Features (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (27): App(), AppState, MODEL_PRICING, UIEvent, args, SwarmTask, ALL_COMMANDS, Command (+19 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (8): dependencies, effect, main, name, peerDependencies, effect, types, version

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (8): dependencies, effect, main, name, peerDependencies, effect, types, version

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (6): dependencies, effect, main, name, types, version

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): ARGENT Agents, Build Commands, Code Conventions, Project Structure

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (15): compactCommand(), modelCommand(), renderModelList(), PaletteAction, paletteCommand(), providerCommand(), renderProviderList(), SetupResult (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.20
Nodes (7): addToHistory(), commandHistory, historyCommand(), resumeCommand(), findCheckpoints(), rewindCommand(), testCommand()

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (5): paramsHash(), PermissionHandler, PermissionRequest, PermissionService, ToolPermission

### Community 31 - "Community 31"
Cohesion: 0.27
Nodes (8): oauthCommand(), renderOAuthHelp(), renderOAuthStatuses(), OAuthStatus, findProviderByEnvVar(), findProviderByModel(), getProvider(), PROVIDERS

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (3): analyzeCode(), explainCommand(), securityCommand()

### Community 33 - "Community 33"
Cohesion: 0.70
Nodes (4): countFiles(), generateAgentsMd(), getPackageManager(), initCommand()

### Community 34 - "Community 34"
Cohesion: 0.83
Nodes (3): contextCommand(), estimateTokens(), formatTokens()

### Community 35 - "Community 35"
Cohesion: 0.70
Nodes (4): compareVersions(), findCurrentVersion(), findVersionInAncestors(), updateCommand()

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (3): costCommand(), getModelPricing(), ModelPricing

## Knowledge Gaps
- **222 isolated node(s):** `MODEL_PRICING`, `AppState`, `Command`, `CommandPaletteProps`, `ALL_COMMANDS` (+217 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ArgentEngine` connect `Community 4` to `Community 0`, `Community 1`, `Community 34`, `Community 3`, `Community 36`, `Community 5`, `Community 6`, `Community 7`, `Community 32`, `Community 9`, `Community 37`, `Community 33`, `Community 35`, `Community 15`, `Community 28`, `Community 29`, `Community 30`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `ProviderDescriptor` connect `Community 4` to `Community 1`, `Community 2`, `Community 36`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 15`, `Community 20`, `Community 28`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `OAuthManager` connect `Community 1` to `Community 4`, `Community 31`, `Community 7`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `MODEL_PRICING`, `AppState`, `Command` to the rest of the system?**
  _222 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05593607305936073 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._