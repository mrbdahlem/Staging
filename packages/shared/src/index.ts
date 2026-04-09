import type { HealthState, HealthStatus } from "./types/health.js";
import type {
  ArtifactRecord,
  DeploymentRecord,
  DeploymentStatus,
  DeploymentType,
  EnvironmentRecord,
  ProjectRecord
} from "./types/staging.js";

export type { HealthState, HealthStatus };
export type {
  ArtifactRecord,
  DeploymentRecord,
  DeploymentStatus,
  DeploymentType,
  EnvironmentRecord,
  ProjectRecord
};

export function createHealthStatus(status: HealthState): HealthStatus {
  return {
    checkedAt: new Date().toISOString(),
    status
  };
}
