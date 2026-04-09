import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

import type {
  ArtifactRecord,
  DeploymentRecord,
  DeploymentStatus,
  DeploymentType,
  EnvironmentRecord,
  ProjectRecord
} from "@staging/shared";

import type { StorageConfig } from "../config.js";

type SqliteValue = number | string | null;

type SqliteDatabase = DatabaseSync;

interface PersistenceConfig {
  defaultHealthUrl: string;
  storage: StorageConfig;
}

type SeedEnvironmentValues = [
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  null,
  string,
  string,
  string,
  null,
  null
];

interface ArtifactRow {
  id: number;
  project_id: number;
  source: string | null;
  repo: string | null;
  workflow_run_id: number | null;
  artifact_name: string;
  filename: string;
  local_path: string | null;
  branch: string | null;
  commit_sha: string | null;
  commit_message: string | null;
  actor: string | null;
  created_at: string;
  downloaded_at: string | null;
  checksum_sha256: string | null;
  size_bytes: number | null;
  status: string;
  notes: string | null;
}

interface DeploymentRow {
  id: number;
  project_id: number;
  environment_id: number;
  artifact_id: number | null;
  type: DeploymentType;
  status: DeploymentStatus;
  requested_at: string;
  started_at: string | null;
  finished_at: string | null;
  requested_by: string | null;
  previous_artifact_id: number | null;
  resolved_artifact_path: string | null;
  resolved_env_path: string | null;
  artifact_sha256: string | null;
  env_sha256: string | null;
  container_id: string | null;
  log_path: string | null;
  log_capture_started_at: string | null;
  log_capture_finished_at: string | null;
  health_status: string | null;
  health_message: string | null;
  notes: string | null;
}

interface EnvironmentRow {
  id: number;
  project_id: number;
  key: string;
  name: string;
  description: string | null;
  container_name: string;
  docker_compose_file: string;
  docker_compose_project: string;
  deploy_pointer_path: string | null;
  generated_env_dir: string;
  health_url: string | null;
  logs_path: string;
  active_artifact_id: number | null;
  active_deployment_id: number | null;
}

