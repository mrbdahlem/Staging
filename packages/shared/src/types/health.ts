export type HealthState = "degraded" | "ok" | "unknown";

export interface HealthStatus {
  checkedAt: string;
  status: HealthState;
}
