---
project_name: 'RESTless'
user_name: 'Devalexanderdaza'
date: '2026-04-11'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 48
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Runtime:** Browser-only (zero runtime dependencies)
- **Language:** TypeScript ~5.7.2 (strict mode enabled)
- **Bundler:** Vite ^6.2.0 (ES modules, path alias `@` → `src/`)
- **Testing:** Vitest ^2.1.9 + @vitest/coverage-v8 ^2.1.9
- **Linting:** ESLint ^9.23.0 (flat config) + @typescript-eslint ^8.28.0
- **Formatting:** Prettier ^3.5.3
- **Package Manager:** pnpm >=9.0.0 (pinned 9.2.0)
- **Node:** >=18.0.0
- **Target:** ES2020 + DOM APIs (localStorage, IndexedDB, Web Crypto)
- **Module System:** ESNext with bundler resolution

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Strict mode is ON:** `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` — code with unused vars will NOT compile
- **Explicit return types:** ESLint warns on missing return types (`@typescript-eslint/explicit-function-return-type: "warn"`)
- **`any` is allowed:** `@typescript-eslint/no-explicit-any: "off"` — but unsafe assignments warn
- **Unused args pattern:** Prefix with `_` to suppress errors (`argsIgnorePattern: "^_"`)
- **`===` only:** `eqeqeq: "error"` — no loose equality allowed
- **`const` enforced:** `prefer-const: "error"` — use `let` only when reassignment is needed
- **No `console.log`:** Only `console.warn` and `console.error` are allowed
- **Import style:** Named imports with explicit paths; use `@/` alias for src-relative imports
- **Class-based architecture:** Core modules use classes (Server, Database, Router, QueryParser, etc.) — not functional style
- **Error messages in Spanish:** Existing error strings use Spanish (e.g., `"Error al guardar en localStorage"`) — maintain consistency
- **Interface-driven contracts:** StorageAdapter, RouteHandler, Middleware defined as interfaces in `types.ts` — implement, don't deviate

### Architecture & Framework Rules

- **Layered architecture (3-tier):** UI → API → Core — dependency direction is UNIDIRECTIONAL, never reverse
- **Core layer has NO DOM access:** `src/core/` must never import from `src/ui/` or touch the DOM
- **API layer is pure logic:** `src/api/endpoints.ts` handlers receive Request, return Response — no side effects outside Database
- **UI layer uses direct DOM manipulation:** No virtual DOM, no framework — `document.createElement()` pattern
- **Router uses middleware chain:** Middlewares execute in order; error handler wraps the full chain
- **StorageAdapter pattern:** Database is storage-agnostic via `StorageAdapter` interface — LocalStorage and IndexedDB implementations exist
- **SchemaRegistry is a singleton:** Access via `SchemaRegistry.getInstance()` — never instantiate directly
- **Request lifecycle:** UI → Server.handleRequest() → Router.handleRequest() → Middleware chain → Route handler → Database → Response
- **Static utility methods:** QueryParser and SchemaValidator use static methods (e.g., `QueryParser.parseQueryParams()`) — don't instantiate
- **Path alias:** Vite resolves `@/` to `src/` — use for cross-layer imports

### Testing Rules

- **Framework:** Vitest with `globals: true` — no need to import `describe`, `it`, `expect`
- **Test location:** Co-located with source as `src/**/*.test.ts` (e.g., `QueryParser.test.ts` next to `QueryParser.ts`)
- **Environment:** Node (not jsdom) — UI components are NOT tested
- **Coverage scope:** Only `src/core/**/*.ts` is measured — UI and entry points are excluded
- **Coverage provider:** v8 (not istanbul)
- **Current state:** 81 tests across 4 files — QueryParser, QueryProcessor, SchemaValidator, DataExporter have 86-98% coverage; Database, Router, Server, Storage, Endpoints have 0%
- **Test style:** `describe` blocks per feature/method, `it` blocks for specific behaviors
- **No mocking of storage in existing tests:** Tests use direct class instantiation with real data structures
- **Run tests:** `pnpm test` (single run), `pnpm test:watch` (watch mode), `pnpm test:coverage` (with coverage)

### Code Quality & Style Rules

- **Prettier enforced:** 100 char line width, 2-space indent, single quotes, trailing commas (es5), LF line endings, always parentheses on arrow params
- **ESLint flat config:** `eslint.config.mjs` — do NOT create `.eslintrc` files
- **File naming:** PascalCase for classes (`QueryParser.ts`, `SchemaValidator.ts`), camelCase for non-class modules (`endpoints.ts`, `middlewares.ts`), lowercase for entry points (`main.ts`, `index.ts`)
- **Type definitions:** Centralized in `types.ts` files per module (`src/core/types.ts`, `src/core/query/types.ts`, `src/core/schema/types.ts`)
- **Exports:** `src/index.ts` is the library's public API — re-exports Server, Database, Router, App, and UI components
- **No barrel exports per subfolder:** Only the root `index.ts` aggregates exports
- **EditorConfig present:** 2 spaces, UTF-8, LF — editors should auto-detect
- **Format command:** `pnpm format` runs Prettier on `src/**/*.ts`
- **Lint command:** `pnpm lint` runs ESLint on `src --ext .ts`

### Development Workflow Rules

- **Commit format:** Conventional Commits — `type: description` (feat, fix, docs, style, refactor, perf, test, chore)
- **No AI attribution in commits:** Never add "Co-Authored-By" or AI co-author lines
- **Branch strategy:** `main` (stable), `develop` (integration), feature branches from develop: `feature/name`, `bugfix/name`, `docs/name`
- **Package manager:** pnpm ONLY — do not use npm or yarn
- **No CI/CD:** No GitHub Actions configured — tests run locally
- **Build:** `pnpm build` runs `tsc && vite build` — TypeScript compiles first, then Vite bundles
- **Never build after changes:** Run lint/test but do not trigger builds automatically

### Critical Don't-Miss Rules

- **XSS vulnerability:** UI layer uses `innerHTML` with user-controlled data — sanitize ALL user input before DOM insertion. This is a KNOWN issue
- **ReDoS risk:** Schema regex pattern compilation can hang on crafted input — validate regex complexity before compiling
- **CSV injection:** DataExporter does not escape formula-triggering characters (`=`, `+`, `-`, `@`) — prefix with `'` when exporting user data
- **SchemaRegistry singleton leaks between tests:** Call `SchemaRegistry.getInstance()` carefully — state persists across test runs unless manually cleared
- **No runtime dependencies allowed:** This project runs 100% in-browser with zero npm runtime deps — never add a runtime dependency
- **Mixed language codebase:** Code comments and error messages are in Spanish, documentation and variable/class names are in English — maintain this convention
- **Storage adapters are async:** IndexedDB operations return Promises — always await storage calls even if LocalStorage adapter is synchronous
- **Double-underscore delimiter:** QueryParser uses `__` as field/operator delimiter (e.g., `price__gt=100`) — do not change this convention
- **No `eval()` or dynamic code execution:** The project has zero instances — keep it that way
- **Dependency direction is sacred:** Core NEVER imports from API or UI. API NEVER imports from UI. Violations break the architecture

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-04-11