interface ProjectRow {
  id: number;
  key: string;
  name: string;
  description: string | null;
  runtime_type: string;
  artifact_kind: string;
  deploy_driver: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface ArtifactInput {
  projectId: number;
  source?: string | null;
  repo?: string | null;
  workflowRunId?: number | null;
  artifactName: string;
  filename: string;
  localPath?: string | null;
  branch?: string | null;
  commitSha?: string | null;
  commitMessage?: string | null;
  actor?: string | null;
  downloadedAt?: string | null;
  checksumSha256?: string | null;
  sizeBytes?: number | null;
  status: string;
  notes?: string | null;
}

export interface DeploymentInput {
  projectId: number;
  environmentId: number;
  artifactId?: number | null;
  type: DeploymentType;
  status: DeploymentStatus;
  requestedBy?: string | null;
  previousArtifactId?: number | null;
  resolvedArtifactPath?: string | null;
  resolvedEnvPath?: string | null;
  artifactSha256?: string | null;
  envSha256?: string | null;
  containerId?: string | null;
  logPath?: string | null;
  logCaptureStartedAt?: string | null;
  logCaptureFinishedAt?: string | null;
  healthStatus?: string | null;
  healthMessage?: string | null;
  notes?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

const migrations = [
  {
    id: "001_initial_schema",
    sql: `
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        runtime_type TEXT NOT NULL,
        artifact_kind TEXT NOT NULL,
        deploy_driver TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE artifacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        source TEXT,
        repo TEXT,
        workflow_run_id INTEGER,
        artifact_name TEXT NOT NULL,
        filename TEXT NOT NULL,
        local_path TEXT,
        branch TEXT,
        commit_sha TEXT,
        commit_message TEXT,
        actor TEXT,
        created_at TEXT NOT NULL,
        downloaded_at TEXT,
        checksum_sha256 TEXT,
        size_bytes INTEGER,
        status TEXT NOT NULL,
        notes TEXT,
        UNIQUE(project_id, workflow_run_id, artifact_name)
      );

      CREATE TABLE artifact_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artifact_id INTEGER NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
        tag TEXT NOT NULL
      );

      CREATE TABLE deployments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        environment_id INTEGER NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
        artifact_id INTEGER REFERENCES artifacts(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        started_at TEXT,
        finished_at TEXT,
        requested_by TEXT,
        previous_artifact_id INTEGER REFERENCES artifacts(id) ON DELETE SET NULL,
        resolved_artifact_path TEXT,
        resolved_env_path TEXT,
        artifact_sha256 TEXT,
        env_sha256 TEXT,
        container_id TEXT,
        log_path TEXT,
        log_capture_started_at TEXT,
        log_capture_finished_at TEXT,
        health_status TEXT,
        health_message TEXT,
        notes TEXT
      );

      CREATE TABLE environments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        container_name TEXT NOT NULL,
        docker_compose_file TEXT NOT NULL,
        docker_compose_project TEXT NOT NULL,
        deploy_pointer_path TEXT,
        generated_env_dir TEXT NOT NULL,
        health_url TEXT,
        logs_path TEXT NOT NULL,
        active_artifact_id INTEGER REFERENCES artifacts(id) ON DELETE SET NULL,
        active_deployment_id INTEGER REFERENCES deployments(id) ON DELETE SET NULL,
        UNIQUE(project_id, key)
      );

      CREATE TABLE environment_variables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        environment_id INTEGER NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        is_secret INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE artifact_env_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artifact_id INTEGER NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        is_secret INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `
  },
  {
    id: "002_data_integrity_constraints",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS artifacts_project_null_workflow_run_artifact_name_unique
      ON artifacts (project_id, artifact_name)
      WHERE workflow_run_id IS NULL;

      CREATE TRIGGER IF NOT EXISTS deployments_project_matches_environment_insert
      BEFORE INSERT ON deployments
      FOR EACH ROW
      WHEN NOT EXISTS (
        SELECT 1
        FROM environments
        WHERE id = NEW.environment_id
          AND project_id = NEW.project_id
      )
      BEGIN
        SELECT RAISE(ABORT, 'Deployment project_id must match environment project_id');
      END;

      CREATE TRIGGER IF NOT EXISTS deployments_project_matches_environment_update
      BEFORE UPDATE OF project_id, environment_id ON deployments
      FOR EACH ROW
      WHEN NOT EXISTS (
        SELECT 1
        FROM environments
        WHERE id = NEW.environment_id
          AND project_id = NEW.project_id
      )
      BEGIN
        SELECT RAISE(ABORT, 'Deployment project_id must match environment project_id');
      END;
    `
  }
] as const;

function runStatement<T>(db: SqliteDatabase, sql: string, values: SqliteValue[] = []): T[] {
  return db.prepare(sql).all(...values) as T[];
}

function getStatement<T>(db: SqliteDatabase, sql: string, values: SqliteValue[] = []): T | undefined {
  return db.prepare(sql).get(...values) as T | undefined;
}

function executeStatement(db: SqliteDatabase, sql: string, values: SqliteValue[] = []) {
  return db.prepare(sql).run(...values);
}

function mapArtifactRow(row: ArtifactRow): ArtifactRecord {
  return {
    actor: row.actor,
    artifactName: row.artifact_name,
    branch: row.branch,
    checksumSha256: row.checksum_sha256,
    commitMessage: row.commit_message,
    commitSha: row.commit_sha,
    createdAt: row.created_at,
    downloadedAt: row.downloaded_at,
    filename: row.filename,
    id: row.id,
    localPath: row.local_path,
    notes: row.notes,
    projectId: row.project_id,
    repo: row.repo,
    sizeBytes: row.size_bytes,
    source: row.source,
    status: row.status,
    workflowRunId: row.workflow_run_id
  };
}

function mapDeploymentRow(row: DeploymentRow): DeploymentRecord {
  return {
    artifactId: row.artifact_id,
    artifactSha256: row.artifact_sha256,
    containerId: row.container_id,
    environmentId: row.environment_id,
    envSha256: row.env_sha256,
    finishedAt: row.finished_at,
    healthMessage: row.health_message,
    healthStatus: row.health_status,
    id: row.id,
    logCaptureFinishedAt: row.log_capture_finished_at,
    logCaptureStartedAt: row.log_capture_started_at,
    logPath: row.log_path,
    notes: row.notes,
    previousArtifactId: row.previous_artifact_id,
    projectId: row.project_id,
    requestedAt: row.requested_at,
    requestedBy: row.requested_by,
    resolvedArtifactPath: row.resolved_artifact_path,
    resolvedEnvPath: row.resolved_env_path,
    startedAt: row.started_at,
    status: row.status,
    type: row.type
  };
}

function mapEnvironmentRow(row: EnvironmentRow): EnvironmentRecord {
  return {
    activeArtifactId: row.active_artifact_id,
    activeDeploymentId: row.active_deployment_id,
    containerName: row.container_name,
    deployPointerPath: row.deploy_pointer_path,
    description: row.description,
    dockerComposeFile: row.docker_compose_file,
    dockerComposeProject: row.docker_compose_project,
    generatedEnvDir: row.generated_env_dir,
    healthUrl: row.health_url,
    id: row.id,
    key: row.key,
    logsPath: row.logs_path,
    name: row.name,
    projectId: row.project_id
  };
}

function mapProjectRow(row: ProjectRow): ProjectRecord {
  return {
    active: row.active === 1,
    artifactKind: row.artifact_kind,
    createdAt: row.created_at,
    deployDriver: row.deploy_driver,
    description: row.description,
    id: row.id,
    key: row.key,
    name: row.name,
    runtimeType: row.runtime_type,
    updatedAt: row.updated_at
  };
}

async function ensureStorage(storage: StorageConfig) {
  await Promise.all([
    mkdir(storage.rootDir, { recursive: true }),
    mkdir(storage.artifactsDir, { recursive: true }),
    mkdir(storage.currentDir, { recursive: true }),
    mkdir(storage.generatedConfigDir, { recursive: true }),
    mkdir(storage.deploymentLogsDir, { recursive: true }),
    mkdir(storage.importsDir, { recursive: true }),
    mkdir(storage.dbDir, { recursive: true })
  ]);
}

function runMigrations(db: SqliteDatabase) {
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    runStatement<{ id: string }>(db, "SELECT id FROM schema_migrations").map((row) => row.id)
  );

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    db.exec("BEGIN IMMEDIATE");

    try {
      db.exec(migration.sql);
      executeStatement(
        db,
        "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
        [migration.id, new Date().toISOString()]
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

function seedDefaults(db: SqliteDatabase, storage: StorageConfig, defaultHealthUrl: string) {
  const now = new Date().toISOString();
  const learnProject = getStatement<{ id: number }>(db, "SELECT id FROM projects WHERE key = ?", ["learn"]);

  const projectId =
    learnProject?.id ??
    Number(
      executeStatement(
        db,
        `
          INSERT INTO projects (
            key,
            name,
            description,
            runtime_type,
            artifact_kind,
            deploy_driver,
            active,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "learn",
          "Learn",
          "Seeded Learn project for the Staging MVP.",
          "java-jar",
          "jar",
          "compose-mounted-artifact",
          1,
          now,
          now
        ]
      ).lastInsertRowid
    );

