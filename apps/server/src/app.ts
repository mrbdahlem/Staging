import { existsSync } from "node:fs";
import { join } from "node:path";

import express from "express";

import { log } from "./logger.js";
import { handleApiNotFoundRequest, handleHealthRequest } from "./routes/health.js";

export function createApp(publicDir: string) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/api/health", handleHealthRequest);

  if (existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.all("/api/*path", handleApiNotFoundRequest);

    app.get(["/", "/*path"], (_request, response) => {
      response.sendFile(join(publicDir, "index.html"));
    });
  } else {
    app.get("/", (_request, response) => {
      response.type("text/plain").send("Staging server is running. Build the web app to serve the SPA.");
    });
  }

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    log("error", "Unhandled request error", {
      error: error instanceof Error ? error.message : "unknown"
    });

    response.status(500).json({
      error: "Internal Server Error"
    });
  });

  return app;
}
