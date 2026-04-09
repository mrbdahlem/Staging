import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = fileURLToPath(new URL(".", import.meta.url));

export interface StorageConfig {
  rootDir: string;
  artifactsDir: string;
  currentDir: string;
  generatedConfigDir: string;
  deploymentLogsDir: string;
  importsDir: string;
  dbPath: string;
  dbDir: string;
}

function resolveStoragePath(repoRoot: string, pathValue: string): string {
  return isAbsolute(pathValue) ? pathValue : resolve(repoRoot, pathValue);
}

function getStorageConfig(repoRoot: string): StorageConfig {
  const rootDir = process.env.STAGING_STORAGE_ROOT
    ? resolveStoragePath(repoRoot, process.env.STAGING_STORAGE_ROOT)
    : resolve(repoRoot, "storage");
  const dbPath = process.env.STAGING_DB_PATH
    ? resolveStoragePath(repoRoot, process.env.STAGING_DB_PATH)
    : resolve(rootDir, "db", "staging.sqlite");

  return {
    rootDir,
    artifactsDir: process.env.STAGING_ARTIFACTS_DIR
      ? resolveStoragePath(repoRoot, process.env.STAGING_ARTIFACTS_DIR)
      : resolve(rootDir, "artifacts"),
    currentDir: process.env.STAGING_CURRENT_DIR
      ? resolveStoragePath(repoRoot, process.env.STAGING_CURRENT_DIR)
      : resolve(rootDir, "current"),
    generatedConfigDir:
      process.env.STAGING_GENERATED_CONFIG_DIR
        ? resolveStoragePath(repoRoot, process.env.STAGING_GENERATED_CONFIG_DIR)
        : resolve(rootDir, "config", "generated"),
    deploymentLogsDir:
      process.env.STAGING_DEPLOYMENT_LOGS_DIR
        ? resolveStoragePath(repoRoot, process.env.STAGING_DEPLOYMENT_LOGS_DIR)
        : resolve(rootDir, "logs", "deployments"),
    importsDir: process.env.STAGING_IMPORTS_DIR
      ? resolveStoragePath(repoRoot, process.env.STAGING_IMPORTS_DIR)
      : resolve(rootDir, "imports"),
    dbPath,
    dbDir: dirname(dbPath)
  };
}

export function getServerConfig() {
  const projectRoot = resolve(sourceDir, "..");
  const repoRoot = resolve(projectRoot, "..", "..");
  const parsedPort = Number.parseInt(process.env.PORT ?? "3000", 10);
  const port = Number.isFinite(parsedPort) && Number.isInteger(parsedPort) ? parsedPort : 3000;

  return {
    host: process.env.HOST ?? "0.0.0.0",
    port,
    publicDir: resolve(projectRoot, "public"),
    storage: getStorageConfig(repoRoot)
  };
}
