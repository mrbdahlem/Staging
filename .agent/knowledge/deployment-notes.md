# Deployment Notes

## 2026-04-09

- The backend now bootstraps its local storage tree and SQLite schema on startup before binding the HTTP listener.
- Default runtime state lives under the repository `storage/` directory unless overridden with `STAGING_*` environment variables.
- Current persistence uses Node's built-in `node:sqlite` module, so the runtime must stay on a Node version that includes SQLite support.
