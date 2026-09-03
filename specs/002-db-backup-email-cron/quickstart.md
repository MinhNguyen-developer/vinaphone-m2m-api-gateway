# Quickstart: Validate Database Backup Email Cron

## Prerequisites

- `npm install`
- A reachable PostgreSQL database configured in `.env`
- SMTP credentials for the email account or relay used in production
- The production image or local environment must include `pg_dump`

## Setup

1. Configure the backup-related environment variables.

```bash
BACKUP_CRON="0 18 * * 1-6"
BACKUP_TIMEZONE="Asia/Bangkok"
BACKUP_EMAIL_TO="d9.fatm@gmail.com"
SMTP_HOST="<smtp-host>"
SMTP_PORT="587"
SMTP_USER="<smtp-user>"
SMTP_PASS="<smtp-password>"
SMTP_FROM="<from-address>"
```

2. Apply database migrations if needed.

```bash
npm run db:migrate
```

3. Start the service.

```bash
npm run start:dev
```

## End-to-end validation

1. Temporarily set the cron to fire frequently for a smoke test, while keeping the runtime window inside Monday-Saturday 07:00-19:00 Bangkok time.
2. Confirm the logs show a backup run starting, a dump file being created, and an email being sent with the backup attached.
3. Verify that `d9.fatm@gmail.com` receives exactly one message for the run.
4. Change the test schedule to an outside-window time or run the test on Sunday and confirm the job is skipped.

## Validation commands

- `npm run test`
- `npm run test:e2e`

Expected outcome: the scheduled job creates one backup artifact per allowed run, emails the file successfully, skips outside the allowed window, and leaves no lingering temp file after delivery.
