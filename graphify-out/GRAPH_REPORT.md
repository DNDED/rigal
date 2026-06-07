# Graph Report - argent  (2026-06-07)

## Corpus Check
- 108 files · ~47,161 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 708 nodes · 1461 edges · 31 communities (28 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c685b8c6`
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
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `ArgentEngine` - 87 edges
2. `theme` - 35 edges
3. `ConfigService` - 27 edges
4. `AuthStore` - 22 edges
5. `compilerOptions` - 22 edges
6. `SessionService` - 21 edges
7. `SwarmEngine` - 20 edges
8. `ToolDef` - 20 edges
9. `ProviderDescriptor` - 19 edges
10. `Message` - 17 edges

## Surprising Connections (you probably didn't know these)
- `ChatViewProps` --references--> `Message`  [EXTRACTED]
  packages/argent/src/ui/components/ChatView.tsx → packages/core/src/types.ts
- `CommandHandler` --references--> `ArgentEngine`  [EXTRACTED]
  packages/argent/src/cli/commands.ts → packages/argent/src/cli/engine.ts
- `CommandHandler` --references--> `CommandDef`  [EXTRACTED]
  packages/argent/src/cli/commands.ts → packages/core/src/services/config.ts
- `ArgentEngine` --references--> `SwarmEngine`  [EXTRACTED]
  packages/argent/src/cli/engine.ts → packages/argent/src/cli/swarm.ts
- `ArgentEngine` --references--> `OAuthManager`  [EXTRACTED]
  packages/argent/src/cli/engine.ts → packages/integrations/src/oauth/index.ts

## Import Cycles
- None detected.

## Communities (31 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (7): Header(), HeaderProps, SetupStep, SetupWizardProps, WelcomeScreen(), gradient(), multiGradient()

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (45): oauthCommand(), renderOAuthHelp(), renderOAuthStatuses(), AuthStore, AuthStoreData, OAuthToken, sleep(), exchangeCodeForToken() (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (59): ai21, alibaba, anthropic, anyscale, arcee, azure, azureOpenai, bedrock (+51 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (37): SwarmTask, ALLOWED_EXTERNAL_DIRS, isSecretPath(), realpathDir(), resolveSafePath(), SECRET_PATTERNS, ToolRegistry, getProvider() (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (4): ArgentEngine, ProviderDescriptor, ProviderConfig, repoRoot

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (7): deserializeSession(), ensureSessionsDir(), SerializedSession, serializeSession(), SessionService, ModelRef, Session

### Community 6 - "Community 6"
Cohesion: 0.43
Nodes (6): formatCompact(), formatCost(), getContextWindow(), StatusBar(), StatusBarProps, STREAM_FRAMES

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (27): App(), AppState, MODEL_PRICING, UIEvent, args, ALL_COMMANDS, Command, CommandPalette() (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (32): author, bin, argent, dependencies, effect, ink, ink-spinner, ink-text-input (+24 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (13): CommandDef, ConfigService, DEFAULT_AGENTS, DEFAULT_CONFIG, findClosingDelimiter(), loadDotEnv(), loadEnvFile(), loadJsoncFile() (+5 more)

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

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (3): GatewayDescriptor, findProviderByEnvVar(), findProviderByModel()

### Community 28 - "Community 28"
Cohesion: 0.05
Nodes (65): CommandHandler, branchCommand(), compactCommand(), contextCommand(), estimateTokens(), formatTokens(), costCommand(), getModelPricing() (+57 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (5): paramsHash(), PermissionHandler, PermissionRequest, PermissionService, ToolPermission

### Community 35 - "Community 35"
Cohesion: 0.70
Nodes (4): compareVersions(), findCurrentVersion(), findVersionInAncestors(), updateCommand()

## Knowledge Gaps
- **219 isolated node(s):** `name`, `version`, `private`, `description`, `dev` (+214 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ArgentEngine` connect `Community 4` to `Community 0`, `Community 1`, `Community 3`, `Community 35`, `Community 5`, `Community 7`, `Community 9`, `Community 28`, `Community 29`, `Community 30`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `ProviderDescriptor` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 7`, `Community 20`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `OAuthManager` connect `Community 1` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _219 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.051615051615051616 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06784260515603799 - nodes in this community are weakly interconnected._