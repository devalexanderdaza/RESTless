# RESTless — Architecture Documentation

## 1. Executive Summary

RESTless is a fully browser-native REST API simulation library written in TypeScript. It provides a complete RESTful API experience — including HTTP method routing, schema validation, relational data integrity, and persistent storage — without any server-side runtime or external dependencies. It is designed as a zero-infrastructure replacement for tools such as `json-server`, operating entirely within the browser environment.

The library is packaged as both an ES module and a UMD bundle, making it usable in any modern frontend project. It ships at version 1.5.0 with MIT license, and targets Node.js >= 18 as the development toolchain (Vite + TypeScript).

Key capabilities:
- In-memory data store with pluggable persistence (localStorage or IndexedDB)
- Full CRUD endpoint registration over dynamic, schema-less or schema-validated collections
- Advanced query processing: filtering with comparison and logical operators, multi-field sorting, offset-based and cursor-based pagination, and full-text search
- Schema definitions with type validation, constraints, transforms, default values, and optional automatic timestamps
- Relational integrity across collections: one-to-one, one-to-many, many-to-one, many-to-many, with cascade / restrict / setNull / setDefault actions on delete and update
- Middleware pipeline (logger, error handler, network delay simulation)
- Data export and import in JSON and CSV formats

---

## 2. Architecture Pattern

RESTless follows a **layered architecture** with clear separation of concerns, applied to a browser-only runtime context:

```
Presentation Layer   →  UI App + Components
API Layer            →  Endpoints + Middlewares
Core Layer           →  Server, Router, Database
Domain Layer         →  Schema (types, validator, registry, relation manager)
Query Layer          →  QueryParser, QueryProcessor
Storage Layer        →  StorageAdapter interface, LocalStorageAdapter, IndexedDBAdapter
Utility Layer        →  HashUtils, DataExporter
```

Secondary patterns in use:

- **Adapter Pattern** — `StorageAdapter` is an interface with two concrete implementations (`LocalStorageAdapter`, `IndexedDBAdapter`), enabling hot-swapping of the persistence backend at runtime without changing higher-level code.
- **Singleton Pattern** — `SchemaRegistry` uses a private static instance to provide a single, globally accessible schema registry throughout the application lifecycle.
- **Chain of Responsibility** — The middleware pipeline in `Router` builds a composed handler chain, executed in reverse-registration order, wrapping each handler with the next, identical to Express-style middleware stacking.
- **Registry Pattern** — `SchemaRegistry` acts as a central registry that both stores schema definitions and coordinates with `RelationManager`, ensuring consistency between registered schemas and database operations.
- **Strategy Pattern** — `Database.createAdapter()` selects a `StorageAdapter` implementation based on the `StorageType` enum, delegating persistence behavior to the chosen strategy.

---

## 3. System Components Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        Consumer / UI Layer                         │
│                    App → handleRequest(method, url, headers, body) │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                            Server                                  │
│  ┌──────────────┐    ┌────────────────────────────────────────┐   │
│  │ ServerConfig │    │  baseUrl validation + path stripping   │   │
│  └──────────────┘    └──────────────────┬───────────────────┘    │
│                                         │                          │
│  ┌──────────────────────────────────────▼──────────────────────┐  │
│  │                          Router                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │  Middleware Chain (reverse order)                    │   │  │
│  │  │  errorHandlerMiddleware → loggerMiddleware →          │   │  │
│  │  │  delayMiddleware → RouteHandler                      │   │  │
│  │  └──────────────────────────┬───────────────────────────┘   │  │
│  │                             │                                │  │
│  │  Route Registry             ▼                                │  │
│  │  GET  /                     Route Matching                   │  │
│  │  GET  /_schemas             (regex, params extraction)       │  │
│  │  GET  /_schemas/:collection                                  │  │
│  │  GET  /:collection          ◄── QueryParser                  │  │
│  │  GET  /:collection/:id      ◄── RelationManager (expand)     │  │
│  │  POST /:collection          ◄── SchemaValidator              │  │
│  │  PUT  /:collection/:id      ◄── SchemaValidator              │  │
│  │  PATCH/:collection/:id      ◄── SchemaValidator              │  │
│  │  DELETE /:collection/:id    ◄── RelationManager (integrity)  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────────┐
              │                  │                       │
              ▼                  ▼                       ▼
