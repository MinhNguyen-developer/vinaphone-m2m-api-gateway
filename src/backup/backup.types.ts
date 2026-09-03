export interface BackupSmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface BackupRuntimeSettings {
  databaseUrl: string;
  timezone: string;
  recipientEmail: string;
  artifactPrefix: string;
  tempDirectory: string;
  smtp: BackupSmtpSettings;
}

export interface BackupArtifact {
  filePath: string;
  fileName: string;
  sizeBytes: number;
  createdAt: Date;
}

export interface BackupEmailInput {
  from: string;
  to: string;
  subject: string;
  text: string;
  attachmentPath: string;
  attachmentName: string;
}

export interface BackupRunBase {
  runKey: string;
  startedAt: Date;
  finishedAt: Date;
}

export interface BackupRunSkipped extends BackupRunBase {
  status: 'skipped';
  reason: string;
}

export interface BackupRunFailed extends BackupRunBase {
  status: 'failed';
  failureStage: 'backup' | 'email' | 'cleanup';
  failureMessage: string;
  artifact?: BackupArtifact;
}

export interface BackupRunCompleted extends BackupRunBase {
  status: 'completed';
  artifact: BackupArtifact;
  emailMessageId: string;
  cleanupWarning?: string;
}

export type BackupRunResult =
  | BackupRunSkipped
  | BackupRunFailed
  | BackupRunCompleted;
