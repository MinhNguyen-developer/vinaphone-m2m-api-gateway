# Implementation Plan: Sync Alert Trigger Creation

**Branch**: `001-sync-alert-triggers` | **Date**: 2026-07-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

## Summary

Extend the existing SIM sync pipeline so each refreshed SIM is checked against active
AlertConfig rows and any match creates exactly one AlertCheck row for the SIM/alert
pair. The sync response stays unchanged; the new behavior is a side effect of
`POST /api/v1/sync/sims`. Alert matching and AlertCheck persistence should be
centralized in the alerts domain and invoked from the sync service so the same rules
apply to sync-side trigger creation and manual triggered-alert review.

## Technical Context

**Language/Version**: TypeScript 5.x on NestJS 11

**Primary Dependencies**: `@nestjs/axios`, `@nestjs/common`, `@nestjs/config`,
`@nestjs/swagger`, Prisma 7, PostgreSQL, Jest, Supertest

**Storage**: PostgreSQL via Prisma models `Sim`, `AlertConfig`, and `AlertCheck`

**Testing**: Jest unit tests, Supertest e2e tests, Prisma-backed integration tests

**Target Platform**: Node.js backend API service

**Project Type**: Single backend web service

**Performance Goals**: Keep trigger evaluation within a 10-minute sync window at the
current cadence, avoid N+1 alert lookups, and batch persistence for large sync runs.

**Constraints**: Preserve the existing `POST /api/v1/sync/sims` response shape, use
inclusive `usedMB >= thresholdMB` matching, keep AlertCheck creation idempotent across
reruns, and keep sync-trigger evaluation inside the 10-minute operating budget.

**Scale/Scope**: Applies to the current batched SIM sync job for the Vinaphone SIM
fleet and the existing alerts review workflow.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Code quality and domain clarity: PASS. SyncService will orchestrate sync work while
  shared alert trigger logic lives in the alerts domain or a small exported helper.
- Test-first verification: PASS. Add regression coverage for first-time trigger
  creation and rerun idempotency before implementation.
- User experience consistency: PASS. No response-shape changes are required; existing
  alert review endpoints remain the validation path.
- Performance budgets and efficient data access: PASS. Load active alerts in batches and
  avoid per-SIM alertConfig queries or repeated database lookups.
- Reliability, observability, and safe change control: PASS. Use idempotent upserts on
  AlertCheck and preserve current sync fire-and-forget behavior.

## Project Structure

### Documentation (this feature)

```text
specs/001-sync-alert-triggers/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── sync-sims.md
```

### Source Code (repository root)

```text
src/
├── alerts/
│   ├── alerts.controller.ts
│   ├── alerts.module.ts
│   └── alerts.service.ts
├── sync/
│   ├── sync.controller.ts
│   ├── sync.module.ts
│   └── sync.service.ts
├── prisma/
├── generated/
└── main.ts

test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

**Structure Decision**: Single backend service under `src/`; implement sync-side trigger
creation in `src/sync/` and centralize alert matching and trigger persistence in
`src/alerts/` so the same rules serve sync and alert query paths.

## Complexity Tracking

No constitutional exceptions are required for this feature.
