import { createApp } from "./app.js";
import { getServerConfig } from "./config.js";
import { initializePersistence } from "./db/database.js";
import { log } from "./logger.js";

async function startServer() {
  const config = getServerConfig();

  await initializePersistence(config.storage);

  const app = createApp(config.publicDir);

  app.listen(config.port, config.host, () => {
    log("info", "Server started", {
      host: config.host,
      port: config.port,
      storageRoot: config.storage.rootDir
    });
  });
}

startServer().catch((error: unknown) => {
  log("error", "Server failed to start", {
    error: error instanceof Error ? error.message : "unknown"
  });

  process.exitCode = 1;
});
