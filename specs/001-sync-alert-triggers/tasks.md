# Tasks: Sync Alert Trigger Creation

**Input**: Design documents from `/specs/001-sync-alert-triggers/`

**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required for user stories), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included because the feature spec defines independent test criteria for each user story.

**Organization**: Tasks are grouped by user story so each story can be implemented and
tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the test harness and shared fixtures needed for sync-trigger work

- [X] T001 [P] Create shared alert-trigger unit test scaffolding in `src/alerts/alerts.service.spec.ts`
- [X] T002 [P] Create sync orchestration test scaffolding and mocks in `src/sync/sync.service.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core trigger-evaluation plumbing that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Implement reusable trigger-creation logic in `src/alerts/alerts.service.ts` for evaluating refreshed SIMs against active alert configs and upserting `AlertCheck` rows
- [X] T004 [P] Import `AlertsModule` in `src/sync/sync.module.ts` and inject `AlertsService` into `src/sync/sync.service.ts`
- [X] T005 Refactor shared alert-scope matching rules in `src/alerts/alerts.service.ts` into `buildSimWhereForAlert()` so sync-created triggers and alert review flows share the same threshold/scope conditions

**Checkpoint**: Trigger evaluation is available as a reusable service path and can be invoked from sync

---

## Phase 3: User Story 1 - Automatic Trigger Creation (Priority: P1) 🎯 MVP

**Goal**: When SIM sync refreshes a SIM that meets or exceeds an active alert threshold,
create the corresponding triggered record automatically.

**Independent Test**: Seed an active alert config and a refreshed SIM whose `usedMB`
meets the threshold, run `POST /api/v1/sync/sims`, and verify that one `AlertCheck`
record is created for the matching SIM/alert pair.

### Tests for User Story 1

- [X] T006 [P] [US1] Add unit coverage in `src/alerts/alerts.service.spec.ts` for creating a triggered record when a freshly synced SIM meets the threshold
- [X] T007 [P] [US1] Add orchestration coverage in `src/sync/sync.service.spec.ts` to verify `syncSims()` invokes trigger creation after SIM and usage upserts

### Implementation for User Story 1

- [X] T008 [US1] Call the trigger helper from `src/sync/sync.service.ts` after `simIdMap` is rebuilt so newly created SIMs are evaluated with persisted IDs

**Checkpoint**: A sync run creates the expected triggered record for the first matching SIM/alert pair

---

## Phase 4: User Story 2 - Idempotent Sync Behavior (Priority: P2)

**Goal**: Re-running the same sync must not create duplicate triggered records for the
same SIM and alert configuration pair.

**Independent Test**: Run the same sync scenario twice with unchanged upstream usage and
verify that the number of `AlertCheck` rows for the matching SIM/alert pair does not
increase.

### Tests for User Story 2

- [X] T009 [P] [US2] Add regression coverage in `src/alerts/alerts.service.spec.ts` for repeated sync runs preserving a single `AlertCheck` row per SIM/alert pair
- [X] T010 [P] [US2] Add rerun coverage in `src/sync/sync.service.spec.ts` to verify unchanged usage snapshots do not create duplicate trigger rows

### Implementation for User Story 2

- [X] T011 [US2] Ensure `src/alerts/alerts.service.ts` persists trigger records through the `simId_alertId` compound-key path so reruns stay idempotent

**Checkpoint**: The same sync input can be replayed without creating duplicate triggers

---

## Phase 5: User Story 3 - Scope and Threshold Consistency (Priority: P3)

**Goal**: Active alert configs with different scopes can trigger independently, and
inactive configs must be ignored.

**Independent Test**: Create multiple active alert configs with different scopes,
sync a matching SIM, and verify one triggered record per matching config while inactive
configs produce none.

### Tests for User Story 3

- [X] T012 [P] [US3] Add scope-matching unit coverage in `src/alerts/alerts.service.spec.ts` for SIM-specific, group, product, rating-plan, and sim-code alert configs
- [X] T013 [P] [US3] Add inactive-alert and multi-match coverage in `src/alerts/alerts.service.spec.ts` for one trigger per active config and zero triggers for inactive configs

### Implementation for User Story 3

- [X] T014 [US3] Extend the shared alert-match helper in `src/alerts/alerts.service.ts` so sync-created triggers and `findTriggered()` use the same scope filters and backfill path

**Checkpoint**: Scope-aware matching is consistent across sync and alerts review paths

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, docs cleanup, and end-to-end confirmation

- [X] T015 [P] Add a dedicated e2e spec in `test/sync-alert-triggers.e2e-spec.ts` proving `POST /api/v1/sync/sims` still returns the same body while creating trigger records as a side effect and finishes within the 10-minute sync budget
- [X] T016 [P] Update `specs/001-sync-alert-triggers/quickstart.md` with the final manual validation flow for the sync-trigger side effect

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
  - User stories can then proceed in priority order (P1 -> P2 -> P3)
  - Or in parallel once the shared trigger path is stable
- **Polish (Final Phase)**: Depends on the desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependency on other stories
- **User Story 2 (P2)**: Can start after Foundational - validates idempotency on the same trigger path
- **User Story 3 (P3)**: Can start after Foundational - validates scope matching and inactive alert handling

### Within Each User Story

- Tests (if included) should be written before the implementation task they validate
- Sync orchestration changes should land after the shared trigger helper exists
- Scope and idempotency rules should be verified against the same alert trigger path

### Parallel Opportunities

- T001 and T002 can run in parallel because they touch different spec files
- T004 can run in parallel with test work once T003 exists
- T006 and T007 can run in parallel because they target different test files
- T009 and T010 can run in parallel because they cover different rerun paths
- T012 and T013 can run in parallel because they cover distinct scope scenarios
- T015 and T016 can run in parallel because one is an e2e spec and the other is docs

---

## Parallel Example: User Story 1

```bash
Task: "Add unit coverage in src/alerts/alerts.service.spec.ts for creating a triggered record when a freshly synced SIM meets the threshold"
Task: "Add orchestration coverage in src/sync/sync.service.spec.ts to verify syncSims() invokes trigger creation after SIM and usage upserts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate that a sync run creates the first triggered record
5. Demo or deploy if needed

### Incremental Delivery

1. Complete Setup + Foundational so the trigger path exists
2. Add User Story 1 and verify the first sync-created trigger
3. Add User Story 2 and verify duplicate prevention on reruns
4. Add User Story 3 and verify scope-aware matching across alert definitions
5. Finish with e2e validation and quickstart cleanup

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup and Foundational together
2. Developer A works on User Story 1 sync orchestration
3. Developer B works on User Story 2 idempotency coverage
4. Developer C works on User Story 3 scope-matching coverage
5. Finish with shared e2e validation and docs cleanup

---

## Notes

- [P] tasks can run in parallel when they touch different files and do not depend on unfinished tasks
- Each user story should be independently completable and testable
- The MVP scope is User Story 1: automatic trigger creation during SIM sync
- The shared alert trigger helper should remain the single source of truth for sync-created triggers