import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = fileURLToPath(new URL(".", import.meta.url));

export function getServerConfig() {
  const projectRoot = resolve(sourceDir, "..");

  return {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number.parseInt(process.env.PORT ?? "3000", 10),
    publicDir: resolve(projectRoot, "public")
  };
}
