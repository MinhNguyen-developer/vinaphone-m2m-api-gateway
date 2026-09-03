# Implementation Plan: Database Backup Email Cron

**Branch**: `002-db-backup-email-cron` | **Date**: 2026-07-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

## Summary

Add an internal scheduled maintenance workflow to the NestJS API that creates a
database backup, emails the backup file to d9.fatm@gmail.com, and only executes inside
the Monday-Saturday 07:00-19:00 GMT+7 window. The feature runs inside the existing API
service, uses a Bangkok-time cron schedule by default, writes a temporary compressed
backup artifact, sends it via SMTP, and deletes the artifact after delivery.

## Technical Context

**Language/Version**: TypeScript 5.x on NestJS 11

**Primary Dependencies**: `@nestjs/schedule`, `@nestjs/config`, Prisma 7,
`postgresql-client` (`pg_dump`/`pg_restore`), Nodemailer, Jest

**Storage**: PostgreSQL source database; temporary filesystem backup artifact only; no
schema migration is expected for this feature

**Testing**: Jest unit tests for window gating, backup creation, and email delivery;
e2e/smoke validation for scheduled execution and attachment delivery

**Target Platform**: Node.js service in Docker on Ubuntu 24 LTS EC2

**Project Type**: Single backend API service with an internal scheduled worker

**Performance Goals**: Complete one scheduled backup-and-email cycle within 15 minutes
of the scheduled start under normal operating conditions; clean up temporary backup
files after delivery

**Constraints**: Must not run outside Monday-Saturday 07:00-19:00 GMT+7 (Bangkok),
must not email without a valid backup file, must avoid duplicate email on retry, and
must have `pg_dump` available in the production image

**Scale/Scope**: One PostgreSQL instance, one fixed recipient, one backup artifact per
run

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Code quality and domain clarity: PASS. The design separates scheduling, backup
  creation, and email transport into focused services.
- Test-first verification: PASS. The implementation will add failing tests for the
  schedule window, backup generation, and email delivery before code is finalized.
- User experience consistency: PASS. This feature is internal and does not change any
  public HTTP contract.
- Performance budgets and efficient data access: PASS. The design uses one backup dump
  per run, compression, and immediate cleanup to keep runtime bounded.
- Reliability, observability, and safe change control: PASS. The design includes a run
  lock, explicit failure-stage logging, and a runtime guard for the allowed operating
  window.

## Project Structure

### Documentation (this feature)

```text
specs/002-db-backup-email-cron/
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

### Source Code (repository root)

```text
src/
├── app.module.ts                 # register ScheduleModule and feature modules
├── main.ts
├── config/
│   └── configuration.ts          # backup cron / SMTP / recipient env config
├── backup/
│   ├── backup.module.ts
│   ├── backup.scheduler.ts       # scheduled trigger + Bangkok window guard
│   ├── backup.service.ts         # pg_dump orchestration, email handoff, cleanup
│   └── backup-window.ts          # allowed-day/time evaluation helper
├── notifications/
│   ├── notifications.module.ts
│   └── email.service.ts          # SMTP transport and attachment delivery
├── prisma/
└── generated/

Dockerfile                        # install postgresql-client and runtime deps
deploy/
├── docker-compose.prod.yml       # production env vars for SMTP and backup cron
└── README.md                     # deployment notes for the backup workflow
```

**Structure Decision**: Keep the feature inside the existing NestJS API as an internal
scheduled worker. The backup module owns scheduling and orchestration, a small
notifications module handles SMTP delivery, and the production image gains the
PostgreSQL client needed for `pg_dump`.

## Complexity Tracking

No constitutional exceptions are required for this feature.
