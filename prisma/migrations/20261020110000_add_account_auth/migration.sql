CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "password_hash" TEXT,
    "vinaphone_token_ciphertext" TEXT,
    "vinaphone_token_iv" VARCHAR(64),
    "vinaphone_token_tag" VARCHAR(64),
    "token_expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- Reserve a stable UUID for the existing Vinaphone account's data. Its email and
-- credentials are bound only after that account successfully authenticates.
INSERT INTO "accounts" ("id", "created_at", "updated_at")
VALUES (
    '0f6462cc-2e64-4f50-931b-4e379023ad14',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
