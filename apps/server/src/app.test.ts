import type { Response } from "express";

import { handleHealthRequest } from "./routes/health.js";

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
});
