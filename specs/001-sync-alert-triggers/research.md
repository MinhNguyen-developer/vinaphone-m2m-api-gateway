# Research: Sync Alert Trigger Creation

## Decision 1: Reuse `AlertCheck` as the triggered record store

Decision: Persist sync-created triggers to the existing `AlertCheck` table.

Rationale: The model already has the correct uniqueness constraint (`simId` + `alertId`),
tracks `triggeredAt`, and is already used by the alerts review flow. Reusing it keeps the
feature aligned with existing UI and API behavior.

Alternatives considered: A new `AlertTrigger` table, or deriving trigger state only from
alert queries. Both would add duplication or weaken idempotency guarantees.

## Decision 2: Centralize trigger creation in the alerts domain

Decision: Expose a reusable alert-trigger helper from the alerts domain and call it from
`SyncService` after SIM and usage upserts complete.

Rationale: Alert scope and threshold semantics belong with alert logic, not in the sync
controller. Centralizing the rule set avoids drift between sync-side creation and manual
trigger review paths.

Alternatives considered: Duplicate the matching logic in `SyncService`, or move the logic
into database triggers. Both make the rules harder to test and change safely.

## Decision 3: Evaluate active alert configs once per sync pass

Decision: Load active alert configurations in batches for the current sync run and reuse
that set while evaluating refreshed SIMs.

Rationale: This matches the feature's performance budget and avoids per-SIM alertConfig
queries that would turn a batched sync job into an N+1 workload.

Alternatives considered: Query the database once per SIM, or process one alert config per
pass. Those approaches would be slower and more fragile at production scale.

## Decision 4: Keep the sync contract unchanged

Decision: `POST /api/v1/sync/sims` remains fire-and-forget, and the new trigger creation
behavior is verified through the existing alerts views or direct database inspection.

Rationale: This is a side-effect change, not a new API surface. Preserving the existing
response shape avoids breaking dashboard and automation clients.

Alternatives considered: Returning trigger counts in the sync response or adding a new
status payload. That would expand the public contract without user value.
