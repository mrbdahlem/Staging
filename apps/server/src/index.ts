import { createApp } from "./app.js";
import { getServerConfig } from "./config.js";
import { log } from "./logger.js";

const config = getServerConfig();
const app = createApp(config.publicDir);

app.listen(config.port, config.host, () => {
  log("info", "Server started", {
    host: config.host,
    port: config.port
  });
});
