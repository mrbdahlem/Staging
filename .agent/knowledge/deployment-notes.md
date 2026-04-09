# Deployment Notes

## 2026-04-09

- The backend now bootstraps its local storage tree and SQLite schema on startup before binding the HTTP listener.
- Default runtime state lives under the repository `storage/` directory unless overridden with `STAGING_*` environment variables.
- Current persistence uses Node's built-in `node:sqlite` module, so the runtime must stay on a Node version that includes SQLite support.
- Relative `STAGING_*` storage overrides should be normalized against the repository root so dev, test, and production-style runs do not drift with `process.cwd()`.
- Seeded environment health URLs should default to a relative path like `/api/health` and remain config-driven instead of persisting a fixed host and port.
- Startup failures should log structured error details and then terminate the process so supervisors can restart the service instead of leaving a partially failed boot in place.
- SQLite bootstrap should use `BEGIN IMMEDIATE` plus a short `busy_timeout` to reduce concurrent-startup migration races when more than one process points at the same database file.
