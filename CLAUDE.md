# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RESTless is a browser-only REST API simulator — a json-server replacement with zero backend. All data persists in localStorage or IndexedDB. Built with TypeScript + Vite, ships as both ES module and UMD library.

## Commands

```bash
pnpm dev              # Dev server on port 3000
pnpm build            # TypeScript check + Vite build (lib mode → dist/)
pnpm test             # Vitest run (node environment)
pnpm test:watch       # Vitest watch mode
pnpm test:coverage    # Coverage via v8 (covers src/core/**)
pnpm lint             # ESLint (TS files in src/)
pnpm format           # Prettier write
```

## Architecture

**Core layer** (`src/core/`) — the runtime engine, no DOM dependencies:
- `Server` — entry point: holds Router + Database, processes requests via `handleRequest(method, url, headers, body)`
- `Router` — Express-style route matching with middleware chain (applied in reverse order). Routes use `:param` syntax.
- `Database` — in-memory data store backed by a `StorageAdapter`. Supports collection CRUD, advanced queries (filter groups, pagination, sorting via `QueryProcessor`), and storage hot-swap between localStorage/IndexedDB.
- `storage/` — Strategy pattern: `StorageAdapter` interface with `LocalStorageAdapter` and `IndexedDBAdapter` implementations.
- `query/` — `QueryParser` (parses URL query strings into `QueryOptions`) and `QueryProcessor` (applies filters, sort, pagination).
- `schema/` — `SchemaRegistry` (singleton), `SchemaValidator`, `RelationManager` for data validation and relations.

**API layer** (`src/api/`) — registers CRUD endpoints and middlewares (error handler, logger, delay) on the Router.

**UI layer** (`src/ui/`) — vanilla TS DOM components (`App`, `ApiConsole`, `DataManager`). Not covered by tests.

**Library entry** (`src/index.ts`) — public API exports. **App entry** (`src/main.ts`) — boots the demo app with sample data.

## Key Patterns

- **No external runtime deps** — everything is browser-native (localStorage, IndexedDB, DOM APIs).
- **Storage adapter pattern** — `Database` delegates persistence through `StorageAdapter` interface; adding a new backend means implementing `load/save/remove`.
- **Middleware chain** — middlewares wrap handlers bottom-up (reverse iteration). Each middleware calls `next(req)` to continue.
- **ID auto-increment** — `Database.add()` assigns `id = max(existing ids) + 1` when no id provided.
- **Library build** — Vite lib mode outputs `dist/restless.es.js` and `dist/restless.umd.js`. The `@` alias maps to `src/`.

## Testing

Tests live alongside source files as `*.test.ts`. Test environment is `node` (not jsdom). Coverage targets `src/core/**` only. Current test files:
- `src/core/query/QueryProcessor.test.ts`
- `src/core/query/QueryParser.test.ts`
- `src/core/schema/SchemaValidator.test.ts`
- `src/core/utils/DataExporter.test.ts`

## Lint Rules of Note

- `@typescript-eslint/no-explicit-any`: OFF (any is used throughout for flexibility)
- `@typescript-eslint/explicit-function-return-type`: WARN
- `no-console`: WARN (allow warn/error)
- Unused vars with `_` prefix are allowed
- Strict TypeScript: `strict`, `noUnusedLocals`, `noUnusedParameters`
