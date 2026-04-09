import type { HealthState, HealthStatus } from "./types/health.js";

export type { HealthState, HealthStatus };

export function createHealthStatus(status: HealthState): HealthStatus {
  return {
    checkedAt: new Date().toISOString(),
    status
  };
}
