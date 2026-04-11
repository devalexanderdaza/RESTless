# RESTless — Project Overview

**Version:** 1.5.0
**License:** MIT
**Author:** Alexander Daza

---

## Executive Summary

RESTless is a complete REST API simulator that runs entirely in the browser, with no server-side dependencies and no Node.js runtime required at runtime. It is designed as a drop-in replacement for tools such as `json-server`, targeting frontend developers who need a fully functional REST backend during prototyping, testing, or offline development.

The library exposes a standard HTTP-like interface for CRUD operations, supports advanced querying capabilities (pagination, filtering, sorting, full-text search, and cursor-based pagination), enforces schema validation and referential integrity, and persists data through browser-native storage APIs. An optional visual dashboard provides data exploration and API testing without leaving the browser.

---

## Tech Stack

| Concern | Technology | Notes |
|---|---|---|
| Language | TypeScript 5.7 | Strict mode, full type coverage |
| Build tool | Vite 6.2 | Output: ES module + UMD library bundle |
| Test runner | Vitest 2.1 | Unit and integration tests |
| Package manager | pnpm 9 | Node >= 18 required for development |
| Runtime dependencies | None | Zero external runtime dependencies |
| Storage backends | localStorage, IndexedDB | Switchable at runtime |
| Target environment | Browser | No Node.js at runtime |

---

## Architecture Overview

RESTless follows a layered architecture organized around three principal concerns: the core engine, the API surface, and the optional UI layer.

```
src/
  core/       — Engine: server, router, database, query, schema, storage, utils
  api/        — Endpoints and request/response middlewares
  ui/         — Visual dashboard: app shell and components
  schemas/    — Default schema definitions shipped with the library
  index.ts    — Library entry point (programmatic API)
  main.ts     — UI entry point (dashboard application)
```

### Core Layer (`src/core/`)

The core layer contains all domain logic and is framework-agnostic:

- **Server** — Bootstraps the simulator, wires router and storage.
- **Router** — Dispatches incoming virtual requests to registered endpoint handlers.
- **DB** — In-memory data store; coordinates reads and writes against the active storage adapter.
- **Query** — Parser and processor for query-string parameters (filtering, sorting, pagination, full-text search, cursor pagination).
- **Schema** — Validator, registry, and relation resolver. Enforces types, ranges, enums, regex patterns, and custom validators. Handles referential integrity strategies (cascade, restrict, setNull, setDefault).
- **Storage adapters** — Pluggable adapters for `localStorage` and `IndexedDB`; switchable at runtime without data loss.
- **Utils** — Shared utilities (ID generation, deep clone, error normalization, etc.).

### API Layer (`src/api/`)

Implements the REST endpoint surface and request lifecycle middlewares. Each resource automatically receives:

- `GET /resource` — List with filtering, sorting, and pagination
- `GET /resource/:id` — Single record retrieval
- `POST /resource` — Create with schema validation
- `PUT /resource/:id` — Full replacement
- `PATCH /resource/:id` — Partial update
- `DELETE /resource/:id` — Delete with referential integrity enforcement
- `GET /_schemas` — Schema introspection endpoint

### UI Layer (`src/ui/`)

An optional visual dashboard built on a lightweight custom component base:

- **ApiConsole** — Interactive HTTP request builder and response inspector.
- **DataManager** — Table-based data viewer with import/export (JSON and CSV) and inline editing.
- **Component base** — Minimal reactive component abstraction; no external UI framework dependency.

---

## Key Features

### REST CRUD

Full create, read, update, and delete support over virtual HTTP endpoints. All standard HTTP verbs are handled. Responses follow conventional REST semantics including status codes and error payloads.

### Advanced Querying

Query strings are parsed and processed by the Query engine:

- **Filtering** — Equality, comparison operators, and nested field access.
- **Sorting** — Single and multi-field, ascending and descending.
- **Pagination** — Offset/limit and cursor-based strategies.
- **Full-text search** — Across specified fields within a collection.

### Schema Validation

Each resource collection is backed by a schema definition that specifies:

- Field types (string, number, boolean, array, object)
- Range constraints (min, max, minLength, maxLength)
- Enumerated value sets
- Regular expression patterns
- Custom validator functions

Validation is applied on write operations (POST, PUT, PATCH) before data reaches the store.

### Referential Integrity

Relations between collections are declared in schemas. On delete, the configured strategy is enforced:

- **cascade** — Delete related records automatically.
- **restrict** — Reject the delete if related records exist.
- **setNull** — Nullify the foreign key in related records.
- **setDefault** — Reset the foreign key to a declared default value.

### Schema Introspection

The `/_schemas` endpoint exposes the full schema registry at runtime, enabling tooling and clients to discover available resources, field types, and constraints programmatically.

### Pluggable Storage

The active storage backend can be switched between `localStorage` and `IndexedDB` at runtime. Both adapters implement a common interface, making it straightforward to add new backends.

### Visual Dashboard

An optional browser UI (loaded via `src/main.ts`) provides:

- Data table browsing, filtering, and inline editing
- An API console for ad-hoc request testing
- JSON and CSV import/export for seed data management

---

## Repository Structure

```
RESTless/
  src/
    core/           Engine modules (server, router, db, query, schema, storage, utils)
    api/            Endpoint handlers and middlewares
    ui/             Dashboard application and components
    schemas/        Built-in schema definitions
    index.ts        Library entry point
    main.ts         Dashboard entry point
  docs/             Project documentation
  tests/            Test suites (Vitest)
  package.json      Package manifest (pnpm)
  vite.config.ts    Build configuration (ES + UMD output)
  tsconfig.json     TypeScript configuration
```

---

## Related Documentation

- [Architecture](./architecture.md) — Detailed component diagram, data flow, and design decisions.
- [Development Guide](./development-guide.md) — Setup, scripts, conventions, and contribution workflow.
- [API Reference](./api-reference.md) — Full endpoint specification, query parameters, and response formats.
- [Schema Guide](./schema-guide.md) — Schema definition syntax, validation rules, and relation configuration.
- [Storage Adapters](./storage-adapters.md) — Adapter interface, switching strategies, and custom adapter authoring.
- [UI Dashboard](./ui-dashboard.md) — Dashboard setup, configuration, and component reference.
