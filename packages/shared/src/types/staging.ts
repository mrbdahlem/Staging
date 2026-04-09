export type DeploymentStatus =
  | "pending"
  | "preparing"
  | "restarting"
  | "health_checking"
  | "success"
  | "failed";

export type DeploymentType = "deploy" | "rollback";

export interface ProjectRecord {
  id: number;
  key: string;
  name: string;
  description: string | null;
  runtimeType: string;
  artifactKind: string;
  deployDriver: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentRecord {
  id: number;
  projectId: number;
  key: string;
  name: string;
  description: string | null;
  containerName: string;
  dockerComposeFile: string;
  dockerComposeProject: string;
  deployPointerPath: string | null;
  generatedEnvDir: string;
  healthUrl: string | null;
  logsPath: string;
  activeArtifactId: number | null;
  activeDeploymentId: number | null;
}

export interface ArtifactRecord {
  id: number;
  projectId: number;
  source: string | null;
  repo: string | null;
  workflowRunId: number | null;
  artifactName: string;
  filename: string;
  localPath: string | null;
  branch: string | null;
  commitSha: string | null;
  commitMessage: string | null;
  actor: string | null;
  createdAt: string;
  downloadedAt: string | null;
  checksumSha256: string | null;
  sizeBytes: number | null;
  status: string;
  notes: string | null;
}

export interface DeploymentRecord {
  id: number;
  projectId: number;
  environmentId: number;
  artifactId: number | null;
  type: DeploymentType;
  status: DeploymentStatus;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  requestedBy: string | null;
  previousArtifactId: number | null;
  resolvedArtifactPath: string | null;
  resolvedEnvPath: string | null;
  artifactSha256: string | null;
  envSha256: string | null;
  containerId: string | null;
  logPath: string | null;
  logCaptureStartedAt: string | null;
  logCaptureFinishedAt: string | null;
  healthStatus: string | null;
  healthMessage: string | null;
  notes: string | null;
}
