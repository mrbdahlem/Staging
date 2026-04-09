import { EventEmitter } from "node:events";

import { afterEach, vi } from "vitest";

import { attachStartupServerErrorHandler, formatStartupError, logStartupFailure } from "./startup.js";
import { log } from "./logger.js";

vi.mock("./logger.js", () => ({
  log: vi.fn()
}));

describe("server startup", () => {
  const originalExitCode = process.exitCode;

  afterEach(() => {
    process.exitCode = originalExitCode;
    vi.clearAllMocks();
  });

  it("formats Error instances as structured log payloads", () => {
    const error = new Error("boom");

    expect(formatStartupError(error)).toEqual({
      name: "Error",
      message: "boom",
      stack: error.stack
    });
  });

  it("logs startup failures and marks the process as failed", () => {
    logStartupFailure(new Error("bind failed"));

    expect(log).toHaveBeenCalledWith("error", "Server failed to start", {
      error: {
        name: "Error",
        message: "bind failed",
        stack: expect.any(String)
      }
    });
    expect(process.exitCode).toBe(1);
  });

  it("handles server error events from app.listen", () => {
    type StartupServer = Parameters<typeof attachStartupServerErrorHandler>[0];
    const server = new EventEmitter();

    attachStartupServerErrorHandler(server as unknown as StartupServer);
    server.emit("error", new Error("EADDRINUSE"));

    expect(log).toHaveBeenCalledWith("error", "Server failed to start", {
      error: {
        name: "Error",
        message: "EADDRINUSE",
        stack: expect.any(String)
      }
    });
    expect(process.exitCode).toBe(1);
  });
});
