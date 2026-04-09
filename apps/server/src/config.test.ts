import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { getServerConfig } from "./config.js";

describe("server config", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults storage paths under the repository storage directory", () => {
    delete process.env.STAGING_STORAGE_ROOT;
    delete process.env.STAGING_DB_PATH;
    delete process.env.STAGING_ARTIFACTS_DIR;
    delete process.env.STAGING_CURRENT_DIR;
    delete process.env.STAGING_GENERATED_CONFIG_DIR;
    delete process.env.STAGING_DEPLOYMENT_LOGS_DIR;
    delete process.env.STAGING_IMPORTS_DIR;

    const config = getServerConfig();

    expect(config.storage.rootDir).toBe(resolve(process.cwd(), "..", "..", "storage"));
    expect(config.storage.dbPath).toBe(
      resolve(process.cwd(), "..", "..", "storage", "db", "staging.sqlite")
    );
  });

  it("allows storage paths to be overridden by environment variables", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "staging-config-"));

    process.env.STAGING_STORAGE_ROOT = resolve(tempRoot, "custom-root");
    process.env.STAGING_DB_PATH = resolve(tempRoot, "db", "custom.sqlite");
    process.env.STAGING_ARTIFACTS_DIR = resolve(tempRoot, "artifacts");
    process.env.STAGING_CURRENT_DIR = resolve(tempRoot, "current");
    process.env.STAGING_GENERATED_CONFIG_DIR = resolve(tempRoot, "generated-config");
    process.env.STAGING_DEPLOYMENT_LOGS_DIR = resolve(tempRoot, "deploy-logs");
    process.env.STAGING_IMPORTS_DIR = resolve(tempRoot, "imports");

    const config = getServerConfig();

    expect(config.storage).toEqual({
      rootDir: resolve(tempRoot, "custom-root"),
      artifactsDir: resolve(tempRoot, "artifacts"),
      currentDir: resolve(tempRoot, "current"),
      generatedConfigDir: resolve(tempRoot, "generated-config"),
      deploymentLogsDir: resolve(tempRoot, "deploy-logs"),
      importsDir: resolve(tempRoot, "imports"),
      dbPath: resolve(tempRoot, "db", "custom.sqlite"),
      dbDir: resolve(tempRoot, "db")
    });

    rmSync(tempRoot, { force: true, recursive: true });
  });

  it("normalizes relative storage overrides against the repository root", () => {
    process.env.STAGING_STORAGE_ROOT = "storage-alt";
    process.env.STAGING_DB_PATH = "custom/db.sqlite";
    process.env.STAGING_ARTIFACTS_DIR = "runtime/artifacts";
    process.env.STAGING_CURRENT_DIR = "runtime/current";
    process.env.STAGING_GENERATED_CONFIG_DIR = "runtime/generated";
    process.env.STAGING_DEPLOYMENT_LOGS_DIR = "runtime/logs";
    process.env.STAGING_IMPORTS_DIR = "runtime/imports";

    const config = getServerConfig();
    const repoRoot = resolve(process.cwd(), "..", "..");

    expect(config.storage).toEqual({
      rootDir: resolve(repoRoot, "storage-alt"),
      artifactsDir: resolve(repoRoot, "runtime", "artifacts"),
      currentDir: resolve(repoRoot, "runtime", "current"),
      generatedConfigDir: resolve(repoRoot, "runtime", "generated"),
      deploymentLogsDir: resolve(repoRoot, "runtime", "logs"),
      importsDir: resolve(repoRoot, "runtime", "imports"),
      dbPath: resolve(repoRoot, "custom", "db.sqlite"),
      dbDir: resolve(repoRoot, "custom")
    });
  });
});
