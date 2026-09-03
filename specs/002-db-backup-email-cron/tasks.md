# Tasks: Database Backup Email Cron

**Input**: Design docs from `/specs/002-db-backup-email-cron/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included because the feature spec requires validation of window gating, backup creation, email delivery, and runtime behavior.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare runtime dependencies and container support for the backup worker.

- [ ] T001 [P] Add Nodemailer SMTP dependency and typings in package.json for backup email delivery.
- [ ] T002 [P] Update Dockerfile to install PostgreSQL client tools for pg_dump and set TZ=Asia/Bangkok in the production image.
- [ ] T003 [P] Update deploy/docker-compose.prod.yml and deploy/README.md with backup cron, SMTP, and fixed-recipient runtime notes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared config, schedule-window logic, and NestJS wiring that all user stories depend on.

**Checkpoint**: Backup window checks, config parsing, and module scaffolding must exist before story work starts.

- [ ] T004 [P] Add unit tests in src/config/configuration.spec.ts for backup cron, timezone, recipient, and SMTP env parsing.
- [ ] T005 [P] Add unit tests in src/backup/backup-window.spec.ts for Monday-Saturday 07:00-19:00 GMT+7 allow/deny behavior.
- [ ] T006 Implement backup runtime config in src/config/configuration.ts for BACKUP_CRON, BACKUP_TIMEZONE, BACKUP_EMAIL_TO=d9.fatm@gmail.com, and SMTP settings.
- [ ] T007 Implement shared window helper in src/backup/backup-window.ts for Bangkok-time schedule checks.
- [ ] T008 Create the backup and notifications module scaffolding in src/backup/backup.module.ts, src/backup/backup.scheduler.ts, src/backup/backup.service.ts, src/notifications/notifications.module.ts, and src/notifications/email.service.ts.
- [ ] T009 Register ScheduleModule.forRoot() and the new modules in src/app.module.ts.

---

## Phase 3: User Story 1 - Scheduled Database Backup (Priority: P1) 🎯 MVP

**Goal**: Create a fresh compressed database backup artifact on the allowed schedule.

**Independent Test**: Trigger the job inside the allowed window and confirm a compressed backup artifact is created without any Prisma schema changes.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add unit tests in src/backup/backup.service.spec.ts for invoking pg_dump and writing a compressed temp backup artifact.

### Implementation for User Story 1

- [ ] T011 [US1] Implement pg_dump-based backup creation and artifact metadata handling in src/backup/backup.service.ts.
- [ ] T012 [US1] Implement the scheduled trigger and overlap guard in src/backup/backup.scheduler.ts so the job only starts inside the allowed window.
- [ ] T013 [US1] Wire the backup provider exports in src/backup/backup.module.ts so AppModule can invoke the job.

**Checkpoint**: The service can create one backup artifact on demand and skip starting work outside the allowed window.

---

## Phase 4: User Story 2 - Email Delivery of Backup File (Priority: P2)

**Goal**: Email the finished backup to d9.fatm@gmail.com and remove the temp artifact after delivery.

**Independent Test**: Complete one backup run and verify exactly one email with attachment is sent and the temp file is deleted.

### Tests for User Story 2

- [ ] T014 [P] [US2] Add unit tests in src/notifications/email.service.spec.ts for SMTP attachment delivery to d9.fatm@gmail.com and failure when the artifact is missing.
- [ ] T015 [P] [US2] Extend src/backup/backup.service.spec.ts with tests that a successful backup sends exactly one email and a backup failure sends no email.

### Implementation for User Story 2

- [ ] T016 [US2] Implement Nodemailer SMTP transport and attachment delivery in src/notifications/email.service.ts.
- [ ] T017 [US2] Integrate email handoff, failure-stage logging, duplicate-send protection, and temp-file cleanup in src/backup/backup.service.ts.
- [ ] T018 [US2] Bind the email service provider in src/notifications/notifications.module.ts and import it from src/backup/backup.module.ts.

**Checkpoint**: A successful backup run can send one attachment email and clean up the artifact without sending partial or duplicate mail.

---

## Phase 5: User Story 3 - Production Window Enforcement (Priority: P3)

**Goal**: Ensure the cron only executes Monday-Saturday between 07:00 and 19:00 GMT+7.

**Independent Test**: Simulate allowed and disallowed triggers and verify only the allowed ones reach the backup service.

### Tests for User Story 3

- [ ] T019 [P] [US3] Add unit tests in src/backup/backup.scheduler.spec.ts for allowed-window execution, Sunday skip, and outside-hours skip in Asia/Bangkok.
- [ ] T020 [P] [US3] Add e2e/smoke coverage in test/backup-email-cron.e2e-spec.ts for BACKUP_CRON/BACKUP_TIMEZONE wiring and skipped runs outside the window.

### Implementation for User Story 3

- [ ] T021 [US3] Finalize cron registration and runtime window checks in src/backup/backup.scheduler.ts using BACKUP_CRON and BACKUP_TIMEZONE.
- [ ] T022 [US3] Harden schedule validation in src/backup/backup-window.ts so misconfigured cron values still skip outside Monday-Saturday 07:00-19:00 GMT+7.
- [ ] T023 [US3] Update deploy/docker-compose.prod.yml and deploy/README.md with the fixed recipient, SMTP settings, and the production requirement for pg_dump and Bangkok time.

**Checkpoint**: The runtime guard and cron wiring prevent execution outside the permitted production window.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full workflow, confirm runtime packaging, and verify no schema migration was introduced.

- [ ] T024 Run the validation flow in specs/002-db-backup-email-cron/quickstart.md and confirm one backup artifact, one email, and cleanup after a successful run.
- [ ] T025 [P] Verify the built Docker image and compose runtime in Dockerfile and deploy/docker-compose.prod.yml expose pg_dump and use TZ=Asia/Bangkok.
- [ ] T026 Confirm prisma/schema.prisma and prisma/migrations/ remain unchanged so no Prisma schema migration is introduced.

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependencies and can start immediately.
- Foundational work (Phase 2) depends on Setup and blocks all story work.
- User Story 1 (Phase 3) depends on the shared foundation.
- User Story 2 (Phase 4) depends on User Story 1 because it consumes the backup artifact produced there.
- User Story 3 (Phase 5) depends on the shared foundation and the scheduler created for User Story 1.
- Polish (Phase 6) depends on all desired story work being complete.

### Parallel Opportunities

- T001-T003 can run in parallel.
- T004-T005 can run in parallel.
- T014-T015 can run in parallel.
- T019-T020 can run in parallel.
- T025 can run alongside T024 and T026 once implementation is complete.

### Implementation Strategy

1. Complete Phase 1 and Phase 2 first.
2. Ship Phase 3 for the MVP backup workflow.
3. Add Phase 4 email delivery and cleanup.
4. Finish Phase 5 production window enforcement and deployment wiring.
5. Run Phase 6 validation and confirm no Prisma migration was added.
