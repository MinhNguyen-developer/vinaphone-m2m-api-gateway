import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let tempDirectory: string;
  let configService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'email-service-spec-'));

    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
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

    service = new EmailService(configService as unknown as ConfigService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await fs.rm(tempDirectory, { recursive: true, force: true }).catch(() => undefined);
  });

  it('sends the backup as a single attachment', async () => {
    const attachmentPath = path.join(tempDirectory, 'backup.dump');
    await fs.writeFile(attachmentPath, 'backup content');

    const sendMail = jest.fn().mockResolvedValue({ messageId: 'message-id-1' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail,
    } as any);

    const result = await service.sendBackupEmail({
      from: 'noreply@example.com',
      to: 'd9.fatm@gmail.com',
      subject: 'Vinaphone backup',
      text: 'Attached backup file',
      attachmentPath,
      attachmentName: 'backup.dump',
    });

    expect(result.messageId).toBe('message-id-1');
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@example.com',
        to: 'd9.fatm@gmail.com',
        subject: 'Vinaphone backup',
      }),
    );
    expect(sendMail.mock.calls[0][0].attachments).toEqual([
      expect.objectContaining({
        filename: 'backup.dump',
        path: attachmentPath,
      }),
    ]);
  });

  it('fails when the backup attachment is missing', async () => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: jest.fn(),
    } as any);

    await expect(
      service.sendBackupEmail({
        from: 'noreply@example.com',
        to: 'd9.fatm@gmail.com',
        subject: 'Vinaphone backup',
        text: 'Attached backup file',
        attachmentPath: path.join(tempDirectory, 'missing.dump'),
        attachmentName: 'missing.dump',
      }),
    ).rejects.toThrow('Backup attachment does not exist');
  });
});
