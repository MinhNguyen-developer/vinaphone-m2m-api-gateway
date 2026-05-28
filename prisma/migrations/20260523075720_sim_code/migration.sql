-- DropForeignKey
ALTER TABLE "sims" DROP CONSTRAINT "sims_sim_code_id_fkey";

-- AlterTable
ALTER TABLE "sims" ALTER COLUMN "sim_code_id" SET DATA TYPE VARCHAR(50);

-- AddForeignKey
ALTER TABLE "sims" ADD CONSTRAINT "sims_sim_code_id_fkey" FOREIGN KEY ("sim_code_id") REFERENCES "sim_codes"("code") ON DELETE SET NULL ON UPDATE CASCADE;
