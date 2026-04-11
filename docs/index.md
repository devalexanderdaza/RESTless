# RESTless -- Project Documentation Index

## Project Overview

- **Type:** Monolith (single cohesive codebase)
- **Primary Language:** TypeScript 5.7
- **Framework:** Vite 6.2 (build tooling), Vitest 2.1 (testing)
- **Architecture:** Layered architecture with Adapter, Registry, and Strategy patterns
- **Version:** 1.5.0
- **License:** MIT

## Quick Reference

- **Tech Stack:** TypeScript, Vite, Vitest, ESLint 9, Prettier, pnpm 9
- **Library Entry Point:** `src/index.ts` (builds as ES + UMD)
- **UI Entry Point:** `src/main.ts` (demo dashboard)
- **Architecture Pattern:** Layered with pluggable storage adapters
- **Runtime Dependencies:** Zero
- **Storage Backends:** localStorage, IndexedDB (switchable at runtime)

## Generated Documentation

- [Project Overview](./project-overview.md) -- Executive summary, tech stack, features, and repository structure
- [Architecture](./architecture.md) -- System components, request lifecycle, data architecture, design decisions
- [Source Tree Analysis](./source-tree-analysis.md) -- Annotated directory tree with per-file descriptions
- [API Contracts](./api-contracts.md) -- Full REST API reference: endpoints, query parameters, headers, examples
- [Development Guide](./development-guide.md) -- Prerequisites, setup, commands, build process, testing, code style
- [Contribution Guide](../CONTRIBUTING.md) -- Branching strategy, PR process, commit conventions

## Existing Documentation

- [README](../README.md) -- Project introduction, features, API reference, schema management, examples
- [CONTRIBUTING](../CONTRIBUTING.md) -- Contributing guidelines and development process
- [LICENSE](../LICENSE.md) -- MIT License
- [TECH_REPORT](../TECH_REPORT.md) -- Technical report

## Getting Started

1. Ensure Node.js >= 18.0.0 and pnpm >= 9.0.0 are installed
2. Clone the repository and run `pnpm install`
3. Start the development server with `pnpm dev`
4. Open `http://localhost:3000` in your browser
5. See the [Development Guide](./development-guide.md) for full details

---

*Documentation generated on 2026-04-11 via BMAD Document Project workflow (Quick Scan).*
