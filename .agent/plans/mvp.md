Absolutely. Here is a working spec and implementation plan for **Staging** as we have defined it so far.

# Staging

## Technical Spec and Implementation Plan

**Version:** v1
**Purpose:** Manage CI-built Learn jar artifacts and support manual deployment and rollback to a Dockerized staging environment on a Raspberry Pi 5.

---

# 1. Overview

Staging is a lightweight deployment dashboard and orchestration service for Learn. It receives metadata about successful CI builds, downloads jar artifacts, stores artifact and deployment metadata in SQLite, and allows a user to manually deploy or roll back a selected artifact to a Dockerized Learn staging instance.

Staging is not a CI system, not a full auth platform, and not yet a DB sanitization tool. It is intentionally focused on artifact management, deployment control, runtime visibility, and rollback.

The initial deployment target is a staging Learn instance running on a Pi 5. The same architecture should allow promotion to production later, but production support is out of scope for v1.

---

# 2. Goals

## 2.1 Primary goals

* Receive notification when a Learn jar has been successfully built and tested in GitHub Actions
* Download and store the jar artifact locally
* Maintain artifact metadata in a local SQLite database
* Present a web UI for viewing and managing available artifacts
* Allow a user to manually deploy a selected artifact to the staging Learn container
* Allow a user to manually roll back to a previously successful deployment
* Store deployment history, including artifact, config snapshot, status, and log reference
* Serve the frontend as static assets from the backend
* Support LAN access
* Keep Learn running inside a Docker container
* Keep runtime state outside the Learn container
* Use a read-only runtime container model where practical

## 2.2 Non-goals for v1

* Automatic production deployment
* Automatic database sanitization
* Full identity management or auth platform
* Zero-downtime cutover
* Rebuilding Docker images for each jar
* Full secret-management platform
* Blue/green or canary deployments

---

# 3. High-level architecture

Staging is a monorepo containing a React frontend and a Node/Express backend, both written in TypeScript.

The frontend is built with Vite and bundled to static files. The backend serves those files and exposes a JSON API.

Artifact and deployment metadata are stored in SQLite. Jar files, generated environment snapshots, and deployment logs are stored on the host filesystem.

The Learn runtime runs as a separate Docker container that mounts the currently selected jar and generated env file from the host. The Learn container is treated as disposable. Persistent state lives in MariaDB and host storage, not in the container.

---

# 4. System components

## 4.1 Frontend

The frontend is a React single-page application. It is prebuilt and served by the backend. It is responsible for:

* listing artifacts
* showing current deployed version
* showing deployment history
* allowing manual sync
* allowing deployment and rollback
* allowing management of environment defaults
* allowing management of artifact-specific env overrides
* showing runtime status and health
* later, browsing deployment logs

## 4.2 Backend

The backend is a Node/Express app written in TypeScript. It is responsible for:

* validating and processing GitHub build notifications
* downloading jar artifacts from GitHub
* managing artifact metadata
* resolving config
* generating deployment env snapshots
* updating the active jar symlink
* restarting the Learn container
* running health checks
* storing deployment records
* capturing deployment log references
* serving the frontend static files

## 4.3 SQLite database

SQLite stores metadata only. It does not store the Learn application data. That remains in MariaDB. SQLite is used for:

* artifacts
* tags
* environments
* environment variables
* artifact overrides
* deployments

## 4.4 Host storage

Host storage contains:

* downloaded jar artifacts
* active symlink
* generated env snapshots
* deployment logs
* SQLite database
* optionally imported DB backups for future manual restore workflows

## 4.5 Learn runtime container

Learn runs in a separate Docker container with a fixed runtime image. The current jar and generated env file are mounted from the host. The container is restarted when a new artifact is deployed or when a rollback occurs.

The container should be read-only where practical. If writable temp storage is required, it should use a tmpfs or explicitly mounted writable path.

---

# 5. Runtime model

The Learn container is disposable. The authoritative runtime bundle for a deployment is the combination of:

* artifact jar
* generated env snapshot
* deployment record
* deployment log file or log reference

The deployment record acts as the durable pointer that ties these together.

A rollback is not a special system. It is a new deployment event of type `rollback` that reuses a prior deployment’s artifact and config snapshot and creates a new runtime log.

---

# 6. Deployment strategy

## 6.1 Deployment mode for v1

v1 uses a simple restart deployment model:

1. user selects an artifact
2. backend resolves config
3. backend generates an env snapshot file
4. backend atomically updates the current jar symlink
5. backend restarts the Learn container
6. backend performs a health check
7. backend records deployment success or failure
8. backend captures or references deployment logs

