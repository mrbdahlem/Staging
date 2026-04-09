# Devcontainer Notes

This devcontainer is set up for Node.js development with a typical Vite frontend
and an Express backend.

## Services

The devcontainer runs via Docker Compose with a single service:

- `app` built from `.devcontainer/Dockerfile`

The custom image extends the standard Node devcontainer base and preinstalls
Playwright Chromium plus its Linux system dependencies, so local browser tests
do not require a separate manual `npx playwright install` or
`npx playwright install-deps`.

## Why the build was failing

The previous setup was copied from a Java-oriented devcontainer and included the
`common-utils` feature. During image build, that feature triggered `apt` against
an existing Yarn APT source whose signing key was missing, which caused the
build to fail before the workspace even opened.

This version keeps the standard Node devcontainer base, but layers a small
custom image on top so the Playwright runtime dependencies are available from
the start without extra manual host setup.

## First run

1. Rebuild or reopen the devcontainer.
2. Inside the container, verify the toolchain:

```bash
node --version
npm --version
```

4. If a `package.json` exists at the repo root, dependencies will install during
`postCreateCommand`. Otherwise the setup scripts will skip install cleanly.
5. If you change `.devcontainer/Dockerfile`, rebuild the devcontainer so the
browser dependencies are refreshed in the image.

## Common app ports

- `5173` for Vite dev server
- `4173` for Vite preview
- `3000` for Express or other backend servers
