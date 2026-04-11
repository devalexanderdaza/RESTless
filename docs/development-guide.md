# RESTless — Development Guide

This guide covers everything needed to set up a local development environment, understand the build pipeline, run tests, and follow the project's code style conventions.

---

## Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| Node.js | 18.x | LTS recommended. Check with `node --version`. |
| pnpm | 9.x | Package manager used by this project. Check with `pnpm --version`. |

> **pnpm installation:** If pnpm is not installed, the fastest option is `npm install -g pnpm@9`. Alternatively, use the official standalone installer: `curl -fsSL https://get.pnpm.io/install.sh | sh -`.

No global build tools (Vite, TypeScript, ESLint) are required. All tooling is declared as devDependencies and executed via the `pnpm` scripts defined in `package.json`.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/devalexanderdaza/RESTless.git
cd RESTless
```

### 2. Install dependencies

```bash
pnpm install
```

pnpm reads `pnpm-lock.yaml` and performs a reproducible install. Do not use `npm install` or `yarn install` — the lockfile is pnpm-specific.

### 3. Verify the setup

```bash
pnpm test
```

All tests should pass on a clean checkout.

---

## Environment Setup

RESTless has no runtime dependencies and requires no external services. The development environment is self-contained:

- **Dev server** runs on `http://localhost:3000` (configured in `vite.config.ts`).
- **Seed data** is loaded from `public/data/db.json` at startup when the demo application runs.
- **Persistence** is handled by browser storage APIs (localStorage or IndexedDB). No server-side storage or database is involved.

There are no `.env` files or environment variables required to run the project.

---

## Available Commands

All commands are run from the repository root with `pnpm`.

### Development

| Command | Description |
|---|---|
| `pnpm dev` | Start the Vite dev server on port 3000 with hot module replacement. Opens the interactive demo UI in the browser. |
| `pnpm preview` | Serve the production build locally for manual verification before publishing. Run `pnpm build` first. |

### Building

| Command | Description |
|---|---|
| `pnpm build` | Compile TypeScript and bundle the library into `dist/` in both ES module and UMD formats. |

### Testing

| Command | Description |
|---|---|
| `pnpm test` | Run the full test suite once using Vitest. Exits with a non-zero code on failure. |
| `pnpm test:watch` | Run Vitest in watch mode. Re-runs affected tests on file save. Ideal for active development. |
| `pnpm test:coverage` | Run the test suite and generate a coverage report for files under `src/core/**`. The report is written to `coverage/`. |

### Code Quality

| Command | Description |
|---|---|
| `pnpm lint` | Run ESLint across all TypeScript source files using the flat config in `eslint.config.mjs`. Exits with a non-zero code if any rule is violated. |
| `pnpm format` | Run Prettier to auto-format all source files in place. |

---

## Build Process

The build is configured in `vite.config.ts` using Vite's [Library Mode](https://vitejs.dev/guide/build-lib.html).

### Entry point

Vite uses `src/index.ts` as the library entry point. Only the symbols explicitly exported from that file are included in the output. The demo UI (`src/main.ts`, `src/ui/`) is excluded from the library build.

### Output formats

Running `pnpm build` produces two bundles in `dist/`:

| Format | File | Use case |
|---|---|---|
| ES module | `dist/restless.es.js` | Modern bundlers (Webpack, Rollup, Vite, esbuild) and native ESM `import`. |
| UMD | `dist/restless.umd.js` | Legacy environments and direct browser inclusion via `<script>` tag. |

Type declarations (`.d.ts` files) are also emitted alongside the bundles, enabling full TypeScript intellisense for consumers of the library.

### TypeScript compilation

TypeScript is compiled by Vite's internal `esbuild` transform during the build. The `tsconfig.json` at the root governs compiler settings. Strict mode is enabled; no implicit `any` is allowed.

---

## Testing Approach

RESTless uses [Vitest](https://vitest.dev/) as the test runner. Vitest is API-compatible with Jest and runs inside the Vite pipeline, which means the same TypeScript and module resolution configuration is shared between tests and the application.

### Test file location

Test files are co-located with the modules they test, following the pattern `src/**/*.test.ts`. Current test coverage is concentrated in the core engine:

```
src/core/query/QueryParser.test.ts
src/core/query/QueryProcessor.test.ts
src/core/schema/SchemaValidator.test.ts
src/core/utils/DataExporter.test.ts
```

### Coverage

Coverage collection is scoped to `src/core/**` (configured in `vite.config.ts` or `vitest.config.ts`). Running `pnpm test:coverage` generates an HTML report in `coverage/index.html` and prints a summary to the terminal.

### Writing tests

Follow the existing pattern: one `describe` block per module, grouped `it`/`test` cases for each behaviour, and no shared mutable state between test cases. Vitest's `expect` API mirrors Jest's, so existing Jest knowledge transfers directly.

---

## Code Style

### ESLint

The project uses **ESLint 9** with the new flat configuration format (`eslint.config.mjs`). There is no `.eslintrc` file; the flat config is the single source of truth.

Run the linter:

```bash
pnpm lint
```

Fix auto-fixable issues:

```bash
pnpm lint --fix
```

### Prettier

Prettier handles all formatting decisions (indentation, quote style, trailing commas, line length). It is intentionally kept separate from ESLint to avoid rule conflicts.

Format all files:

```bash
pnpm format
```

Prettier configuration (if present) lives in `.prettierrc` or the `prettier` key in `package.json`. When in doubt, run `pnpm format` before committing — the formatter is the authority.

### Recommended workflow

1. Make code changes.
2. Run `pnpm lint` to catch rule violations.
3. Run `pnpm format` to normalise formatting.
4. Run `pnpm test` to confirm nothing is broken.

Consider configuring your editor to run Prettier on save and ESLint on save for a tighter feedback loop.

---

## Common Development Tasks

### Adding a new resource endpoint

1. Register a schema for the new resource in `src/schemas/index.ts`.
2. Add seed data for the resource to `public/data/db.json` (optional, for development convenience).
3. Add route handlers in `src/api/endpoints.ts`, following the pattern of existing CRUD handlers.
4. If the resource has relations to existing resources, update `RelationManager` in `src/core/schema/RelationManager.ts`.

### Adding a new storage adapter

1. Create a new file in `src/core/storage/`, e.g., `SessionStorageAdapter.ts`.
2. Extend or implement the `StorageAdapter` contract defined in `src/core/storage/StorageAdapter.ts`.
3. Export the new adapter from `src/core/storage/index.ts`.
4. Wire the adapter into the server configuration in `src/core/server.ts` as needed.

### Adding a new query operator

1. Add the operator to the type definitions in `src/core/query/types.ts`.
2. Extend the parsing logic in `src/core/query/QueryParser.ts` to recognise the new operator syntax.
3. Implement the filter logic in `src/core/query/QueryProcessor.ts`.
4. Add unit tests for both the parser and processor in their respective `.test.ts` files.

### Running a single test file

```bash
pnpm vitest run src/core/query/QueryParser.test.ts
```

### Inspecting the build output

```bash
pnpm build
ls dist/
```

The `dist/` directory is not committed to the repository (it is listed in `.gitignore`). Always run `pnpm build` locally before inspecting output.

### Checking test coverage for a specific module

```bash
pnpm test:coverage
open coverage/index.html   # macOS
xdg-open coverage/index.html  # Linux
```

Drill down to any file in the HTML report to see line-by-line coverage detail.
