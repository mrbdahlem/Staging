import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const sourceDir = resolve(repoRoot, "apps/web/dist");
const targetDir = resolve(repoRoot, "apps/server/public");

try {
  const sourceStats = await stat(sourceDir);

  if (!sourceStats.isDirectory()) {
    throw new Error("Web build output path is not a directory.");
  }
} catch (error) {
  throw new Error("Web build output was not found at apps/web/dist. Run `npm run build --workspace @staging/web` first.", {
    cause: error
  });
}

await rm(targetDir, { force: true, recursive: true });
await mkdir(targetDir, { recursive: true });
await cp(sourceDir, targetDir, { recursive: true });
