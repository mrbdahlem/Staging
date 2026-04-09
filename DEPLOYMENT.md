# Deployment

## Local development

1. Run `npm install` at the repository root.
2. Start both apps together with `npm run dev`.
3. Or start the backend with `npm run dev:server`.
4. Or start the frontend with `npm run dev:web`.

The root dev scripts automatically build `@staging/shared` before launching the backend or frontend.

## Production-style local run

1. Build the monorepo with `npm run build`.
2. Start the server with `npm run start`.

The server listens on port `3000` by default and serves the built SPA from `apps/server/public`.