┌─────────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│    Database     │   │  SchemaRegistry  │   │    QueryParser       │
│                 │   │   (Singleton)    │   │                      │
│  in-memory      │   │  ┌────────────┐ │   │  parseQueryParams()  │
│  data store     │   │  │  Schemas   │ │   │  → FilterGroup       │
│  ┌───────────┐  │   │  │  Map<>     │ │   │  → SortOption[]      │
│  │ data      │  │◄──│  └────────────┘ │   │  → Pagination        │
│  │ Record<   │  │   │  ┌────────────┐ │   │  → Search            │
│  │   string, │  │   │  │ Relation   │ │   └──────────────────────┘
│  │   any[]>  │  │   │  │ Manager   │ │              │
│  └───────────┘  │   │  └────────────┘ │              ▼
│                 │   └──────────────────┘   ┌──────────────────────┐
│  QueryProcessor │◄──────────────────────── │  QueryProcessor      │
│  .process()     │                          │  applyFilter()       │
│                 │                          │  applySearch()       │
│  StorageAdapter │                          │  applySort()         │
│  .save()/.load()│                          │  applyPagination()   │
└────────┬────────┘                          └──────────────────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌──────────────┐   ┌──────────────────┐
│ LocalStorage │   │   IndexedDB      │
│   Adapter    │   │   Adapter        │
│              │   │                  │
│ localStorage │   │ IDBDatabase      │
│ .setItem()   │   │ (object store:   │
│ .getItem()   │   │  "collections")  │
└──────────────┘   └──────────────────┘
```

---

## 4. Core Modules

### 4.1 Server (`src/core/server.ts`)

The `Server` class is the top-level entry point and composition root. It owns the `Router` and `Database` instances, enforces the base URL prefix, and exposes the public lifecycle API.

**Responsibilities:**
- Accepts a `ServerConfig` (`baseUrl`, `storageType`, `storageKey`) at construction time
- Validates and strips the base URL from incoming requests before dispatching to the `Router`
- Calls `SchemaRegistry.getInstance().initialize(db)` during `initialize()` to wire the schema registry to the database instance
- Delegates schema registration to `SchemaRegistry`
- Exposes `exportData()` and `importData()` for bulk data operations
- Exposes `changeStorage()` for hot-swapping the persistence adapter

**Key methods:**
- `handleRequest(method, url, headers, body): Promise<Response>` — primary entry point for all requests
- `initialize(initialData): Promise<void>` — seeds the database and wires the schema registry
- `registerSchema(schema): void` — registers a `SchemaDefinition` globally

---

### 4.2 Router (`src/core/router.ts`)

The `Router` maintains a flat list of `Route` objects and an ordered list of `Middleware` functions. It matches incoming requests by HTTP method and URL pattern, then executes the composed middleware chain.

**Responsibilities:**
- Stores routes as `{ method, path, handler }` tuples
- Converts Express-style path patterns (`:param`) to regular expressions for matching
- Parses query strings from the raw URL into `Record<string, string>`
- Builds the request context (`Request` object) and passes it through the middleware chain
- Applies middlewares in reverse order (last registered wraps outermost)

**Route matching:** Path segments of the form `/:param` are replaced with `([^/]+)` regex capture groups. Parameter names are extracted via `matchAll` and mapped positionally to capture group values.

**Middleware execution:** The handler chain is built by iterating the middleware array in reverse, wrapping each step as a closure over the next. This produces a classic onion-model execution order: first middleware registered executes outermost.

---

### 4.3 Database (`src/core/db.ts`)

The `Database` class is the in-memory data store and central coordinator for all data operations. It manages the entire dataset as a `Record<string, any[]>` in memory and delegates persistence to the active `StorageAdapter`.

**Responsibilities:**
- Maintains `data: Record<string, any[]>` — all collections live here
- Selects and instantiates the correct `StorageAdapter` based on `StorageType`
- Provides CRUD primitives: `getAll`, `getById`, `add`, `update`, `remove`
- Auto-assigns sequential integer IDs when items are added without one
- Delegates advanced queries to `QueryProcessor.process()`
- Provides `queryByFilters()` as a backward-compatible equality-filter API (used internally by `RelationManager`)
- Supports hot-swapping the storage adapter via `changeStorage()` — saves to the new adapter first, then removes from the old one to prevent data loss during transition

**Initialization contract:** On first `initialize()` call, if `initialData` is non-empty it uses that as the dataset; otherwise it loads from the adapter. On subsequent calls it replaces the dataset with the provided data. Always persists after initialization.

---

### 4.4 QueryParser (`src/core/query/QueryParser.ts`)

A stateless utility class that translates flat URL query parameters into a structured `QueryOptions` object consumed by `QueryProcessor`.

**Supported query parameters:**

| Parameter | Behavior |
|---|---|
| `field=value` | Equality filter: `field = value` |
| `field__eq=value` | Explicit equality filter |
| `field__ne=value` | Inequality filter |
| `field__gt=value` | Greater-than (numeric) |
| `field__gte=value` | Greater-than-or-equal (numeric) |
| `field__lt=value` | Less-than (numeric) |
| `field__lte=value` | Less-than-or-equal (numeric) |
| `field__like=value` | Case-insensitive substring match |
| `field__in=a,b,c` | Array membership |
| `field__nin=a,b,c` | Array non-membership |
| `_sort=field1,field2` | Multi-field sort |
| `_order=asc,desc` | Per-field sort direction |
| `_page=N&_limit=N` | Offset-based pagination |
| `_cursor=X&_limit=N` | Cursor-based pagination |
| `_q=text` | Full-text search across all fields |
| `_fields=f1,f2` | Restrict full-text search to specific fields |

The double-underscore `__` convention separates field name from operator. Unrecognized operators are silently ignored.

---

### 4.5 QueryProcessor (`src/core/query/QueryProcessor.ts`)

A stateless class that applies a `QueryOptions` object to an in-memory data array. All operations are pure — they return new arrays without mutating the input.

**Processing pipeline (in order):**
1. Apply filter conditions (recursive `FilterGroup` tree with `and` / `or` / `not` logical operators)
2. Apply full-text search (case-insensitive substring match across specified or all fields)
3. Count total matching records (before pagination)
4. Apply multi-field sort (string fields use `localeCompare`, numeric fields use direct comparison)
5. Apply pagination — returns either offset-based or cursor-based slices

**Pagination modes:**
- **Offset:** `page` and `limit` produce `currentPage`, `pageCount`, `hasMore`
- **Cursor:** Cursor is a base64-encoded array index. Next cursor is generated as `btoa(String(endIndex))`. Returns `nextCursor` and `hasMore`.

**Return type:** `PaginatedResult<T>` — `{ data: T[], pagination: { total, currentPage?, pageCount?, nextCursor?, hasMore } }`

---

### 4.6 SchemaValidator (`src/core/schema/SchemaValidator.ts`)

A stateless class providing two static operations: `validate()` and `transform()`.

**`validate(data, schema, partial?)`** — validates a data object against a `SchemaDefinition`:
- Checks required fields (skipped when `partial = true`, used for PATCH)
- Validates type (`string`, `number`, `boolean`, `object`, `array`, `null`, `any`) — supports union types as arrays
- Applies numeric range constraints (`min`, `max`)
- Applies string length constraints (`minLength`, `maxLength`) and regex pattern matching
- Validates `enum` membership
- Recursively validates nested objects via `properties` and array items via `items`
- Invokes per-field custom `validate` functions

**`transform(data, schema, isNew?)`** — applies schema-level transformations before persistence:
- Injects `defaultValue` for missing fields when `isNew = true`
- Invokes per-field `transform` functions
- Recursively processes nested objects and array items
- Automatically injects `createdAt` / `updatedAt` ISO timestamps when `schema.timestamps = true`

---

### 4.7 SchemaRegistry (`src/core/schema/SchemaRegistry.ts`)

A global Singleton that maintains a `Map<string, SchemaDefinition>` and coordinates schema registration with `RelationManager`.

**Lifecycle:**
1. `registerSchema(schema)` — stores the schema by `schema.name`. If `RelationManager` is already initialized, registers immediately there too.
2. `initialize(db)` — called by `Server.initialize()`. Creates a `RelationManager` instance and registers all existing schemas into it.
3. `getSchema(collection)` — lookup by collection name
4. `getRelationManager()` — returns the `RelationManager` instance (optional, only present after `initialize`)

The Singleton ensures that schemas registered before `initialize()` (e.g., during bootstrap) are not lost and are forwarded to `RelationManager` once the database is available.

---

### 4.8 RelationManager (`src/core/schema/RelationManager.ts`)

Manages cross-collection relational integrity using schema relation definitions. Holds a reference to the `Database` instance to perform queries and mutations during integrity checks and cascade operations.

**Relation types supported:**
- `oneToOne` / `manyToOne` — foreign key field on the owning collection points to the ID of a record in the related collection
- `oneToMany` — related collection holds the foreign key pointing back to this record's ID
- `manyToMany` — requires a union collection named `{collection}_{relatedCollection}` with join records

**Referential actions:**
- `cascade` — propagates delete or update to all referencing records
- `restrict` — blocks delete if referencing records exist
- `setNull` — sets the foreign key field to `null` on referenced records
- `setDefault` — sets the foreign key field to its schema-defined default value

**`expandRelations(collectionName, data, depth)`** — recursively resolves foreign key references into full objects up to the specified depth. Triggered by the `_expand=true` query parameter on `GET /:collection/:id`.

---

### 4.9 StorageAdapter (`src/core/storage/StorageAdapter.ts`)

An interface defining the contract for persistence backends. All implementations must be fully async (returning `Promise`).

```typescript
interface StorageAdapter {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}
```

The interface enables the `Database` to treat both storage backends identically and allows future adapters (e.g., `SessionStorageAdapter`, `MemoryAdapter`) to be added without touching the database layer.

---

### 4.10 LocalStorageAdapter (`src/core/storage/LocalStorageAdapter.ts`)

Implements `StorageAdapter` using the browser `localStorage` API. Data is serialized with `JSON.stringify` on save and deserialized with `JSON.parse` on load. All operations are wrapped in try/catch with re-thrown errors to propagate failures up to the `Database` layer.

**Constraints inherited from the platform:**
- Synchronous under the hood; the async wrapper is thin
- Subject to 5–10 MB storage quota depending on browser
- Storage is scoped to the origin

---

### 4.11 IndexedDBAdapter (`src/core/storage/IndexedDBAdapter.ts`)

Implements `StorageAdapter` using the browser IndexedDB API. Manages an `IDBDatabase` connection lazily (initialized on first use, cached for subsequent operations). Uses a single object store named `"collections"` and stores the full dataset as a single value keyed by the application's `storageKey`.

**Connection management:**
- `connectDB()` opens the database via `indexedDB.open()`, creating the object store on `onupgradeneeded` if it does not exist
- The `IDBDatabase` reference is cached after first open; `close()` is available to release it explicitly

**Advantages over localStorage:**
- Higher storage limits (generally 50%+ of available disk space)
- Truly asynchronous (non-blocking I/O)
- Better suited for large data sets

---

### 4.12 DataExporter (`src/core/utils/DataExporter.ts`)

A stateless utility class supporting export and import of the full database snapshot in two formats.

**JSON format:** Serializes the `Record<string, any[]>` as pretty-printed JSON. Import parses it back directly.

**CSV format:** Emits one block per collection, prefixed with `# Collection: {name}`, followed by a header row (field names from the first record) and one row per item. Nested objects and arrays are JSON-stringified within double-quoted cells. Import reverses the process, performing type coercion (boolean, number, JSON object/array) on each field value.

