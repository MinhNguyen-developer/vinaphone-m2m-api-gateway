-- Existing rows are assigned to the reserved legacy account by the column default.

-- AlterTable
ALTER TABLE "sims" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "usage_history" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "sim_codes" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "master_sims" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "groups" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "GroupSim" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "sim_groups"
ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "alert_configs" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "alert_checks" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "sim_group_members" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "rating_plans" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- AlterTable
ALTER TABLE "monthly_data_usage" ADD COLUMN "account_id" UUID NOT NULL DEFAULT '0f6462cc-2e64-4f50-931b-4e379023ad14'::uuid;

-- CreateIndex
CREATE UNIQUE INDEX "sims_account_id_id_key" ON "sims"("account_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sims_account_id_phone_number_key" ON "sims"("account_id", "phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "sims_account_id_imsi_key" ON "sims"("account_id", "imsi");

-- CreateIndex
CREATE UNIQUE INDEX "usage_history_account_id_sim_id_month_key" ON "usage_history"("account_id", "sim_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "sim_codes_account_id_id_key" ON "sim_codes"("account_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sim_codes_account_id_code_key" ON "sim_codes"("account_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "master_sims_account_id_code_key" ON "master_sims"("account_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "master_sims_account_id_phone_number_key" ON "master_sims"("account_id", "phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "groups_account_id_id_key" ON "groups"("account_id", "id");

-- Keep the legacy primary key through the expand phase for old application instances.
CREATE UNIQUE INDEX "sim_groups_account_id_sim_id_group_id_key" ON "sim_groups"("account_id", "sim_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupSim_account_id_group_id_key" ON "GroupSim"("account_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupSim_account_id_group_key_key" ON "GroupSim"("account_id", "group_key");

-- CreateIndex
CREATE UNIQUE INDEX "alert_configs_account_id_id_key" ON "alert_configs"("account_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "alert_checks_account_id_id_key" ON "alert_checks"("account_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "alert_checks_account_id_sim_id_alert_id_key" ON "alert_checks"("account_id", "sim_id", "alert_id");

-- CreateIndex
CREATE UNIQUE INDEX "sim_group_members_account_id_group_id_msisdn_key" ON "sim_group_members"("account_id", "group_id", "msisdn");

-- CreateIndex
CREATE UNIQUE INDEX "rating_plans_account_id_id_key" ON "rating_plans"("account_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "rating_plans_account_id_rating_plan_id_key" ON "rating_plans"("account_id", "rating_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "rating_plans_account_id_code_key" ON "rating_plans"("account_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_account_id_id_key" ON "customers"("account_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_account_id_customer_code_key" ON "customers"("account_id", "customer_code");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_account_id_id_key" ON "contracts"("account_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_account_id_contract_id_key" ON "contracts"("account_id", "contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_account_id_contract_code_key" ON "contracts"("account_id", "contract_code");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_data_usage_account_id_msisdn_month_key" ON "monthly_data_usage"("account_id", "msisdn", "month");

-- AddForeignKey
ALTER TABLE "sims" ADD CONSTRAINT "sims_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sims" ADD CONSTRAINT "sims_account_id_rating_plan_id_fkey" FOREIGN KEY ("account_id", "rating_plan_id") REFERENCES "rating_plans"("account_id", "rating_plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sims" ADD CONSTRAINT "sims_account_id_sim_code_id_fkey" FOREIGN KEY ("account_id", "sim_code_id") REFERENCES "sim_codes"("account_id", "code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_history" ADD CONSTRAINT "usage_history_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_history" ADD CONSTRAINT "usage_history_account_id_sim_id_fkey" FOREIGN KEY ("account_id", "sim_id") REFERENCES "sims"("account_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_codes" ADD CONSTRAINT "sim_codes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_sims" ADD CONSTRAINT "master_sims_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSim" ADD CONSTRAINT "GroupSim_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_groups" ADD CONSTRAINT "sim_groups_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_groups" ADD CONSTRAINT "sim_groups_account_id_sim_id_fkey" FOREIGN KEY ("account_id", "sim_id") REFERENCES "sims"("account_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_groups" ADD CONSTRAINT "sim_groups_account_id_group_id_fkey" FOREIGN KEY ("account_id", "group_id") REFERENCES "groups"("account_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_account_id_sim_id_fkey" FOREIGN KEY ("account_id", "sim_id") REFERENCES "sims"("account_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_account_id_group_id_fkey" FOREIGN KEY ("account_id", "group_id") REFERENCES "groups"("account_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_checks" ADD CONSTRAINT "alert_checks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_checks" ADD CONSTRAINT "alert_checks_account_id_sim_id_fkey" FOREIGN KEY ("account_id", "sim_id") REFERENCES "sims"("account_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_checks" ADD CONSTRAINT "alert_checks_account_id_alert_id_fkey" FOREIGN KEY ("account_id", "alert_id") REFERENCES "alert_configs"("account_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_group_members" ADD CONSTRAINT "sim_group_members_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_plans" ADD CONSTRAINT "rating_plans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_account_id_customer_code_fkey" FOREIGN KEY ("account_id", "customer_code") REFERENCES "customers"("account_id", "customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_data_usage" ADD CONSTRAINT "monthly_data_usage_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_data_usage" ADD CONSTRAINT "monthly_data_usage_account_id_msisdn_fkey" FOREIGN KEY ("account_id", "msisdn") REFERENCES "sims"("account_id", "phone_number") ON DELETE CASCADE ON UPDATE CASCADE;

