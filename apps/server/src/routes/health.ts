import type { RequestHandler } from "express";

import { createHealthStatus } from "@staging/shared";

export const handleHealthRequest: RequestHandler = (_request, response) => {
  response.json(createHealthStatus("ok"));
};

export const handleApiNotFoundRequest: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: "Not Found"
  });
};