**`downloadAs(content, filename, mimeType)`** — browser-only utility that creates a `Blob`, generates an object URL, programmatically clicks a temporary anchor element, and revokes the URL after a 100ms timeout. Used to trigger file download from the UI.

---

### 4.13 HashUtils (`src/core/utils/HashUtils.ts`)

A utility class providing cryptographic and identifier generation functions for browser environments.

**`sha1(message): Promise<string>`** — generates a SHA-1 hex digest using the Web Crypto API (`window.crypto.subtle.digest`). Falls back to a 32-bit FNV-like hash (`simpleSHA1`) for environments where Web Crypto is unavailable or restricted.

**`generateId(): string`** — generates a URL-safe unique identifier by combining `Date.now().toString(36)` with a random base-36 suffix. Suitable for collision-resistant ID generation in low-concurrency browser contexts.

---

## 5. Request Lifecycle

The following trace describes the complete flow for `GET /api/users?age__gte=18&_sort=name&_page=1&_limit=10`:

```
1. Consumer calls server.handleRequest('GET', '/api/users?age__gte=18&_sort=name&_page=1&_limit=10', headers, null)

2. Server
   ├── Validates URL starts with baseUrl ('/api')
   ├── Strips prefix → apiPath = '/users?age__gte=18&_sort=name&_page=1&_limit=10'
   └── Delegates to router.handleRequest('GET', apiPath, headers, null)

3. Router
   ├── Splits path from query string: path = '/users', queryString = 'age__gte=...'
   ├── Parses query params into Record<string, string>
   ├── Iterates registered routes to find GET '/:collection' → match found
   ├── Extracts params: { collection: 'users' }
   ├── Builds Request = { method, path, params, query, headers, body }
   └── Composes middleware chain (reverse order):
       errorHandlerMiddleware
         └── loggerMiddleware
               └── delayMiddleware
                     └── routeHandler (GET /:collection)

4. Middleware chain executes:
   ├── errorHandlerMiddleware: wraps entire call in try/catch
   ├── loggerMiddleware: logs timestamp + method + path, then awaits next
   ├── delayMiddleware: waits 100–300ms random delay, then awaits next
   └── routeHandler (GET /:collection) begins

5. Route handler (endpoints.ts GET /:collection)
   ├── Reads req.params.collection = 'users'
   ├── Calls QueryParser.parseQueryParams(req.query)
   │   ├── parseFilterParams: finds 'age__gte=18' → FilterGroup { operator:'and', conditions:[{ field:'age', operator:'>=', value:18 }] }
   │   ├── parseSortParams: finds '_sort=name' → [{ field:'name', direction:'asc' }]
   │   ├── parsePaginationParams: finds '_page=1&_limit=10' → { type:'offset', page:1, limit:10 }
   │   └── parseSearchParams: no '_q' → undefined
   └── Calls db.query('users', queryOptions)

6. Database.query()
   └── Delegates to QueryProcessor.process(this.data['users'], queryOptions)
       ├── applyFilter: filters records where age >= 18
       ├── applySearch: (skipped, no search)
       ├── total = filtered.length (e.g. 45)
       ├── applySort: sorts by 'name' ascending (localeCompare)
       └── applyPagination (offset): slices [0..10], returns currentPage:1, pageCount:5, hasMore:true

7. Route handler builds Response:
   ├── status: 200
   ├── headers: Content-Type, X-Total-Count:45, X-Page:1, X-Total-Pages:5, X-Has-More:true
   └── body: [array of 10 users]

8. Response propagates back up through middleware chain:
   ├── loggerMiddleware: logs status + duration
   └── errorHandlerMiddleware: no error, passes through

9. Server returns Response to consumer
```

