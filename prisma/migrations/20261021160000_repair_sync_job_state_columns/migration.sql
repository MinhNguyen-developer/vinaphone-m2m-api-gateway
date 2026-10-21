-- Repair databases whose recorded sync-state migration predates the current model.
-- Add missing runtime columns without replacing existing progress or timestamps.

ALTER TABLE "sync_job_states"
  ADD COLUMN IF NOT EXISTS "state" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "progress" TEXT,
  ADD COLUMN IF NOT EXISTS "progress_percent" INTEGER,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "last_synced_at" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "error" TEXT;

UPDATE "sync_job_states"
SET "state" = COALESCE(
      "state",
      CASE
        WHEN "error" IS NOT NULL THEN 'failed'
        WHEN "last_synced_at" IS NOT NULL THEN 'completed'
        ELSE 'idle'
      END
    ),
    "progress" = COALESCE("progress", ''),
    "progress_percent" = COALESCE("progress_percent", 0),
    "updated_at" = COALESCE("updated_at", CURRENT_TIMESTAMP);

ALTER TABLE "sync_job_states"
  ALTER COLUMN "state" SET DEFAULT 'idle',
  ALTER COLUMN "state" SET NOT NULL,
  ALTER COLUMN "progress" SET DEFAULT '',
  ALTER COLUMN "progress" SET NOT NULL,
  ALTER COLUMN "progress_percent" SET DEFAULT 0,
  ALTER COLUMN "progress_percent" SET NOT NULL,
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updated_at" SET NOT NULL;
