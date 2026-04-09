import { createApp } from "./app.js";
import { getServerConfig } from "./config.js";
import { initializePersistence } from "./db/database.js";
import {
  attachStartupServerErrorHandler,
  logStartupFailure,
  terminateStartupProcess
} from "./startup.js";
import { log } from "./logger.js";

async function startServer() {
  const config = getServerConfig();

  await initializePersistence({
    defaultHealthUrl: config.health.defaultUrl,
    storage: config.storage
  });

  const app = createApp(config.publicDir);

  const server = app.listen(config.port, config.host, () => {
    log("info", "Server started", {
      host: config.host,
      port: config.port,
      storageRoot: config.storage.rootDir
    });
  });

  attachStartupServerErrorHandler(server);
}

startServer().catch((error: unknown) => {
  logStartupFailure(error);
  terminateStartupProcess();
});
