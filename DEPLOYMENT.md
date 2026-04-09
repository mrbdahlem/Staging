# Deployment

## Local development

1. Run `npm install` at the repository root.
2. Start both apps together with `npm run dev`.
3. Or start the backend with `npm run dev:server`.
4. Or start the frontend with `npm run dev:web`.

The root dev scripts automatically build `@staging/shared` before launching the backend or frontend.
Use Node 24.x for local development and deployment targets so the built-in `node:sqlite` module required by the server is available.
The backend also bootstraps local storage and the SQLite schema on startup.

Default storage paths:

- `storage/db/staging.sqlite`
- `storage/artifacts/`
- `storage/current/`
- `storage/config/generated/`
- `storage/logs/deployments/`
- `storage/imports/`

All of those can be overridden with `STAGING_*` storage environment variables when you need isolated paths for tests or alternate runtimes.

## Production-style local run

1. Build the monorepo with `npm run build`.
2. Start the server with `npm run start`.

The server listens on port `3000` by default and serves the built SPA from `apps/server/public`.
