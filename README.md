# Staging

A lightweight deployment dashboard and orchestration service for managing CI-built artifacts and manually deploying them to staging environments.

## Current status

The repository is now bootstrapped as a TypeScript monorepo with:

- `apps/server`: Express backend with a `/api/health` endpoint and static SPA hosting
- `apps/web`: React/Vite/Tailwind CSS v4 frontend shell
- `packages/shared`: shared types and helpers
- SQLite-backed persistence bootstrap with seeded `learn` / `staging` records and configurable local storage paths

This now covers the Phase 1 bootstrap plus the Phase 2 persistence foundation from [.agent/plans/mvp.md](.agent/plans/mvp.md).

## Quick start

1. Install dependencies with `npm install`
2. Start both apps together with `npm run dev`
3. Or start the backend with `npm run dev:server`
4. Or start the frontend with `npm run dev:web`

The root dev scripts build `@staging/shared` first, so a fresh checkout does not require a separate manual shared-package build step.
On startup, the server also creates the configured storage directories and bootstraps the SQLite schema.

## Build and run

1. Build the shared package, frontend, and backend with `npm run build`
2. Start the built server with `npm run start`

By default, runtime storage lives under `./storage`, with the SQLite database at `./storage/db/staging.sqlite`.
You can override those paths with:

- `STAGING_STORAGE_ROOT`
- `STAGING_DB_PATH`
- `STAGING_ARTIFACTS_DIR`
- `STAGING_CURRENT_DIR`
- `STAGING_GENERATED_CONFIG_DIR`
- `STAGING_DEPLOYMENT_LOGS_DIR`
- `STAGING_IMPORTS_DIR`

## Validation

- `npm test`
- `npm run test:e2e`

GitHub Actions runs the same validation automatically in `.github/workflows/ci.yml`, including Playwright outside the local agent sandbox.
