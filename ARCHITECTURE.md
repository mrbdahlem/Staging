# Architecture

Staging is a TypeScript monorepo with three workspaces:

- `apps/server`: Express API and static asset host
- `apps/web`: React/Vite/Tailwind CSS v4 single-page application
- `packages/shared`: shared types and helpers used by both applications

## Runtime flow

1. The web app is built with Vite.
2. The root `copy:web` script copies the generated web assets into `apps/server/public`.
3. On startup, the Express server bootstraps the configured storage directories and SQLite schema.
4. The Express server serves `/api/*` routes and falls back to `index.html` for SPA routing.

## Current MVP baseline

The repository currently implements the Phase 1 bootstrap only:

- a health endpoint at `/api/health`
- a frontend shell that displays the backend health state
- workspace-level test, lint, and typecheck scripts
- a Playwright smoke test for the combined app
- a SQLite persistence foundation with seeded `learn` project / `staging` environment records
