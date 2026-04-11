# RESTless — Source Tree Analysis

This document describes the structure of the RESTless source tree, the purpose of each directory and file, and the two entry points that govern library and UI usage.

---

## Root Layout

```
RESTless/
├── docs/                        # Project documentation
├── public/                      # Static assets served by Vite dev server
│   ├── data/
│   │   └── db.json              # Seed data loaded into the in-memory database on startup
│   └── img/
│       └── screenshot.jpg       # Screenshot used in project documentation
├── src/                         # All TypeScript source code
├── eslint.config.mjs            # ESLint 9 flat-config file
├── index.html                   # HTML shell for the demo/UI application (Vite entry)
├── package.json                 # Project manifest, scripts, and devDependency declarations
├── pnpm-lock.yaml               # Lockfile managed by pnpm 9
├── tsconfig.json                # TypeScript 5.7 compiler configuration
└── vite.config.ts               # Vite 6.2 build and dev-server configuration
```

---

## `src/` — Source Directory

### Top-level source files

| File | Purpose |
|---|---|
| `src/index.ts` | **Library entry point.** Re-exports the public API surface consumed by downstream packages or browser `<script>` tags. Nothing UI-specific is exported here. |
| `src/main.ts` | **Demo/UI entry point.** Bootstraps the interactive demo application rendered in `index.html`. Imports `style.css` and initialises the UI layer. |
| `src/style.css` | Global stylesheet for the demo application. |
| `src/vite-env.d.ts` | Vite client-type declarations (e.g., `import.meta.env`). Required for TypeScript to understand Vite-specific globals. |

---

### `src/api/` — HTTP API Layer

Thin layer that maps HTTP verbs and URL patterns to business logic in `core/`.

| File | Purpose |
|---|---|
| `endpoints.ts` | Defines REST route handlers for all resource endpoints (CRUD operations). Receives a parsed request object, delegates to the database and query engine, and returns a response object. |
| `middlewares.ts` | Implements the request middleware pipeline. Responsibilities include CORS headers, content-type negotiation, and any cross-cutting concerns that apply before a route handler is invoked. |

---

### `src/core/` — Core Engine

The central business logic of RESTless. All files in this directory are covered by the test suite and the coverage threshold configuration.

#### `src/core/db.ts`

The in-memory database. Maintains resource collections as plain JavaScript objects, delegates persistence to a `StorageAdapter`, and exposes CRUD primitives used by the API layer.

#### `src/core/router.ts`

URL pattern matching router. Parses incoming request paths, matches them against registered route patterns (including dynamic segments such as `:id`), and dispatches to the correct handler with extracted path parameters.

#### `src/core/server.ts`

Main server class. Acts as the composition root for the core engine: wires together the router, database, middleware pipeline, schema registry, and storage adapter. Exposes a single `handle(request)` method that processes a simulated HTTP request end-to-end.

#### `src/core/types.ts`

Shared TypeScript type definitions used across the core layer (request/response shapes, resource records, configuration interfaces).

---

#### `src/core/query/` — Query Engine

Responsible for interpreting and applying URL query strings to data sets.

| File | Purpose |
|---|---|
| `types.ts` | Type definitions specific to the query subsystem (parsed query AST, filter operators, sort descriptors). |
| `QueryParser.ts` | Parses a raw query string into a structured representation that the processor can evaluate. Handles operators, field paths, and pagination parameters. |
| `QueryProcessor.ts` | Applies a parsed query against an in-memory collection. Implements filtering, multi-field sorting, and offset/limit pagination. |
| `index.ts` | Barrel export for the `query/` subsystem. |
| `QueryParser.test.ts` | Unit tests for `QueryParser`. Covers a range of operator syntaxes and edge cases. |
| `QueryProcessor.test.ts` | Unit tests for `QueryProcessor`. Covers filter combinations, sort stability, and boundary conditions for pagination. |

---