**Write path (POST /:collection):**

```
routeHandler
  ├── Validates body is a non-null object
  ├── SchemaRegistry.getInstance().getSchema(collection)
  │   ├── If schema found:
  │   │   ├── SchemaValidator.transform(body, schema, true)  → apply defaults + transforms + timestamps
  │   │   ├── SchemaValidator.validate(transformed, schema)  → collect ValidationErrors
  │   │   └── If invalid → 400 { error, details: ValidationError[] }
  │   └── If no schema → skip validation
  ├── db.add(collection, data)
  │   ├── createCollection if not exists
  │   ├── Auto-assign ID (max existing + 1) if not provided
  │   ├── Push item to in-memory array
  │   └── adapter.save(storageKey, this.data) → persist to localStorage or IndexedDB
  └── Return 201 { body: newItem, Location: '/{collection}/{id}' }
```

**Delete path (DELETE /:collection/:id):**

```
routeHandler
  ├── RelationManager.canDelete(collection, id)
  │   └── Checks all other schemas for 'restrict' relations pointing at this collection
  │       → If referencing records exist: return false → 409 Conflict
  ├── RelationManager.processCascadeDelete(collection, id)
  │   └── For each referencing relation:
  │       ├── 'cascade'    → db.remove each referencing record
  │       ├── 'setNull'    → db.update each referencing record (field = null)
  │       └── 'setDefault' → db.update each referencing record (field = default)
  ├── db.remove(collection, id)
  └── Return 204 No Content
```

