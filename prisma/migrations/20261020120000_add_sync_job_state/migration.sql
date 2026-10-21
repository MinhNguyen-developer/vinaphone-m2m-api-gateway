CREATE TABLE "sync_job_states" (
    "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid,
    "job" VARCHAR(50) NOT NULL,
    "state" VARCHAR(20) NOT NULL DEFAULT 'idle',
    "progress" TEXT NOT NULL DEFAULT '',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_synced_at" TIMESTAMPTZ(3),
    "error" TEXT,

    CONSTRAINT "sync_job_states_pkey" PRIMARY KEY ("account_id", "job"),
    CONSTRAINT "sync_job_states_account_id_fkey" FOREIGN KEY ("account_id")
        REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
