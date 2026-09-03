# Research: Database Backup Email Cron

## Decision 1: Use NestJS scheduling inside the API service

Decision: Run the backup job from the NestJS application using `@nestjs/schedule`.

Rationale: The repository already uses NestJS and exposes its operational jobs through the API service. Keeping the scheduler in-process makes the Bangkok-time window check, backup creation, logging, and email delivery part of one observable workflow.

Alternatives considered: Host-level `crontab` on EC2, AWS EventBridge, or a separate worker container. Those options add more operational surfaces without reducing feature scope.

## Decision 2: Use `pg_dump` to create the backup artifact

Decision: Generate the backup with PostgreSQL's `pg_dump` CLI and store it as a temporary compressed dump file.

Rationale: `pg_dump` is the standard logical-backup tool for PostgreSQL and produces a portable restore artifact. Using it avoids inventing a custom export format and keeps the restore path straightforward.

Alternatives considered: Prisma-based export, database snapshots, or raw SQL row dumps. Those approaches are either incomplete as full backups or require more infrastructure than this feature needs.

## Decision 3: Send the backup email through SMTP with Nodemailer

Decision: Use Nodemailer with environment-driven SMTP settings to send the backup attachment to the fixed recipient.

Rationale: SMTP is broadly deployable on EC2, easy to configure from environment variables, and does not bind the feature to a single cloud email API.

Alternatives considered: Gmail API, Amazon SES, SendGrid, or a local MTA. These are all valid, but SMTP gives the smallest implementation footprint for the current codebase.

## Decision 4: Enforce the operating window at runtime and default the cron to the end of the window

Decision: Default the cron to a daily Mon-Sat run near the end of the allowed window and add a runtime guard that checks Monday-Saturday 07:00-19:00 GMT+7 (Bangkok) before the backup starts.

Rationale: The default schedule keeps the job within the EC2 operating hours, while the runtime guard protects against misconfiguration, clock drift, or an unexpected schedule change.

Alternatives considered: Hourly polling, a Sunday-safe host cron, or relying on the cron expression alone. Those approaches are less safe if the deployment schedule changes.

## Decision 5: Use temporary local storage and clean up after successful delivery

Decision: Write the backup artifact to temporary local storage, email it, and delete it after the send succeeds or on failure cleanup.

Rationale: The backup is immediately delivered by email, so persistent retention is not required for this feature. Temporary storage keeps disk usage bounded on EC2.

Alternatives considered: Persistent volume retention or uploading the file to object storage first. Those add retention complexity that the feature does not require.

## Operational Notes

- The production image must include the PostgreSQL client tools so `pg_dump` is available.
- The feature should log the failure stage clearly: window skip, backup failure, email failure, or cleanup failure.
- The backup email recipient is fixed to d9.fatm@gmail.com for this feature.
