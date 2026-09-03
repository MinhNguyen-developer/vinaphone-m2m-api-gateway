import configuration from './configuration';

describe('configuration', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exposes backup and SMTP defaults', () => {
    delete process.env.BACKUP_CRON;
    delete process.env.BACKUP_TIMEZONE;
    delete process.env.BACKUP_EMAIL_TO;
    delete process.env.BACKUP_ARTIFACT_PREFIX;
    delete process.env.BACKUP_TEMP_DIRECTORY;
    delete process.env.DATABASE_URL;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;

    const config = configuration();

    expect(config.backup).toMatchObject({
      cron: '0 18 * * 1-6',
      timezone: 'Asia/Bangkok',
      databaseUrl: '',
      recipientEmail: 'd9.fatm@gmail.com',
      artifactPrefix: 'vinaphone-backup',
      tempDirectory: '',
    });
    expect(config.smtp).toMatchObject({
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from: '',
    });
  });

  it('reads backup and SMTP overrides from environment variables', () => {
    process.env.BACKUP_CRON = '0 17 * * 1-6';
    process.env.BACKUP_TIMEZONE = 'Asia/Bangkok';
    process.env.BACKUP_EMAIL_TO = 'backup@example.com';
    process.env.BACKUP_ARTIFACT_PREFIX = 'daily-backup';
    process.env.BACKUP_TEMP_DIRECTORY = '/tmp/backups';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/app';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'mailer@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'noreply@example.com';

    const config = configuration();

    expect(config.backup).toMatchObject({
      cron: '0 17 * * 1-6',
      timezone: 'Asia/Bangkok',
      databaseUrl: 'postgresql://user:pass@localhost:5432/app',
      recipientEmail: 'backup@example.com',
      artifactPrefix: 'daily-backup',
      tempDirectory: '/tmp/backups',
    });
    expect(config.smtp).toMatchObject({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: 'mailer@example.com',
      pass: 'secret',
      from: 'noreply@example.com',
    });
  });
});
