import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = fileURLToPath(new URL(".", import.meta.url));

export function getServerConfig() {
  const projectRoot = resolve(sourceDir, "..");
  const parsedPort = Number.parseInt(process.env.PORT ?? "3000", 10);
  const port = Number.isFinite(parsedPort) && Number.isInteger(parsedPort) ? parsedPort : 3000;

  return {
    host: process.env.HOST ?? "0.0.0.0",
    port,
    publicDir: resolve(projectRoot, "public")
  };
}
