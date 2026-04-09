# Staging

A lightweight deployment dashboard and orchestration service for managing CI-built artifacts and manually deploying them to staging environments.

## Current status

The repository is now bootstrapped as a TypeScript monorepo with:

- `apps/server`: Express backend with a `/api/health` endpoint and static SPA hosting
- `apps/web`: React/Vite/Tailwind CSS v4 frontend shell
- `packages/shared`: shared types and helpers

This is the Phase 1 baseline for the MVP plan in [.agent/plans/mvp.md](.agent/plans/mvp.md).

## Quick start

1. Install dependencies with `npm install`
2. Start the backend with `npm run dev:server`
3. Start the frontend with `npm run dev:web`

## Build and run

1. Build the shared package, frontend, and backend with `npm run build`
2. Start the built server with `npm run start`

## Validation

- `npm test`
- `npm run test:e2e`

GitHub Actions runs the same validation automatically in `.github/workflows/ci.yml`, including Playwright outside the local agent sandbox.
