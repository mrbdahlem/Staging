import type { Server } from "node:http";

import { log } from "./logger.js";

export function formatStartupError(error: unknown) {
  return error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    : "unknown";
}

export function logStartupFailure(error: unknown) {
  log("error", "Server failed to start", {
    error: formatStartupError(error)
  });

  process.exitCode = 1;
}

export function attachStartupServerErrorHandler(server: Server) {
  server.on("error", (error) => {
    logStartupFailure(error);
  });
}
