# Quickstart: Validate Sync Alert Trigger Creation

## Prerequisites

- `npm install`
- A configured `.env` with `DATABASE_URL` and the standard API settings
- Local PostgreSQL available and migrations applied
- A valid authenticated test client or bearer JWT for protected endpoints
- A controlled Vinaphone test harness or mocked response that returns at least one SIM
  whose refreshed usage meets an alert threshold

## Setup

1. Apply the database schema.

```bash
npm run db:migrate
```

2. Start the API locally.

```bash
npm run start:dev
```

3. Create or seed an active alert configuration with a threshold that your test SIM will
   meet or exceed, for example `1000MB`.

## End-to-end validation

1. Confirm a test SIM will sync with `usedMB >= thresholdMB` in the controlled Vinaphone
   fixture or mock environment.
2. Trigger the SIM sync endpoint.

```bash
curl -X POST http://localhost:3000/api/v1/sync/sims \
  -H "Authorization: Bearer <JWT>"
```

3. Wait for the sync job to complete.
4. Query triggered alerts through the existing alerts endpoint.

```bash
curl "http://localhost:3000/api/v1/alerts/triggered?alertLabel=<alert-label>" \
  -H "Authorization: Bearer <JWT>"
```

5. Verify the response contains one triggered record for each matching SIM and alert
   configuration pair, with `checked=false` and a non-null `triggeredAt`.
6. Run the same sync again with unchanged upstream usage and verify that no duplicate
   triggered record is created for the same SIM/alert pair.
7. Measure the elapsed time for the representative sync run and confirm it completes
   within 10 minutes at the configured cadence.

## Validation commands

- `npm run test`
- `npm run test:e2e`

Expected outcome: the test suite proves that sync-created alert triggers are created once
per matching SIM/config pair and remain stable across reruns.
