# Repo Discoveries

## 2026-04-09

- The repository started as a near-empty scaffold with only planning docs and devcontainer configuration.
- Phase 1 bootstrap uses npm workspaces with `apps/server`, `apps/web`, and `packages/shared`.
- The frontend baseline uses Tailwind CSS v4 through the Vite plugin rather than a separate PostCSS setup.
- The root build flow compiles the web app, copies it into `apps/server/public`, and then builds the server.
- The devcontainer now builds a small custom image on top of the standard Node devcontainer base so Playwright Chromium and its Linux dependencies are preinstalled, with browser binaries stored under `/ms-playwright` for the `node` remote user.
