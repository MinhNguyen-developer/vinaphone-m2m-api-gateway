import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access } from 'node:fs/promises';
import { createTransport, Transporter } from 'nodemailer';
import { BackupEmailInput, BackupSmtpSettings } from '../backup/backup.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendBackupEmail(input: BackupEmailInput) {
    await this.ensureAttachmentExists(input.attachmentPath);

    const smtp = this.getSmtpSettings();
    const transporter = this.createTransporter(smtp);
    const result = await transporter.sendMail({
      from: input.from || smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      attachments: [
        {
          filename: input.attachmentName,
          path: input.attachmentPath,
          contentType: 'application/octet-stream',
        },
      ],
    });

    this.logger.log(`Backup email sent to ${input.to} with message id ${result.messageId}`);
    return result;
  }

  private createTransporter(smtp: BackupSmtpSettings): Transporter {
    return createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user
        ? {
            user: smtp.user,
            pass: smtp.pass,
          }
        : undefined,
    });
  }

  private async ensureAttachmentExists(attachmentPath: string) {
    try {
      await access(attachmentPath);
    } catch {
      throw new Error(`Backup attachment does not exist: ${attachmentPath}`);
    }
  }

  private getSmtpSettings(): BackupSmtpSettings {
    const host = this.configService.get<string>('smtp.host') ?? '';
    const port = this.configService.get<number>('smtp.port') ?? 587;
    const secure = this.configService.get<boolean>('smtp.secure') ?? false;
    const user = this.configService.get<string>('smtp.user') ?? '';
    const pass = this.configService.get<string>('smtp.pass') ?? '';
    const from = this.configService.get<string>('smtp.from') ?? user;

    if (!host) {
      throw new Error('SMTP host is required to send backup emails');
    }
    if (!from) {
      throw new Error('SMTP from address is required to send backup emails');
    }

    return { host, port, secure, user, pass, from };
  }
}
