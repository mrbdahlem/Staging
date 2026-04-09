import type { Request, Response } from "express";

import { handleApiNotFoundRequest, handleHealthRequest } from "./routes/health.js";

describe("server app", () => {
  it("returns a health payload", () => {
    let jsonPayload: unknown;
    const response = {
      json(payload: unknown) {
        jsonPayload = payload;
      }
    } as Pick<Response, "json">;

    handleHealthRequest({} as never, response as Response, () => undefined);

    expect(jsonPayload).toEqual({
      checkedAt: expect.any(String),
      status: "ok"
    });
  });

  it("returns a JSON 404 for unknown API routes when static hosting is enabled", async () => {
    let statusCode: number | undefined;
    let jsonPayload: unknown;
    const response = {
      json(payload: unknown) {
        jsonPayload = payload;
      },
      status(code: number) {
        statusCode = code;
        return this;
      }
    } as Pick<Response, "json" | "status">;

    handleApiNotFoundRequest({} as Request, response as Response, () => undefined);

    expect(statusCode).toBe(404);
    expect(jsonPayload).toEqual({
      error: "Not Found"
    });
  });
});
