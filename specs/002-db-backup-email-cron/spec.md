# Feature Specification: Database Backup Email Cron

**Feature Branch**: `002-db-backup-email-cron`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Create a cron job that backs up the database, emails the backup file to d9.fatm@gmail.com, and only runs Monday-Saturday from 07:00 to 19:00 GMT+7 (Bangkok)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scheduled Database Backup (Priority: P1)

As an operator, I want the system to create a fresh database backup on a recurring
schedule, so that I have a recent recovery point without starting the process manually.

**Why this priority**: The backup is the primary value of the feature. If no backup is
produced, the cron job does not meet its purpose.

**Independent Test**: Run one scheduled cycle inside the allowed window and verify that a
new backup artifact is created for the current database state.

**Acceptance Scenarios**:

1. **Given** the scheduled time is inside the allowed window, **When** the job runs,
   **Then** a new database backup is created.
2. **Given** the scheduled time is outside the allowed window, **When** the cron fires,
   **Then** no backup attempt starts.

---

### User Story 2 - Email Delivery of Backup File (Priority: P2)

As an operator, I want the backup file emailed to d9.fatm@gmail.com after a successful
backup, so that I receive the backup without logging into the server.

**Why this priority**: The backup is only useful if it reaches the configured recipient in
a usable form.

**Independent Test**: Complete a successful backup run and confirm that the recipient
receives one email containing the backup file as an attachment.

**Acceptance Scenarios**:

1. **Given** a backup completes successfully, **When** the job finishes, **Then** an
   email with the backup attachment is sent to d9.fatm@gmail.com.
2. **Given** the backup cannot be created, **When** the job fails, **Then** no empty or
   partial backup email is sent.

---

### User Story 3 - Production Window Enforcement (Priority: P3)

As an operator, I want the cron job to run only on Monday through Saturday between 07:00
and 19:00 GMT+7, so that it respects the production environment's operating window.

**Why this priority**: The schedule constraint is mandatory for production safety, but it
supports the main backup-and-email workflow rather than replacing it.

**Independent Test**: Simulate schedule triggers across allowed and disallowed times and
verify that only runs inside the allowed window execute the backup workflow.

**Acceptance Scenarios**:

1. **Given** it is Monday through Saturday between 07:00 and 19:00 GMT+7, **When** the
   cron trigger occurs, **Then** the job may run.
2. **Given** it is Sunday or outside the allowed hours, **When** the cron trigger occurs,
   **Then** the job is skipped.

### Edge Cases

- The backup starts near the end of the allowed window and finishes after 19:00 GMT+7.
- The email service fails after the backup file has been created.
- The backup file exceeds the email attachment limit.
- The job is triggered on Sunday or while the EC2 host is restarting.
- A transient failure occurs and the job is retried for the same scheduled run.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a database backup on a recurring daily schedule.
- **FR-002**: System MUST send each successful backup file to d9.fatm@gmail.com as an
  email attachment.
- **FR-003**: System MUST only execute the scheduled job on Monday through Saturday
  between 07:00 and 19:00 GMT+7 (Bangkok time).
- **FR-004**: System MUST skip scheduled runs outside the allowed window instead of
  starting a backup.
- **FR-005**: System MUST not send an empty or partial backup email when backup creation
  fails.
- **FR-006**: System MUST surface backup or email delivery failures so operators can tell
  which step failed.
- **FR-007**: System MUST prevent duplicate emails for the same scheduled backup run when
  a transient retry occurs.

### Key Entities *(include if feature involves data)*

- **Backup Job**: The scheduled workflow that creates the backup and sends the email.
- **Backup Artifact**: The generated backup file that is attached to the email.
- **Delivery Recipient**: The fixed email address that receives the backup.
- **Schedule Window**: The allowed execution period defined by day and time.
- **Job Result**: The outcome of one scheduled run, including success or failure details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: During a 7-day validation period, every scheduled run inside the allowed
  window creates a backup and sends one email with the backup attached.
- **SC-002**: During the same validation period, zero scheduled runs start outside the
  allowed Monday-Saturday 07:00-19:00 GMT+7 window.
- **SC-003**: 100% of successful backup runs deliver the backup email to
  d9.fatm@gmail.com within 15 minutes of the scheduled start under normal operating
  conditions.
- **SC-004**: Any backup or email failure is observable to operators within 5 minutes of
  the failed run.

## Assumptions

- The production database is PostgreSQL.
- Bangkok time (GMT+7) is the reference timezone for schedule evaluation.
- The recipient address is fixed to d9.fatm@gmail.com for this feature.
- An outbound email service is available in production.
- The backup file is treated as sensitive operational data.
