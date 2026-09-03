import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as childProcess from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { EmailService } from '../notifications/email.service';
import {
  BackupArtifact,
  BackupEmailInput,
  BackupRunCompleted,
  BackupRunFailed,
  BackupRunResult,
  BackupRuntimeSettings,
} from './backup.types';
import { getBackupRunKey } from './backup-window';

const execFileAsync = promisify(childProcess.execFile);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly activeRuns = new Map<string, Promise<BackupRunResult>>();
  private readonly completedRuns = new Map<string, BackupRunCompleted>();

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async runScheduledBackup(triggeredAt = new Date()): Promise<BackupRunResult> {
    const settings = this.getRuntimeSettings();
    const runKey = getBackupRunKey(triggeredAt, settings.timezone);

    const cached = this.completedRuns.get(runKey);
    if (cached) {
      this.logger.debug(`Backup run ${runKey} already completed; returning cached result`);
      return cached;
    }

    const inFlight = this.activeRuns.get(runKey);
    if (inFlight) {
      return inFlight;
    }

    const task = this.performBackupRun(triggeredAt, runKey, settings).finally(() => {
      this.activeRuns.delete(runKey);
    });

    this.activeRuns.set(runKey, task);
    return task;
  }

  private async performBackupRun(
    triggeredAt: Date,
    runKey: string,
    settings: BackupRuntimeSettings,
  ): Promise<BackupRunResult> {
    const startedAt = new Date();
    const workspaceDir = await fs.mkdtemp(
      path.join(settings.tempDirectory || os.tmpdir(), 'vinaphone-backup-'),
    );
    const fileName = `${settings.artifactPrefix}-${runKey}.dump`;
    const filePath = path.join(workspaceDir, fileName);

    try {
      await this.createDatabaseBackup(filePath, settings.databaseUrl);
    } catch (error) {
      await this.cleanupWorkspace(workspaceDir).catch((cleanupError) => {
        this.logger.warn(
          `Cleanup after backup failure also failed for ${runKey}: ${this.describeError(cleanupError)}`,
        );
      });

      return this.buildFailureResult(runKey, startedAt, 'backup', error);
    }

    const artifact = await this.buildArtifact(filePath, fileName);

    try {
      const emailInput: BackupEmailInput = {
        from: settings.smtp.from,
        to: settings.recipientEmail,
        subject: `Vinaphone database backup ${runKey}`,
        text: `Backup generated at ${runKey} (Asia/Bangkok).`,
        attachmentPath: artifact.filePath,
        attachmentName: artifact.fileName,
      };

      const emailResult = await this.emailService.sendBackupEmail(emailInput);
      const completedAt = new Date();
      const result: BackupRunCompleted = {
        runKey,
        status: 'completed',
        startedAt,
        finishedAt: completedAt,
        artifact,
        emailMessageId: emailResult.messageId,
      };
      this.completedRuns.set(runKey, result);

      try {
        await this.cleanupWorkspace(workspaceDir);
      } catch (cleanupError) {
        result.cleanupWarning = this.describeError(cleanupError);
        this.logger.warn(
          `Backup run ${runKey} completed but cleanup failed: ${result.cleanupWarning}`,
        );
      }

      return result;
    } catch (error) {
      await this.cleanupWorkspace(workspaceDir).catch((cleanupError) => {
        this.logger.warn(
          `Cleanup after email failure also failed for ${runKey}: ${this.describeError(cleanupError)}`,
        );
      });

      return this.buildFailureResult(runKey, startedAt, 'email', error, artifact);
    }
  }

  private async createDatabaseBackup(filePath: string, databaseUrl: string) {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required to create a backup');
    }

    await execFileAsync('pg_dump', [
      '--dbname',
      databaseUrl,
      '--format=custom',
      '--file',
      filePath,
      '--no-owner',
      '--no-privileges',
    ]);
  }

  private async buildArtifact(filePath: string, fileName: string): Promise<BackupArtifact> {
    const stats = await fs.stat(filePath);
    return {
      filePath,
      fileName,
      sizeBytes: stats.size,
      createdAt: new Date(),
    };
  }

  private async cleanupWorkspace(workspaceDir: string) {
    await fs.rm(workspaceDir, { recursive: true, force: true });
  }

  private buildFailureResult(
    runKey: string,
    startedAt: Date,
    failureStage: 'backup' | 'email' | 'cleanup',
    error: unknown,
    artifact?: BackupArtifact,
  ): BackupRunFailed {
    return {
      runKey,
      status: 'failed',
      startedAt,
      finishedAt: new Date(),
      failureStage,
      failureMessage: this.describeError(error),
      ...(artifact ? { artifact } : {}),
    };
  }

  private getRuntimeSettings(): BackupRuntimeSettings {
    const databaseUrl = this.configService.get<string>('backup.databaseUrl') ?? '';
    const timezone = this.configService.get<string>('backup.timezone') ?? 'Asia/Bangkok';
    const recipientEmail =
      this.configService.get<string>('backup.recipientEmail') ?? 'd9.fatm@gmail.com';
    const artifactPrefix =
      this.configService.get<string>('backup.artifactPrefix') ?? 'vinaphone-backup';
    const tempDirectory = this.configService.get<string>('backup.tempDirectory') ?? '';

    const smtp = {
      host: this.configService.get<string>('smtp.host') ?? '',
      port: this.configService.get<number>('smtp.port') ?? 587,
      secure: this.configService.get<boolean>('smtp.secure') ?? false,
      user: this.configService.get<string>('smtp.user') ?? '',
      pass: this.configService.get<string>('smtp.pass') ?? '',
      from: this.configService.get<string>('smtp.from') ?? '',
    };

    if (!databaseUrl) {
      throw new Error('Backup database URL is required');
    }

    return {
      databaseUrl,
      timezone,
      recipientEmail,
      artifactPrefix,
      tempDirectory,
      smtp,
    };
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return typeof error === 'string' ? error : 'Unknown error';
  }
}