#### `src/core/schema/` — Schema & Validation

Provides schema definition storage, field-level validation, and referential integrity enforcement.

| File | Purpose |
|---|---|
| `types.ts` | Type definitions for schema descriptors, field rules, and validation results. |
| `SchemaRegistry.ts` | Stores and retrieves resource schema definitions. Acts as the single source of truth for what fields and constraints a resource must satisfy. |
| `SchemaValidator.ts` | Validates a resource record against its registered schema. Evaluates field types, required fields, format constraints, and custom rules. |
| `RelationManager.ts` | Enforces referential integrity between resources. Prevents creation of orphaned references and optionally cascades deletes. |
| `index.ts` | Barrel export for the `schema/` subsystem. |
| `SchemaValidator.test.ts` | Unit tests for `SchemaValidator`. Covers valid records, missing required fields, type mismatches, and format violations. |

---

#### `src/core/storage/` — Storage Adapters

Abstracts the persistence mechanism behind a common interface, allowing the database to be storage-agnostic.

| File | Purpose |
|---|---|
| `StorageAdapter.ts` | Abstract base class (or interface) defining the contract: `read()`, `write(data)`, and `clear()`. All concrete adapters implement this contract. |
| `LocalStorageAdapter.ts` | Concrete adapter that persists data to the browser's `localStorage` API. Suitable for small datasets and simple demos. |
| `IndexedDBAdapter.ts` | Concrete adapter that persists data to IndexedDB. Suitable for larger datasets requiring asynchronous, structured storage. |
| `index.ts` | Barrel export for the `storage/` subsystem. |

---

#### `src/core/utils/` — Utility Modules

General-purpose utilities used across the core layer.

| File | Purpose |
|---|---|
| `HashUtils.ts` | Hashing utilities for generating deterministic identifiers from data (e.g., content-based IDs or ETags). |
| `DataExporter.ts` | Exports in-memory resource collections to JSON or CSV format. Consumed by the UI data management panel. |
| `DataExporter.test.ts` | Unit tests for `DataExporter`. Covers JSON serialisation and CSV formatting, including edge cases for special characters and empty collections. |

---

### `src/schemas/` — Default Schema Definitions

| File | Purpose |
|---|---|
| `index.ts` | Ships the built-in schema definitions that pre-populate `SchemaRegistry` on startup. These schemas correspond to the seed data in `public/data/db.json`. |

---

### `src/ui/` — Demo UI

Interactive application used to demonstrate and manually test the RESTless engine in the browser. Not included in the library build output.

| File | Purpose |
|---|---|
| `app.ts` | Bootstraps the demo application: mounts components, initialises the server instance, and wires event listeners. |
| `components/Component.ts` | Abstract base class for all UI components. Provides lifecycle hooks and a minimal DOM-binding contract. |
| `components/ApiConsole.ts` | Interactive API testing console. Allows users to compose requests, send them through the RESTless server, and inspect the response — all in the browser. |
| `components/DataManager.ts` | Data management panel. Displays current resource collections, allows manual edits, and triggers data export via `DataExporter`. |
| `components/index.ts` | Barrel export for all UI components. |

---

## Entry Points

### Library Entry Point — `src/index.ts`

When the project is built in library mode (`vite build`), Vite uses this file as the entry point. It produces two output formats in `dist/`:

- **ES module** (`dist/restless.es.js`) — for modern bundlers and native ESM environments.
- **UMD bundle** (`dist/restless.umd.js`) — for legacy environments and CDN inclusion via `<script>`.

Only symbols explicitly exported from `src/index.ts` become part of the public API. The UI layer (`src/ui/`, `src/main.ts`) is intentionally excluded.

### Demo/UI Entry Point — `src/main.ts`

Used exclusively by the Vite dev server (`pnpm dev`) and the preview command (`pnpm preview`). Renders the interactive demo in `index.html`. This file is not included in the library bundle.