---

## 6. Data Architecture

### 6.1 In-Memory Store

All data lives in a single JavaScript object:

```typescript
data: Record<string, any[]>
// Example:
{
  "users":    [ { id: 1, name: "..." }, ... ],
  "products": [ { id: 1, name: "..." }, ... ],
  "orders":   [ { id: 1, userId: 1, ... }, ... ]
}
```

Collections are created lazily when the first item is added to them (`createCollection`). Each collection is an unordered array of plain objects. There are no indexes; all filtering, sorting, and searching operates via linear scan.

### 6.2 ID Strategy

IDs are assigned automatically when an item is added without an `id` field. The strategy is sequential integer: `max(existing ids) + 1`. If the collection is empty, the first ID is `1`. IDs can also be provided explicitly by the caller, including string IDs (the system accepts `string | number` throughout).

### 6.3 Persistence Model

The entire `data` object is serialized and saved atomically to the storage backend after every mutating operation (`add`, `update`, `remove`, `initialize`, `importData`). There is no partial write or collection-level granularity — the full dataset is always written as one unit.

This "write-through on every mutation" model guarantees consistency between in-memory state and persisted state at the cost of write amplification for large datasets.

### 6.4 Storage Backends

| Backend | Key | Data representation | Size limit |
|---|---|---|---|
| `localStorage` | Configurable (`storageKey`) | `JSON.stringify(data)` | ~5–10 MB |
| `IndexedDB` | Configurable (`storageKey`) | Native object storage via IDB | ~50%+ disk space |