Downtime is acceptable for v1.

## 6.2 Rollback mode

Rollback uses the same execution path as deployment, except:

* the deployment type is `rollback`
* the artifact comes from a previous successful deployment
* the config snapshot reused is the exact snapshot from that previous deployment

This is rollback option B, meaning rollback restores both artifact and config snapshot.

---

# 7. Monorepo structure

```text
staging/
  apps/
    server/
      src/
        api/
        db/
        deploy/
        docker/
        github/
        health/
        artifacts/
        config/
        logs/
        services/
      public/
      package.json
      tsconfig.json
    web/
      src/
      index.html
      package.json
      vite.config.ts
      tsconfig.json
  packages/
    shared/
      src/
        types/
        schemas/
  docker/
    compose/
      docker-compose.yml
    learn/
      Dockerfile.runtime
  storage/
    artifacts/
    current/
    config/
      generated/
    logs/
      deployments/
    db/
    imports/
  package.json
```

---

# 8. Storage layout

Suggested host filesystem layout:

```text
/opt/staging/
  artifacts/
    learn-main-2026-04-08-build184-abc123.jar
    learn-main-2026-04-08-build185-def456.jar
  current/
    learn.jar -> ../artifacts/learn-main-2026-04-08-build184-abc123.jar
  config/
    generated/
      deployment-0001.env
      deployment-0002.env
  logs/
    deployments/
      deployment-0001.log
      deployment-0002.log
  db/
    staging.sqlite
  imports/
    mariadb/
```

---

# 9. Data model

## 9.1 Artifacts

Represents a known jar file downloaded from CI.

Fields:

* `id`
* `source`
* `repo`
* `workflow_run_id`
* `artifact_name`
* `filename`
* `local_path`
* `branch`
* `commit_sha`
* `commit_message`
* `actor`
* `created_at`
* `downloaded_at`
* `checksum_sha256`
* `size_bytes`
* `status`
* `notes`

## 9.2 Artifact tags

Stores one or more tags for an artifact.

Fields:

* `id`
* `artifact_id`
* `tag`

## 9.3 Environments

Represents a deployment target. v1 will likely have only one, `staging`, but this should still be modeled explicitly.

Fields:

* `id`
* `name`
* `description`
* `container_name`
* `docker_compose_file`
* `docker_compose_project`
* `deploy_symlink_path`
* `generated_env_dir`
* `health_url`
* `logs_path`
* `active_artifact_id`
* `active_deployment_id`

## 9.4 Environment variables

Default variables for an environment.

Fields:

* `id`
* `environment_id`
* `key`
* `value`
* `is_secret`
* `updated_at`

## 9.5 Artifact variable overrides

Optional per-artifact overrides to environment defaults.

Fields:

* `id`
* `artifact_id`
* `key`
* `value`
* `is_secret`
* `updated_at`

## 9.6 Deployments

A durable record of a deployment or rollback attempt.

Fields:

* `id`
* `environment_id`
* `artifact_id`
* `type` (`deploy`, `rollback`)
* `status` (`pending`, `preparing`, `restarting`, `health_checking`, `success`, `failed`)
* `requested_at`
* `started_at`
* `finished_at`
* `requested_by`
* `previous_artifact_id`
* `resolved_artifact_path`
* `resolved_env_path`
* `artifact_sha256`
* `env_sha256`
* `container_id`
* `log_path`
* `log_capture_started_at`
* `log_capture_finished_at`
* `health_status`
* `health_message`
* `notes`

---

# 10. Config resolution rules

Config for a deployment is resolved in this order:

1. environment default variables
2. artifact-specific variable overrides
3. future deployment-specific overrides if implemented

For v1, only steps 1 and 2 are required.

The resolved config is written to a generated env snapshot file for each deployment. This file is immutable once written and is referenced by the deployment record.

Rollback reuses the original deployment’s env snapshot file rather than regenerating config from current defaults.

Secrets may be stored in SQLite for v1, but should be masked in the UI after creation or update. The user should be able to replace a secret value even if the current value is not revealed.

---

# 11. GitHub integration

## 11.1 Trigger source

GitHub Actions is the source of successful build notifications. After a successful build and test job, the workflow will:

* upload the jar artifact
* send a signed POST request to Staging with build metadata

## 11.2 Authentication

The POST payload will be signed using an HMAC signature derived from a shared secret known to both GitHub Actions and Staging.

The backend validates the signature before processing the request.

## 11.3 Suggested payload

