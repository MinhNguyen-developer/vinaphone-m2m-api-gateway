import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
jest.mock('node:child_process', () => ({
  execFile: jest.fn(),
}));

import * as childProcess from 'node:child_process';
import { BackupService } from './backup.service';

describe('BackupService', () => {
  let service: BackupService;
  let backupDirectory: string;
  let configService: {
    get: jest.Mock;
  };
  let emailService: {
    sendBackupEmail: jest.Mock;
  };

  beforeEach(async () => {
    backupDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-service-spec-'));

    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'backup.databaseUrl':
            return 'postgresql://user:pass@localhost:5432/app';
          case 'backup.timezone':
            return 'Asia/Bangkok';
          case 'backup.recipientEmail':
            return 'd9.fatm@gmail.com';
          case 'backup.artifactPrefix':
            return 'vinaphone-backup';
          case 'backup.tempDirectory':
            return backupDirectory;
          case 'smtp.host':
            return 'smtp.example.com';
          case 'smtp.port':
            return 587;
          case 'smtp.secure':
            return false;
          case 'smtp.user':
            return 'mailer@example.com';
          case 'smtp.pass':
            return 'secret';
          case 'smtp.from':
            return 'noreply@example.com';
          default:
            return undefined;
        }
      }),
    };

    emailService = {
      sendBackupEmail: jest.fn().mockResolvedValue({ messageId: 'message-id-1' }),
    };

    service = new BackupService(
      configService as any,
      emailService as any,
    );

    (childProcess.execFile as jest.Mock).mockImplementation(
      (command: string, args: string[], callback: (error?: Error | null) => void) => {
        const fileIndex = args.indexOf('--file');
        const filePath = args[fileIndex + 1];
        void fs.writeFile(filePath, 'backup payload').then(() => callback(null));
        return undefined;
      },
    );
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await fs.rm(backupDirectory, { recursive: true, force: true }).catch(() => undefined);
  });

  it('creates a compressed backup artifact and sends one email', async () => {
    const reference = new Date('2026-07-20T01:00:00Z');

    const result = await service.runScheduledBackup(reference);

    expect(result.status).toBe('completed');
    if (result.status !== 'completed') {
      throw new Error('Expected completed result');
    }
    expect(emailService.sendBackupEmail).toHaveBeenCalledTimes(1);
    expect(result.artifact.fileName).toContain('vinaphone-backup-2026-07-20-08-00');
    await expect(fs.access(result.artifact.filePath)).rejects.toThrow();
  });

  it('does not resend the same backup when the same run is retried', async () => {
    const reference = new Date('2026-07-20T01:00:00Z');

    const first = await service.runScheduledBackup(reference);
    const second = await service.runScheduledBackup(reference);

    expect(first.status).toBe('completed');
    expect(second.status).toBe('completed');
    expect(emailService.sendBackupEmail).toHaveBeenCalledTimes(1);
  });

  it('does not send email when pg_dump fails', async () => {
    (childProcess.execFile as jest.Mock).mockImplementation(
      (command: string, args: string[], callback: (error?: Error | null) => void) => {
        callback(new Error('pg_dump failed'));
        return undefined;
      },
    );
    service = new BackupService(configService as any, emailService as any);

    const result = await service.runScheduledBackup(new Date('2026-07-20T01:00:00Z'));

    expect(result.status).toBe('failed');
    if (result.status !== 'failed') {
      throw new Error('Expected failed result');
    }
    expect(result.failureStage).toBe('backup');
    expect(emailService.sendBackupEmail).not.toHaveBeenCalled();
  });
});