The backend can be changed at runtime via `Server.changeStorage(newType)`. The transition is safe: data is saved to the new backend before the old one is removed.

### 6.5 Collections and Relations

Relations are purely schema-driven — the `data` object holds flat arrays. Referential integrity is enforced at the application layer by `RelationManager` at request time (not at the storage layer). For many-to-many relations, a convention-based union collection named `{collection}_{relatedCollection}` must exist in the data store.

---

## 7. API Design

### 7.1 Endpoint Structure

All routes are registered relative to the configured `baseUrl` (default: `/api`). The endpoint layer is thin: it translates HTTP semantics into database operations, applying schema validation and relation management as cross-cutting concerns.

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all collection names |
| `GET` | `/_schemas` | List all registered schema definitions |
| `GET` | `/_schemas/:collection` | Get schema for a specific collection |
| `GET` | `/:collection` | Query a collection (with filtering, sorting, pagination, search) |
| `GET` | `/:collection/:id` | Get a single record by ID (optionally expand relations) |
| `POST` | `/:collection` | Create a new record |
| `PUT` | `/:collection/:id` | Replace a record (full update) |
| `PATCH` | `/:collection/:id` | Partially update a record |
| `DELETE` | `/:collection/:id` | Delete a record (with referential integrity checks) |

### 7.2 Request Parameters

