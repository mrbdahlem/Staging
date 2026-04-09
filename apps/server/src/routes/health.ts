import type { RequestHandler } from "express";

import { createHealthStatus } from "@staging/shared";

export const handleHealthRequest: RequestHandler = (_request, response) => {
  response.json(createHealthStatus("ok"));
};
