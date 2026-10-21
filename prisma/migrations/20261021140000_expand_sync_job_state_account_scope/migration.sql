-- Repair databases where the earlier sync-state migration was recorded as applied
-- before it included account_id. Keep the legacy job primary key during expansion
-- so an older API can continue to upsert by job until the contract phase.

ALTER TABLE "sync_job_states"
  ADD COLUMN IF NOT EXISTS "account_id" UUID;

UPDATE "sync_job_states"
SET "account_id" = '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid
WHERE "account_id" IS NULL;

ALTER TABLE "sync_job_states"
  ALTER COLUMN "account_id" SET DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid,
  ALTER COLUMN "account_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "sync_job_states_account_id_job_key"
  ON "sync_job_states"("account_id", "job");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sync_job_states_account_id_fkey'
      AND conrelid = 'sync_job_states'::regclass
  ) THEN
    ALTER TABLE "sync_job_states"
      ADD CONSTRAINT "sync_job_states_account_id_fkey"
      FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