**Collection query (`GET /:collection`):**
- Filter: `field=value`, `field__op=value` (see QueryParser section for operator reference)
- Sort: `_sort=field1,field2&_order=asc,desc`
- Offset pagination: `_page=N&_limit=N`
- Cursor pagination: `_cursor=token&_limit=N`
- Full-text search: `_q=text&_fields=field1,field2`

**Single resource (`GET /:collection/:id`):**
- `_expand=true` or `_expand=1` — expand relational fields into full objects
- `_expandDepth=N` — controls recursion depth for relation expansion (default: 1)

### 7.3 Response Headers

Collection queries include pagination metadata in response headers:

| Header | Value |
|---|---|
| `X-Total-Count` | Total records matching filters (before pagination) |
| `X-Page` | Current page number (offset pagination) |
| `X-Total-Pages` | Total number of pages (offset pagination) |
| `X-Next-Cursor` | Next page cursor token (cursor pagination) |
| `X-Has-More` | `true` if more records exist beyond current page |

### 7.4 Response Codes

| Status | Scenario |
|---|---|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST, includes `Location` header |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Invalid request body or schema validation failure |
| `404 Not Found` | Resource or collection not found |
| `409 Conflict` | Delete blocked by referential integrity (restrict) |
| `500 Internal Server Error` | Unhandled exception caught by errorHandlerMiddleware |

### 7.5 Schema Validation Errors

When schema validation fails, the response body includes structured errors:

```json
{
  "error": "Error de validación",
  "details": [
    { "field": "email", "message": "El campo es requerido" },
    { "field": "age", "message": "El valor debe ser mayor o igual a 0" }
  ]
}
```

---

## 8. Testing Strategy

### 8.1 Test Framework

RESTless uses **Vitest 2.1.9** as the test runner and assertion library. Vitest is configured inline within `vite.config.ts` to reuse the build toolchain configuration.

### 8.2 Configuration

```typescript
// vite.config.ts (test section)
{
  test: {
    environment: 'node',      // Tests run in Node.js (not jsdom)
    globals: true,            // Vitest globals (describe, it, expect) available without import
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      exclude: ['src/ui/**', 'src/main.ts', 'src/index.ts']
    }
  }
}
```

**Key decisions:**
- `environment: 'node'` — core logic tests do not require a browser DOM. Storage adapter tests that depend on `localStorage` or `IndexedDB` require mocking.
- Coverage targets `src/core/**/*.ts` exclusively, explicitly excluding UI components, the application entry point, and the public export barrel.
- The V8 coverage provider is used (native Node.js instrumentation, no Babel transform overhead).

### 8.3 Test Commands

| Command | Purpose |
|---|---|
| `pnpm test` | Single run (CI mode) |
| `pnpm test:watch` | Watch mode (development) |
| `pnpm test:coverage` | Run with V8 coverage report |

### 8.4 Test Scope Expectations

Given the `node` environment and the coverage configuration, the expected testing surface covers:

