-- AlterTable
ALTER TABLE "sims" ADD COLUMN     "sim_code_id" UUID;

-- CreateTable
CREATE TABLE "sim_codes" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,

    CONSTRAINT "sim_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sim_codes_code_key" ON "sim_codes"("code");

-- AddForeignKey
ALTER TABLE "sims" ADD CONSTRAINT "sims_sim_code_id_fkey" FOREIGN KEY ("sim_code_id") REFERENCES "sim_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
