# Data Model: Sync Alert Trigger Creation

## Entities

### Sim

**Purpose**: Represents a managed SIM whose usage is refreshed during sync.

**Relevant fields**:
- `id`
- `phoneNumber`
- `usedMB`
- `status`
- `productCode`
- `ratingPlanId`
- `simCodeLabel`
- `group` associations through `SimGroup`
- `syncedAt`

**Relationships**:
- Can match zero or more `AlertConfig` records.
- Can have zero or more `AlertCheck` records.

**Behavioral rules**:
- Sync-created trigger evaluation uses the latest refreshed `usedMB` value.
- Newly imported SIMs are eligible on their first sync if they already meet a threshold.

### AlertConfig

**Purpose**: Represents an active or inactive alert definition with a threshold and scope.

**Relevant fields**:
- `id`
- `label`
- `thresholdMB`
- `status`
- `simId`
- `groupId`
- `productCode`
- `ratingPlanId`
- `simCodeLabel`

**Relationships**:
- Can match many SIMs depending on scope.
- Can create at most one `AlertCheck` per SIM.

**Behavioral rules**:
- Only active configurations participate in trigger creation.
- Threshold comparison is inclusive: `usedMB >= thresholdMB`.

### AlertCheck

**Purpose**: Stores the triggered record created when a SIM matches an alert.

**Relevant fields**:
- `id`
- `simId`
- `alertId`
- `checked`
- `triggeredAt`
- `checkedAt`
- `checkedBy`

**Constraints**:
- Unique pair: `simId` + `alertId`.

**State transitions**:
- `absent` -> `created` when sync detects a match for the first time.
- `created` -> `checked` when an operator marks the alert as reviewed.
- Legacy rows with a null `triggeredAt` may be backfilled during sync.

### SyncRun (transient)

**Purpose**: Represents one execution of SIM sync.

**Relevant fields**:
- `startedAt`
- `completedAt`
- `processedSimCount`
- `createdTriggerCount`
- `failedCount`

**Relationships**:
- Orchestrates SIM refresh and trigger creation.
- Not persisted as a dedicated table in this feature.

## Schema impact

- No database migration is required for this feature.
- The implementation reuses the existing Prisma models and unique constraint on
  `AlertCheck`.