- `QueryParser` — unit tests for all query parameter parsing scenarios
- `QueryProcessor` — unit tests for filter operators, logical grouping, sort, offset/cursor pagination, and search
- `SchemaValidator` — unit tests for all type checks, constraint validations, transforms, and partial validation
- `RelationManager` — unit tests for relation lookup, cascade logic, and referential integrity
- `Database` — integration tests for CRUD operations, ID assignment, and query delegation
- `DataExporter` — unit tests for JSON and CSV serialization/deserialization round-trips
- `HashUtils` — unit tests for ID generation (mocking `window.crypto` where needed)

Storage adapters (`LocalStorageAdapter`, `IndexedDBAdapter`) require browser API mocks and are tested with appropriate stubs given the `node` environment.

---

## 9. Key Design Decisions

### 9.1 No Server Runtime Required

The foundational decision of RESTless is that it operates entirely within the browser, with zero server-side dependencies. This makes it suitable for frontend prototyping, demo applications, offline-capable apps, and test environments where spinning up a backend is undesirable. The trade-off is that the storage is ephemeral across origins and subject to browser storage quotas.

### 9.2 Pluggable Storage via Adapter Pattern

Rather than coupling the database to a specific persistence mechanism, `StorageAdapter` is an interface with swappable implementations. This allows the same API to work with `localStorage` (simpler, synchronous wrapper) or `IndexedDB` (asynchronous, higher capacity) without changes to the `Database` class. Hot-swapping at runtime is explicitly supported with a safe migration path.

### 9.3 Schema-Optional Design

Schema validation is entirely optional. If no schema is registered for a collection, all CRUD operations proceed without validation. This allows the library to be used as a zero-configuration mock API (similar to `json-server`) or progressively enhanced with type safety and constraints as the project matures.

### 9.4 Atomic Persistence on Every Mutation

Every write operation (`add`, `update`, `remove`) immediately persists the full dataset to the storage adapter. This guarantees that in-memory state and persisted state are always consistent after each operation, at the cost of write performance for large collections. For the browser prototyping use case this RESTless targets, this is an acceptable trade-off. A future optimization could introduce write batching or dirty-tracking.

### 9.5 Singleton SchemaRegistry

`SchemaRegistry` uses the Singleton pattern to provide a single, globally accessible registry. This eliminates the need to pass the registry instance through the call stack from `Server` down to individual route handlers. The downside is that tests must reset or re-initialize the singleton between test runs to avoid state leakage.

### 9.6 Relational Integrity at the Application Layer

Referential integrity is enforced by `RelationManager` at request processing time, not by the storage layer. This means integrity guarantees only hold when all mutations go through the `Server.handleRequest` path. Direct `Database` mutations (e.g., `db.add()` called programmatically outside the request pipeline) bypass these checks. This is an acceptable trade-off for a browser-side mock API, where the consumer controls the mutation surface.

### 9.7 Cursor Pagination via Base64-Encoded Offset

Cursor-based pagination is implemented by encoding the array index as a base64 string (`btoa(String(endIndex))`). This is a simplification of true cursor pagination (which would typically encode a field value for stable ordering). The current implementation is stable only for static datasets — insertions or deletions between pages will produce unexpected results. This is suitable for the read-heavy prototyping scenarios RESTless targets.

### 9.8 TypeScript-First with ESM Output

The library is built with TypeScript 5.7 and outputs both ESM (`restless.es.js`) and UMD (`restless.umd.js`) bundles via Vite's library build mode. The ESM output is tree-shakeable, and source maps are included in the distribution. The `@` alias resolves to `src/` for clean internal imports.

### 9.9 Middleware as Onion Model

The Router implements a classic onion middleware pattern identical to Koa and Express: middlewares are applied in reverse registration order to form nested closures. This means `router.use(A); router.use(B)` results in `A(B(handler))` — A's pre-logic executes first, B's pre-logic second, then the handler, then B's post-logic, then A's post-logic. This is the standard, well-understood pattern for layered cross-cutting concerns.
