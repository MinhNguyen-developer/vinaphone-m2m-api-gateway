-- Run after the tenant-aware API is live and all older API instances are stopped.
-- The expand phase already added a composite unique index, so the new API can use
-- (account_id, job) before this migration promotes it to the primary key.

DO $$
DECLARE
  existing_primary_key TEXT;
BEGIN
  SELECT conname
    INTO existing_primary_key
  FROM pg_constraint
  WHERE conrelid = 'sync_job_states'::regclass
    AND contype = 'p';

  IF existing_primary_key IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE "sync_job_states" DROP CONSTRAINT %I',
      existing_primary_key
    );
  END IF;

  ALTER TABLE "sync_job_states"
    ADD CONSTRAINT "sync_job_states_pkey"
    PRIMARY KEY USING INDEX "sync_job_states_account_id_job_key";
END $$;
