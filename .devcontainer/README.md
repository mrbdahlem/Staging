# Devcontainer Notes

This devcontainer is set up for Node.js development with a typical Vite frontend
and an Express backend.

## Services

The devcontainer runs via Docker Compose with a single service:

- `app` using `mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm`

## Why the build was failing

The previous setup was copied from a Java-oriented devcontainer and included the
`common-utils` feature. During image build, that feature triggered `apt` against
an existing Yarn APT source whose signing key was missing, which caused the
build to fail before the workspace even opened.

This version removes the Java-specific setup and uses the standard Node dev
container image directly, which is a better fit for Vite/Express work and avoids
that feature-install path.

## First run

1. Rebuild or reopen the devcontainer.
2. Inside the container, verify the toolchain:

```bash
node --version
npm --version
```

4. If a `package.json` exists at the repo root, dependencies will install during
`postCreateCommand`. Otherwise the setup scripts will skip install cleanly.

## Common app ports

- `5173` for Vite dev server
- `4173` for Vite preview
- `3000` for Express or other backend servers
