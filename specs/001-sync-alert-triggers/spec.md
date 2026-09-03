# Feature Specification: Sync Alert Trigger Creation

**Feature Branch**: `001-sync-alert-triggers`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Improve the sync job so newly synced SIMs create triggered records when an existing alert configuration threshold is met or exceeded."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Trigger Creation (Priority: P1)

As an operations user, I want the SIM sync job to create a triggered record whenever a
synced SIM meets or exceeds an existing alert threshold, so that high-usage SIMs are
captured without manual review.

**Why this priority**: This is the primary business outcome. If the sync job does not
create the triggered record, alerting is incomplete and the dashboard cannot surface the
risk.

**Independent Test**: Seed an active alert configuration and a SIM whose refreshed usage
meets the threshold, run the sync job, and verify that a triggered record is created for
that SIM and alert configuration.

**Acceptance Scenarios**:

1. **Given** an active alert configuration with a 1000MB threshold and a synced SIM with
   1200MB used, **When** the sync job completes, **Then** a triggered record exists for
   that SIM and alert configuration.
2. **Given** a synced SIM whose usage is below every matching alert threshold or that has
   no matching alert configuration, **When** the sync job completes, **Then** no triggered
   record is created for that SIM.

---

### User Story 2 - Idempotent Sync Behavior (Priority: P2)

As an operations user, I want repeated sync runs to preserve existing triggered records
for the same SIM and alert configuration, so that retries do not create duplicate alert
entries.

**Why this priority**: Sync jobs run repeatedly. Duplicate triggered records would create
alert noise and make it harder to trust the alert queue.

**Independent Test**: Run the same sync scenario twice with unchanged SIM usage and verify
that the number of triggered records for each SIM and alert configuration pair stays the
same.

**Acceptance Scenarios**:

1. **Given** a triggered record already exists for a SIM and alert configuration pair,
   **When** the sync job runs again with the same SIM usage, **Then** no additional
   triggered record is created for that pair.
2. **Given** a sync retry after a partial failure, **When** the job is rerun, **Then** any
   already created triggered records remain valid and are not duplicated.

---

### User Story 3 - Scope and Threshold Consistency (Priority: P3)

As an operations user, I want trigger creation to respect every active alert
configuration and its scope, so that multiple matching alert configurations can trigger
correctly without affecting inactive ones.

**Why this priority**: A SIM may match several alert configurations. The sync job must
create the right set of trigger records and ignore inactive definitions.

**Independent Test**: Create multiple active alert configurations with different scopes
and thresholds, run the sync job for a matching SIM, and verify that one triggered record
is created for each matching configuration only.

**Acceptance Scenarios**:

1. **Given** a SIM that matches multiple active alert configurations, **When** the sync
   job completes, **Then** one triggered record exists for each matching configuration.
2. **Given** an inactive alert configuration that would otherwise match a SIM, **When** the
   sync job completes, **Then** no triggered record is created for that configuration.

### Edge Cases

- A SIM's refreshed usage is exactly equal to the alert threshold.
- A newly imported SIM already exceeds one or more thresholds on its first sync.
- A SIM matches both a SIM-specific alert and a broader group- or product-based alert.
- The sync job is retried after a partial failure and some SIMs were already processed.
- Multiple alert configurations share the same threshold but have different scopes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST evaluate active alert configurations for every SIM whose
  usage is refreshed by the sync job.
- **FR-002**: The system MUST create a triggered record for each active alert
  configuration whose threshold is met or exceeded by the synced SIM.
- **FR-003**: The system MUST create exactly one triggered record per SIM and alert
  configuration pair.
- **FR-004**: The system MUST not create duplicate triggered records when the sync job
  runs again with unchanged SIM usage.
- **FR-005**: The system MUST support multiple matching alert configurations for the same
  SIM in the same sync run.
- **FR-006**: The system MUST ignore inactive alert configurations during trigger
  creation.
- **FR-007**: The system MUST apply the same trigger creation rules to newly imported SIMs
  and already known SIMs.
- **FR-008**: The system MUST preserve existing triggered records when a sync retry occurs
  after a partial failure.

### Key Entities *(include if feature involves data)*

- **SIM**: A managed SIM with a persisted usage value that is refreshed during sync.
- **Alert Configuration**: A rule that defines a usage threshold and matching scope.
- **AlertCheck**: The persisted triggered record created when a SIM meets an alert
  condition.
- **Sync Run**: One execution of the SIM synchronization process.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a representative sync run, 100% of SIMs whose refreshed usage meets or
  exceeds an active alert threshold produce a triggered record before the run finishes.
- **SC-002**: Re-running the same sync with unchanged input produces 0 additional
  triggered records for existing SIM and alert configuration pairs.
- **SC-003**: A SIM that matches multiple active alert configurations produces one
  triggered record for each matching configuration in the same sync run.
- **SC-004**: A representative sync run completes within 10 minutes at the configured
  cadence under expected production volume.

## Assumptions

- Alert configurations already exist before the sync job starts.
- Threshold comparison is inclusive, meaning usage that equals the threshold counts as a
  match.
- One SIM can match multiple alert configurations in a single sync run.
- Triggered records are the source of truth for the alert queue.
- The sync job uses the latest persisted usage snapshot available at the time of sync.
