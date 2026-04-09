import { EventEmitter } from "node:events";

import { afterEach, beforeEach, vi } from "vitest";

import {
  attachStartupServerErrorHandler,
  formatStartupError,
  logStartupFailure,
  terminateStartupProcess
} from "./startup.js";
import { log } from "./logger.js";

vi.mock("./logger.js", () => ({
  log: vi.fn()
}));

describe("server startup", () => {
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(((code?: string | number | null) => code as never) as typeof process.exit);
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("formats Error instances as structured log payloads", () => {
    const error = new Error("boom");

    expect(formatStartupError(error)).toEqual({
      name: "Error",
      message: "boom",
      stack: error.stack
    });
  });

  it("formats non-Error startup failures as strings", () => {
    expect(formatStartupError("boom")).toBe("boom");
    expect(formatStartupError({ boom: true })).toBe("[object Object]");
  });

  it("logs startup failures", () => {
    logStartupFailure(new Error("bind failed"));

    expect(log).toHaveBeenCalledWith("error", "Server failed to start", {
      error: {
        name: "Error",
        message: "bind failed",
        stack: expect.any(String)
      }
    });
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it("terminates the process with a failing exit code", () => {
    terminateStartupProcess();

    expect(processExitSpy).toHaveBeenCalledWith(1);
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
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
