# Data Contracts

## Purpose

Durable notes about API and persistence-layer invariants that should remain true across refactors and migrations.

## 2026-04-09

- The `deployments` table stores both `project_id` and `environment_id`, and the database now enforces that they refer to the same project via insert/update triggers.
- Artifact uniqueness is split across two cases: `(project_id, workflow_run_id, artifact_name)` for workflow-backed artifacts and a partial unique index on `(project_id, artifact_name)` when `workflow_run_id IS NULL`.
- Prefer database-enforced invariants over helper-level conventions for persistence reviewability. If a relationship or uniqueness rule matters at runtime, encode it in schema objects such as unique indexes, foreign keys, triggers, or conflict-handling inserts instead of relying only on TypeScript helpers.
- When seeding or syncing config-derived rows, prefer explicit upsert statements over separate select/insert/update branches so repeated startup paths stay idempotent and easier to audit for race conditions.
