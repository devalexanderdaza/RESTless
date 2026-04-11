# OpenCode Agent Instructions for RESTless

RESTless is a browser-only REST API simulator with zero backend (data persists in localStorage/IndexedDB).

## 🏗️ Architecture & Layering Constraints

- **Unidirectional dependencies:** `UI` -> `API` -> `Core`. **Never reverse this.**
- **No DOM in Core:** `src/core/` must never import from `src/ui/` or access DOM APIs.
- **Zero runtime dependencies:** Never add external runtime npm packages. All logic uses browser-native APIs.
- **Async Storage:** `StorageAdapter` implementations (even LocalStorage) are Promise-based. Always `await` storage calls.
- **Singletons:** `SchemaRegistry` is a singleton (`SchemaRegistry.getInstance()`). **Warning:** It leaks state across test runs unless manually cleared.

## 📝 Code Conventions

- **Language mix:** Code comments and user-facing error strings must be in **Spanish**. Variables, classes, and internal documentation are in **English**.
- **Query syntax:** `QueryParser` uses a double-underscore `__` delimiter for operators (e.g., `price__gt=100`).
- **Unused arguments:** Prefix with `_` to satisfy strict TS rules (`argsIgnorePattern: "^_"`).
- **Console usage:** `console.log` is prohibited by lint rules. Use `console.warn` or `console.error` if necessary.

## 🛡️ Known Security & Implementation Gotchas

- **XSS:** UI layer uses `innerHTML`. Always sanitize user-controlled data before DOM insertion.
- **ReDoS:** Schema regex compilation can hang on crafted input.
- **CSV Injection:** `DataExporter` does not escape formula characters by default; prefix with `'` for `=`, `+`, `-`, `@`.

## 🧪 Testing (Vitest)

- **Environment:** `node` (NOT `jsdom`). Only `src/core/**` is tested; UI components are ignored.
- **Globals:** Vitest globals are enabled (`describe`, `it`, `expect` do not need to be imported).
- **Test execution:** Run tests via `pnpm test`. Coverage is `pnpm test:coverage` (v8 provider).

## 💻 Commands & Workflow

- **Package Manager:** `pnpm` ONLY.
- **Lint/Format:** `pnpm lint` (ESLint flat config) and `pnpm format` (Prettier).
- **No auto-build:** Do not trigger `pnpm build` automatically after making changes; only run it if explicitly requested.