  const stagingEnvironment = getStatement<{ id: number }>(
    db,
    "SELECT id FROM environments WHERE project_id = ? AND key = ?",
    [projectId, "staging"]
  );

  if (!stagingEnvironment) {
    const environmentValues: SeedEnvironmentValues = [
      projectId,
      "staging",
      "Staging",
      "Default staging environment for Learn.",
      "learn-staging",
      "docker/compose/docker-compose.yml",
      "staging",
      null,
      storage.generatedConfigDir,
      defaultHealthUrl,
      storage.deploymentLogsDir,
      null,
      null
    ];

    executeStatement(
      db,
      `
        INSERT INTO environments (
          project_id,
          key,
          name,
          description,
          container_name,
          docker_compose_file,
          docker_compose_project,
          deploy_pointer_path,
          generated_env_dir,
          health_url,
          logs_path,
          active_artifact_id,
          active_deployment_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      environmentValues
    );

    return;
  }

  executeStatement(
    db,
    "UPDATE environments SET generated_env_dir = ?, health_url = ?, logs_path = ? WHERE id = ?",
    [
      storage.generatedConfigDir,
      defaultHealthUrl,
      storage.deploymentLogsDir,
      stagingEnvironment.id
    ]
  );
}

export function openStagingDatabase(dbPath: string): SqliteDatabase {
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  return db;
}

export async function initializePersistence(config: PersistenceConfig) {
  await ensureStorage(config.storage);

  const db = openStagingDatabase(config.storage.dbPath);

  try {
    runMigrations(db);
    seedDefaults(db, config.storage, config.defaultHealthUrl);
  } finally {
    db.close();
  }
}

export function listProjects(db: SqliteDatabase): ProjectRecord[] {
  return runStatement<ProjectRow>(db, "SELECT * FROM projects ORDER BY key ASC").map(mapProjectRow);
}

export function listEnvironments(db: SqliteDatabase): EnvironmentRecord[] {
  return runStatement<EnvironmentRow>(
    db,
    "SELECT * FROM environments ORDER BY project_id ASC, key ASC"
  ).map(mapEnvironmentRow);
}

export function createArtifact(
  db: SqliteDatabase,
  input: ArtifactInput
): ArtifactRecord {
  const createdAt = new Date().toISOString();
  const result = executeStatement(
    db,
    `
      INSERT INTO artifacts (
        project_id,
        source,
        repo,
        workflow_run_id,
        artifact_name,
        filename,
        local_path,
        branch,
        commit_sha,
        commit_message,
        actor,
        created_at,
        downloaded_at,
        checksum_sha256,
        size_bytes,
        status,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.projectId,
      input.source ?? null,
      input.repo ?? null,
      input.workflowRunId ?? null,
      input.artifactName,
      input.filename,
      input.localPath ?? null,
      input.branch ?? null,
      input.commitSha ?? null,
      input.commitMessage ?? null,
      input.actor ?? null,
      createdAt,
      input.downloadedAt ?? null,
      input.checksumSha256 ?? null,
      input.sizeBytes ?? null,
      input.status,
      input.notes ?? null
    ]
  );

  const row = getStatement<ArtifactRow>(db, "SELECT * FROM artifacts WHERE id = ?", [
    Number(result.lastInsertRowid)
  ]);

  if (!row) {
    throw new Error("Failed to load inserted artifact");
  }

  return mapArtifactRow(row);
}

export function getArtifactById(
  db: SqliteDatabase,
  id: number
): ArtifactRecord | null {
  const row = getStatement<ArtifactRow>(db, "SELECT * FROM artifacts WHERE id = ?", [id]);
  return row ? mapArtifactRow(row) : null;
}

export function updateArtifact(
  db: SqliteDatabase,
  id: number,
  updates: Partial<Omit<ArtifactRecord, "createdAt" | "id" | "projectId">>
): ArtifactRecord | null {
  const assignments: string[] = [];
  const values: SqliteValue[] = [];
  const fieldMap = {
    actor: "actor",
    artifactName: "artifact_name",
    branch: "branch",
    checksumSha256: "checksum_sha256",
    commitMessage: "commit_message",
    commitSha: "commit_sha",
    downloadedAt: "downloaded_at",
    filename: "filename",
    localPath: "local_path",
    notes: "notes",
    repo: "repo",
    sizeBytes: "size_bytes",
    source: "source",
    status: "status",
    workflowRunId: "workflow_run_id"
  } satisfies Record<string, string>;

  for (const [key, column] of Object.entries(fieldMap)) {
    const value = updates[key as keyof typeof updates];

    if (value === undefined) {
      continue;
    }

    assignments.push(`${column} = ?`);
    values.push(value);
  }

  if (assignments.length === 0) {
    return getArtifactById(db, id);
  }

  executeStatement(db, `UPDATE artifacts SET ${assignments.join(", ")} WHERE id = ?`, [...values, id]);
  return getArtifactById(db, id);
}

export function createDeployment(
  db: SqliteDatabase,
  input: DeploymentInput
): DeploymentRecord {
  const requestedAt = new Date().toISOString();
  const result = executeStatement(
    db,
    `
      INSERT INTO deployments (
        project_id,
        environment_id,
        artifact_id,
        type,
        status,
        requested_at,
        started_at,
        finished_at,
        requested_by,
        previous_artifact_id,
        resolved_artifact_path,
        resolved_env_path,
        artifact_sha256,
        env_sha256,
        container_id,
        log_path,
        log_capture_started_at,
        log_capture_finished_at,
        health_status,
        health_message,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.projectId,
      input.environmentId,
      input.artifactId ?? null,
      input.type,
      input.status,
      requestedAt,
      input.startedAt ?? null,
      input.finishedAt ?? null,
      input.requestedBy ?? null,
      input.previousArtifactId ?? null,
      input.resolvedArtifactPath ?? null,
      input.resolvedEnvPath ?? null,
      input.artifactSha256 ?? null,
      input.envSha256 ?? null,
      input.containerId ?? null,
      input.logPath ?? null,
      input.logCaptureStartedAt ?? null,
      input.logCaptureFinishedAt ?? null,
      input.healthStatus ?? null,
      input.healthMessage ?? null,
      input.notes ?? null
    ]
  );

  const row = getStatement<DeploymentRow>(db, "SELECT * FROM deployments WHERE id = ?", [
    Number(result.lastInsertRowid)
  ]);

  if (!row) {
    throw new Error("Failed to load inserted deployment");
  }

  return mapDeploymentRow(row);
}

export function getDeploymentById(
  db: SqliteDatabase,
  id: number
): DeploymentRecord | null {
  const row = getStatement<DeploymentRow>(db, "SELECT * FROM deployments WHERE id = ?", [id]);
  return row ? mapDeploymentRow(row) : null;
}

export function updateDeployment(
  db: SqliteDatabase,
  id: number,
  updates: Partial<
    Omit<DeploymentRecord, "environmentId" | "id" | "projectId" | "requestedAt" | "type">
  >
): DeploymentRecord | null {
  const assignments: string[] = [];
  const values: SqliteValue[] = [];
  const fieldMap = {
    artifactId: "artifact_id",
    artifactSha256: "artifact_sha256",
    containerId: "container_id",
    envSha256: "env_sha256",
    finishedAt: "finished_at",
    healthMessage: "health_message",
    healthStatus: "health_status",
    logCaptureFinishedAt: "log_capture_finished_at",
    logCaptureStartedAt: "log_capture_started_at",
    logPath: "log_path",
    notes: "notes",
    previousArtifactId: "previous_artifact_id",
    requestedBy: "requested_by",
    resolvedArtifactPath: "resolved_artifact_path",
    resolvedEnvPath: "resolved_env_path",
    startedAt: "started_at",
    status: "status"
  } satisfies Record<string, string>;

  for (const [key, column] of Object.entries(fieldMap)) {
    const value = updates[key as keyof typeof updates];

    if (value === undefined) {
      continue;
    }

    assignments.push(`${column} = ?`);
    values.push(value);
  }

  if (assignments.length === 0) {
    return getDeploymentById(db, id);
  }

  executeStatement(
    db,
    `UPDATE deployments SET ${assignments.join(", ")} WHERE id = ?`,
    [...values, id]
  );
  return getDeploymentById(db, id);
}
