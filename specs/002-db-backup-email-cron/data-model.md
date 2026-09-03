# Data Model: Database Backup Email Cron

## Entities

### Backup Job Config

**Purpose**: Describes the runtime settings for the scheduled backup workflow.

**Relevant fields**:
- `cronExpression`
- `timezone`
- `allowedDays`
- `windowStart`
- `windowEnd`
- `recipientEmail`
- `smtpHost`
- `smtpPort`
- `smtpUser`
- `smtpFrom`

**Relationships**:
- Controls every `Backup Run`.
- Provides configuration for SMTP delivery and schedule validation.

**Validation rules**:
- The timezone must be `Asia/Bangkok` (GMT+7) for production.
- The allowed schedule window must be Monday through Saturday from 07:00 to 19:00.
- The recipient email must be `d9.fatm@gmail.com` for this feature.

### Backup Run

**Purpose**: Represents one scheduled execution of the backup workflow.

**Relevant fields**:
- `runId`
- `scheduledFor`
- `startedAt`
- `finishedAt`
- `status`
- `skippedReason`
- `failureStage`
- `failureMessage`
- `backupFileName`
- `backupFileSizeBytes`
- `emailSentAt`
- `cleanupAt`

**Relationships**:
- Produces one `Backup Artifact` when successful.
- Sends one `Email Dispatch` when the backup succeeds.

**State transitions**:
- `scheduled` -> `running`
- `scheduled` -> `skipped` when outside the allowed window
- `running` -> `backup-created`
- `backup-created` -> `emailed`
- `emailed` -> `cleaned-up`
- Any running state -> `failed` on backup or email error

### Backup Artifact

**Purpose**: The temporary dump file created from the PostgreSQL database.

**Relevant fields**:
- `filePath`
- `fileName`
- `mimeType`
- `compressionFormat`
- `sizeBytes`
- `createdAt`
- `deletedAt`

**Relationships**:
- Belongs to one `Backup Run`.
- Is attached to one `Email Dispatch` when successful.

**Validation rules**:
- Must exist before email send starts.
- Must be deleted after successful email delivery or on cleanup failure handling.

### Email Dispatch

**Purpose**: Represents the SMTP send operation for the backup attachment.

**Relevant fields**:
- `recipientEmail`
- `subject`
- `attachmentName`
- `sentAt`
- `transportStatus`
- `failureReason`

**Relationships**:
- Belongs to one `Backup Run`.
- References one `Backup Artifact`.

### Schedule Window

**Purpose**: Encodes the production operating hours for the cron job.

**Relevant fields**:
- `timezone`
- `allowedDays`
- `startHour`
- `endHour`
- `cronCadence`

**Validation rules**:
- Only Monday through Saturday are allowed.
- Only 07:00-19:00 in Bangkok time is allowed.
- The cron cadence should stay inside the allowed window even if misconfigured.

## Schema impact

- No Prisma schema changes are required for this feature.
- Backup run metadata is operational data handled in logs and transient files, not a new database table.
