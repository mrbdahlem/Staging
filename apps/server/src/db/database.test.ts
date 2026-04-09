import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import type { StorageConfig } from "../config.js";
import {
  createArtifact,
  createDeployment,
  getArtifactById,
  getDeploymentById,
  initializePersistence,
  listEnvironments,
  listProjects,
  openStagingDatabase,
  updateArtifact,
  updateDeployment
} from "./database.js";

async function createTestStorage(): Promise<StorageConfig> {
  const rootDir = await mkdtemp(join(tmpdir(), "staging-db-"));

  return {
    rootDir,
    artifactsDir: join(rootDir, "artifacts"),
    currentDir: join(rootDir, "current"),
    generatedConfigDir: join(rootDir, "config", "generated"),
    deploymentLogsDir: join(rootDir, "logs", "deployments"),
    importsDir: join(rootDir, "imports"),
    dbDir: join(rootDir, "db"),
    dbPath: join(rootDir, "db", "staging.sqlite")
  };
}

describe("database bootstrap", () => {
  it("creates storage directories and seeds the default project and environment", async () => {
    const storage = await createTestStorage();

    try {
      await initializePersistence({
        defaultHealthUrl: "/api/health",
        storage
      });

      const db = openStagingDatabase(storage.dbPath);

      try {
        const projects = listProjects(db);
        const environments = listEnvironments(db);

        expect(projects).toEqual([
          expect.objectContaining({
            active: true,
            artifactKind: "jar",
            deployDriver: "compose-mounted-artifact",
            key: "learn",
            name: "Learn",
            runtimeType: "java-jar"
          })
        ]);

        expect(environments).toEqual([
          expect.objectContaining({
            containerName: "learn-staging",
            dockerComposeFile: "docker/compose/docker-compose.yml",
            dockerComposeProject: "staging",
            generatedEnvDir: storage.generatedConfigDir,
            healthUrl: "/api/health",
            key: "staging",
            logsPath: storage.deploymentLogsDir,
            name: "Staging",
            projectId: projects[0]?.id
          })
        ]);
      } finally {
        db.close();
      }
    } finally {
      await rm(storage.rootDir, { force: true, recursive: true });
    }
  });

  it("can create, read, and update artifact and deployment records", async () => {
    const storage = await createTestStorage();

    try {
      await initializePersistence({
        defaultHealthUrl: "/api/health",
        storage
      });

      const db = openStagingDatabase(storage.dbPath);

      try {
        const [project] = listProjects(db);
        const [environment] = listEnvironments(db);

        expect(project).toBeDefined();
        expect(environment).toBeDefined();

        const artifact = createArtifact(db, {
          actor: "octocat",
          artifactName: "learn-main-build184",
          branch: "main",
          checksumSha256: "abc123",
          commitSha: "deadbeef",
          filename: "learn-main-build184.jar",
          localPath: join(storage.artifactsDir, "learn-main-build184.jar"),
          projectId: project!.id,
          repo: "mrbdahlem/Staging",
          sizeBytes: 2048,
          source: "github-actions",
          status: "downloaded",
          workflowRunId: 184
        });
        const artifactId: number = artifact.id;

        const fetchedArtifact = getArtifactById(db, artifactId);
        expect(fetchedArtifact).toEqual(artifact);

        const updatedArtifact = updateArtifact(db, artifactId, {
          notes: "Ready for manual deployment",
          status: "verified"
        });

        expect(updatedArtifact).toEqual(
          expect.objectContaining({
            id: artifact.id,
            notes: "Ready for manual deployment",
            status: "verified"
          })
        );

        const deployment = createDeployment(db, {
          artifactId: artifact.id,
          artifactSha256: artifact.checksumSha256,
          environmentId: environment!.id,
          projectId: project!.id,
          requestedBy: "operator",
          resolvedArtifactPath: artifact.localPath,
          resolvedEnvPath: join(storage.generatedConfigDir, "deployment-0001.env"),
          status: "pending",
          type: "deploy"
        });
        const deploymentId: number = deployment.id;

        const fetchedDeployment = getDeploymentById(db, deploymentId);
        expect(fetchedDeployment).toEqual(deployment);

        const updatedDeployment = updateDeployment(db, deploymentId, {
          finishedAt: "2026-04-09T18:15:00.000Z",
          healthStatus: "ok",
          status: "success"
        });

        expect(updatedDeployment).toEqual(
          expect.objectContaining({
            id: deployment.id,
            healthStatus: "ok",
            status: "success"
          })
        );
      } finally {
        db.close();
      }
    } finally {
      await rm(storage.rootDir, { force: true, recursive: true });
    }
  });

  it("uses the configured seeded health URL", async () => {
    const storage = await createTestStorage();

    try {
      await initializePersistence({
        defaultHealthUrl: "/healthz",
        storage
      });

      const db = openStagingDatabase(storage.dbPath);

      try {
        const [environment] = listEnvironments(db);

        expect(environment).toEqual(
          expect.objectContaining({
            healthUrl: "/healthz"
          })
        );
      } finally {
        db.close();
      }
    } finally {
      await rm(storage.rootDir, { force: true, recursive: true });
    }
  });

  it("updates the seeded health URL when the configured default changes", async () => {
    const storage = await createTestStorage();

    try {
      await initializePersistence({
        defaultHealthUrl: "/api/health",
        storage
      });

      await initializePersistence({
        defaultHealthUrl: "/healthz",
        storage
      });

      const db = openStagingDatabase(storage.dbPath);

      try {
        const [environment] = listEnvironments(db);

        expect(environment).toEqual(
          expect.objectContaining({
            healthUrl: "/healthz"
          })
        );
      } finally {
        db.close();
      }
    } finally {
      await rm(storage.rootDir, { force: true, recursive: true });
    }
  });

  it("configures SQLite to wait briefly when the database is locked", async () => {
    const storage = await createTestStorage();

    try {
      await initializePersistence({
        defaultHealthUrl: "/api/health",
        storage
      });

      const db = openStagingDatabase(storage.dbPath);

      try {
        const row = db.prepare("PRAGMA busy_timeout;").get() as { timeout: number } | undefined;

        expect(row).toEqual({
          timeout: 5000
        });
      } finally {
        db.close();
      }
    } finally {
      await rm(storage.rootDir, { force: true, recursive: true });
    }
  });
});
