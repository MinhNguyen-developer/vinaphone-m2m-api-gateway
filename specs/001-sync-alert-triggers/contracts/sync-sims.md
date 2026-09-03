# Contract: Sync SIMs Alert Trigger Side Effect

**Endpoint**: `POST /api/v1/sync/sims`

**Purpose**: Start the SIM sync job and create alert trigger records as a side effect for
any refreshed SIM that meets or exceeds an active alert threshold.

## Request

- **Auth**: Bearer JWT required
- **Body**: None
- **Behavior**: Fire-and-forget; the HTTP response returns before the background sync
  completes.

## Response

```json
{
  "triggered": true,
  "job": "syncSims",
  "timestamp": "ISO-8601"
}
```

## Side Effects

- Refreshes SIM usage data from the Vinaphone source.
- Evaluates active `AlertConfig` records for each refreshed SIM.
- Creates exactly one `AlertCheck` row per matching SIM and alert configuration pair.
- Re-running the same sync with unchanged usage does not create duplicate trigger rows.

## Verification

- `GET /api/v1/alerts/triggered?alertLabel=<label>`
- Optional database inspection of `AlertCheck` for the matching `simId` and `alertId`

## Compatibility Notes

- The response shape of `POST /api/v1/sync/sims` is unchanged.
- No new public endpoint is introduced by this feature.