```json
{
  "repo": "owner/learn",
  "workflowRunId": 123456789,
  "artifactName": "learn-jar",
  "branch": "main",
  "commitSha": "abc123def456",
  "commitMessage": "Fix grade sync and cleanup job",
  "actor": "bdahlem",
  "createdAt": "2026-04-08T19:30:00Z"
}
```

## 11.4 Download path

Once the payload is validated, the backend uses a GitHub token to locate and download the artifact, then stores it in the local artifact directory and records metadata in SQLite.

## 11.5 Manual sync

The UI includes a manual sync action. This should query recent successful workflow runs or artifacts from GitHub and import any missing artifacts. This acts as a recovery mechanism if a webhook is missed.

---

# 12. Deployment lifecycle

## 12.1 Deployment states

Suggested deployment states:

* `pending`
* `preparing`
* `restarting`
* `health_checking`
* `success`
* `failed`

These should be stored in the deployment record and surfaced in the UI.

## 12.2 Deployment flow

1. create deployment record with `pending`
2. transition to `preparing`
3. resolve config from environment defaults and artifact overrides
4. write generated env snapshot file
5. compute and store env hash
6. atomically update current jar symlink
7. transition to `restarting`
8. restart Learn container
9. capture container id
10. transition to `health_checking`
11. poll health endpoint up to configured timeout
12. capture or snapshot relevant logs to deployment log file
13. update deployment record with final status

## 12.3 Rollback flow

1. user selects previous successful deployment
2. create new deployment record with type `rollback`
3. reuse selected deployment’s artifact and env snapshot
4. update symlink
5. restart container
6. health check
7. capture logs
8. update deployment status

---

# 13. Logging

Learn logs to stdout. Docker is the live source of runtime logs.

For deployment history, Staging should create a per-deployment log file path and capture relevant logs for that deployment. The log file path is stored in the deployment record.

The deployment record therefore provides a stable pointer to the logs for that run, even after the container has been restarted multiple times.

For v1, startup and deployment-time logs are sufficient. Full live log browsing can be added later.

---

# 14. Docker strategy

## 14.1 Learn runtime image

The Learn image should be fixed and reusable. It should include:

* Java runtime
* startup script if needed
* no application jar baked into the image

The selected jar is mounted from the host.

## 14.2 Container configuration

The Learn container should ideally use:

* read-only root filesystem
* mounted jar path read-only
* generated env snapshot file or env file mounted read-only
* external MariaDB connection
* writable tmpfs only if required
* optional writable log mount if later needed

## 14.3 Docker interaction from Staging

For v1, Staging may shell out to `docker compose` rather than using the Docker Engine API. This is simpler and easier to debug on a Pi-hosted admin system.

The shelling should be tightly controlled and limited to known commands for the configured environment.

---

# 15. API surface

Suggested initial API routes:

## Artifacts

* `GET /api/artifacts`
* `GET /api/artifacts/:id`
* `POST /api/artifacts/sync`
* `POST /api/artifacts/:id/tags`
* `DELETE /api/artifacts/:id/tags/:tag`
* `DELETE /api/artifacts/:id`

## Deployments

* `GET /api/deployments`
* `GET /api/deployments/:id`
* `POST /api/artifacts/:id/deploy`
* `POST /api/deployments/:id/rollback`

## Runtime

* `GET /api/runtime/status`
* `POST /api/runtime/restart`

## Config

* `GET /api/environments`
* `GET /api/environments/:id/variables`
* `PUT /api/environments/:id/variables`
* `GET /api/artifacts/:id/overrides`
* `PUT /api/artifacts/:id/overrides`

## GitHub ingest

* `POST /api/github/build-complete`

---

# 16. Frontend pages

## Dashboard

Shows current deployment, health, latest artifacts, and quick actions.

## Artifacts

Shows artifact table, metadata, tags, notes, and deploy actions.

## Deployments

Shows history of deployments and rollbacks, statuses, and log references.

## Runtime

Shows current symlink target, container status, health, and runtime details.

## Config

Shows environment defaults and artifact-specific overrides.

## Future pages

* logs
* DB snapshots
* integration status

---

# 17. Security and auth assumptions

Auth is intentionally separate from the core Staging spec. The backend should be structured so that auth can be added as middleware without rewriting business logic.

Staging must support LAN access, so the backend cannot assume Cloudflare is always in front of it. Cloudflare Tunnel and Cloudflare Access may still be used for remote access.

Webhook validation via HMAC is required from the start.

Secrets displayed in the UI should be masked after creation or update.

---

# 18. Operational assumptions

