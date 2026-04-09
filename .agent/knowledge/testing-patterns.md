# Testing Patterns

## 2026-04-09

- Root `npm test` is the primary baseline gate and chains `lint`, `typecheck`, and workspace unit tests.
- Browser-level verification lives under the repo-root `playwright/` directory and runs through `npm run test:e2e`.
- GitHub Actions should run both `npm test` and `npm run test:e2e` so browser coverage is verified outside sandboxed agent sessions.
- CI runs inside a Playwright container image so browser binaries and Linux dependencies do not need to be downloaded during every workflow run.
- The pinned Playwright CI image `mcr.microsoft.com/playwright:v1.59.1-jammy` currently provides Node 24.x, so workflow verification should match that image rather than assuming Node 22.
- The devcontainer should install Playwright OS dependencies as `root` but install browser binaries into a shared `PLAYWRIGHT_BROWSERS_PATH` owned by `node`, otherwise the remote user can miss the cached executables.
- Server tests should stay in-process in this sandbox and avoid real port binding; the current bootstrap covers route handlers directly with Vitest.
- In this agent sandbox, local port binding is not reliable enough to treat Playwright as a hard gate; keep `npm test` green here and rerun `npm run test:e2e` in a canonical environment when browser-level verification matters.
