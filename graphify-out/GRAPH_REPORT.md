# Graph Report - argent  (2026-06-06)

## Corpus Check
- 107 files · ~41,970 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 696 nodes · 1399 edges · 28 communities (25 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7bfd10c5`
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

## God Nodes (most connected - your core abstractions)
1. `ArgentEngine` - 82 edges
2. `theme` - 35 edges
3. `ConfigService` - 27 edges
4. `AuthStore` - 22 edges
5. `compilerOptions` - 22 edges
6. `SessionService` - 20 edges
7. `ToolDef` - 20 edges
8. `SwarmEngine` - 19 edges
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

## Communities (28 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (62): branchCommand(), compactCommand(), contextCommand(), estimateTokens(), formatTokens(), costCommand(), getModelPricing(), ModelPricing (+54 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (40): AuthStore, AuthStoreData, OAuthToken, sleep(), exchangeCodeForToken(), generatePKCE(), openBrowser(), startCallbackServer() (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (63): ai21, alibaba, alibabaCoding, anthropic, anyscale, arcee, azure, azureOpenai (+55 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (25): ALLOWED_EXTERNAL_DIRS, isSecretPath(), realpathDir(), resolveSafePath(), SECRET_PATTERNS, ToolRegistry, ToolContext, ToolDef (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (5): CommandHandler, ArgentEngine, ProviderDescriptor, CommandDef, ProviderConfig

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (13): PermissionHandler, PermissionRequest, PermissionService, deserializeSession(), ensureSessionsDir(), SerializedSession, serializeSession(), SESSIONS_DIR (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (29): App(), AppState, MODEL_PRICING, UIEvent, args, showHelp, formatAuthLabel(), processSetupSelection() (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (19): SwarmEngine, SwarmTask, createAnthropicProvider(), autoDetectProvider(), createProviderFromDescriptor(), createProviderFromEnv(), ProviderCredentials, createGeminiProvider() (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (36): author, bin, argent, dependencies, effect, ink, ink-spinner, ink-text-input (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (11): ConfigService, DEFAULT_AGENTS, DEFAULT_CONFIG, loadDotEnv(), loadEnvFile(), loadJsoncFile(), parseFrontmatter(), parseMinimalYaml() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (27): compilerOptions, allowImportingTsExtensions, baseUrl, exactOptionalPropertyTypes, jsx, jsxImportSource, lib, module (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (23): oxlint, prettier, @types/bun, typescript, bun, description, devDependencies, engines (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (19): dependencies, @argent/ui, solid-js, @solidjs/router, devDependencies, autoprefixer, postcss, @solidjs/start (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (9): ChatView(), ChatViewProps, MarkdownBlock, MarkdownContent(), MarkdownToken, parseInlineMarkdown(), parseMarkdownBlocks(), SyntaxHighlightedCode() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (16): 37 Providers, Agents, ARGENT, Building From Source, Commands, Configuration, curl (standalone binary), Features (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.27
Nodes (8): oauthCommand(), renderOAuthHelp(), renderOAuthStatuses(), OAuthStatus, findProviderByEnvVar(), findProviderByModel(), getProvider(), PROVIDERS

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (9): dependencies, @argent/core, effect, main, name, peerDependencies, effect, types (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (8): dependencies, effect, main, name, peerDependencies, effect, types, version

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (8): dependencies, @argent/core, @argent/llm, effect, main, name, types, version

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): ARGENT Agents, Build Commands, Code Conventions, Project Structure

## Knowledge Gaps
- **228 isolated node(s):** `name`, `version`, `private`, `description`, `workspaces` (+223 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ArgentEngine` connect `Community 4` to `Community 0`, `Community 1`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 9`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `ProviderDescriptor` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`, `Community 6`, `Community 7`, `Community 20`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `OAuthManager` connect `Community 1` to `Community 0`, `Community 4`, `Community 15`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _228 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.061275831087151844 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0547945205479452 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03125 - nodes in this community are weakly interconnected._