* downtime during deploy is acceptable
* manual button press is required for any deployment
* the Pi 5 is resource-constrained, so side-by-side candidate containers are not required for v1
* the Learn MariaDB remains separate from Staging’s SQLite metadata database
* prod DB backups may be stored on the system, but restore and sanitization workflows are out of scope for v1

---

# 19. Open items intentionally left to implementation

These are acknowledged but not blocking for implementation:

* exact secret-masking UX
* exact health endpoint contract
* whether deployment logs are streamed or snapshotted after startup
* whether tags and notes are part of MVP or immediate post-MVP
* exact structure of the GitHub manual sync API interaction
* exact auth layer for LAN use
* whether Docker logs alone are sufficient or a host-side file capture should be implemented immediately
* whether tmpfs is needed for the read-only Learn container

These should be decided as implementation details rather than delaying the project.

---

# 20. Implementation plan

## Phase 1: project setup and skeleton

Create the monorepo with:

* `apps/server`
* `apps/web`
* `packages/shared`

Set up:

* TypeScript
* Vite for frontend
* Express backend
* shared types and schemas
* frontend build output copied to backend public directory
* Docker Compose for local/dev deployment

Deliverable:

* backend serves the frontend SPA and a basic health endpoint

## Phase 2: SQLite schema and persistence layer

Implement SQLite with chosen library or ORM. Create tables for:

* artifacts
* artifact tags
* environments
* environment variables
* artifact overrides
* deployments

Seed a default `staging` environment.

Deliverable:

* backend can create, read, and update artifact and deployment records

## Phase 3: GitHub ingest and artifact download

Implement:

* `POST /api/github/build-complete`
* HMAC signature validation
* GitHub artifact lookup/download
* local artifact storage
* checksum calculation
* metadata persistence

Implement manual sync endpoint.

Deliverable:

* successful GitHub build notification results in a stored jar artifact visible in the database

## Phase 4: artifact UI

Build frontend pages for:

* dashboard
* artifact list
* artifact detail panel

Include:

* manual sync button
* artifact metadata table
* deploy button placeholder

Deliverable:

* user can view imported artifacts in the UI

## Phase 5: config management

Implement:

* environment default variable storage
* artifact override storage
* config resolution service
* generated env snapshot creation
* config hash generation

Build frontend UI to manage environment defaults and artifact overrides.

Deliverable:

* a selected artifact can produce a resolved env snapshot file

## Phase 6: deployment orchestration

Implement deployment service:

* create deployment record
* update symlink atomically
* shell out to `docker compose`
* restart Learn container
* capture container id
* poll health endpoint
* persist final deployment status

Deliverable:

* user can deploy an artifact from the UI to staging

## Phase 7: rollback

Implement rollback using previous successful deployment’s artifact and env snapshot.

Add rollback button to deployment history UI.

Deliverable:

* user can roll back from the UI

## Phase 8: deployment log reference

Implement per-deployment log file path creation and capture of relevant logs.

Persist `log_path` in deployment records.

Expose log metadata in the UI.

Deliverable:

* each deployment record points to a stable deployment log file

## Phase 9: runtime status page

Implement runtime inspection page showing:

* current artifact
* current deployment
* symlink target
* container status
* health result

Deliverable:

* runtime page gives a quick operator view of staging health and version

## Phase 10: polish and hardening

Add:

* safer delete behavior for artifacts
* artifact tags and notes
* secret masking in UI
* better error handling
* timeouts and retries for health checks
* deployment-state UI polish
* logging around backend operations
* permission and filesystem checks
* documentation

Deliverable:

* usable v1 release

---

# 21. MVP checklist

The system is considered v1-ready when it can do the following:

* serve a React SPA from the backend
* ingest signed GitHub build notifications
* download jar artifacts from GitHub
* store artifact metadata in SQLite
* show artifacts in the UI
* manage environment defaults
* manage artifact-specific overrides
* generate immutable env snapshots per deployment
* deploy a selected artifact to a Dockerized Learn staging container
* health-check the deployment
* store deployment history
* roll back to a previous successful deployment using artifact plus config snapshot
* associate each deployment with a log reference

---

# 22. First implementation recommendation

If you want the smoothest start, build in this exact order:

1. monorepo skeleton
2. SQLite schema
3. artifact ingest endpoint
4. manual sync
5. artifact list UI
6. config resolution and env snapshot generation
7. deploy service
8. rollback
9. deployment logs
10. runtime page

That order gets you to something useful quickly while keeping the hard parts isolated.

If you want, I can turn this into a more concrete engineering backlog with epics, tasks, and suggested file/module names for the TypeScript implementation.
