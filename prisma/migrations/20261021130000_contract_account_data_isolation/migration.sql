-- Run only after tenant-aware API code is live and all old API instances are stopped.
-- The statements are safe to retry if the migration runner is interrupted.

ALTER TABLE "sims" DROP CONSTRAINT IF EXISTS "sims_rating_plan_id_fkey";
ALTER TABLE "sims" DROP CONSTRAINT IF EXISTS "sims_sim_code_id_fkey";
ALTER TABLE "usage_history" DROP CONSTRAINT IF EXISTS "usage_history_sim_id_fkey";
ALTER TABLE "sim_groups" DROP CONSTRAINT IF EXISTS "sim_groups_sim_id_fkey";
ALTER TABLE "sim_groups" DROP CONSTRAINT IF EXISTS "sim_groups_group_id_fkey";
ALTER TABLE "alert_configs" DROP CONSTRAINT IF EXISTS "alert_configs_sim_id_fkey";
ALTER TABLE "alert_configs" DROP CONSTRAINT IF EXISTS "alert_configs_group_id_fkey";
ALTER TABLE "alert_checks" DROP CONSTRAINT IF EXISTS "alert_checks_sim_id_fkey";
ALTER TABLE "alert_checks" DROP CONSTRAINT IF EXISTS "alert_checks_alert_id_fkey";
ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_customer_code_fkey";
ALTER TABLE "monthly_data_usage" DROP CONSTRAINT IF EXISTS "monthly_data_usage_msisdn_fkey";

DROP INDEX IF EXISTS "sims_phone_number_key";
DROP INDEX IF EXISTS "sims_imsi_key";
DROP INDEX IF EXISTS "usage_history_sim_id_month_key";
DROP INDEX IF EXISTS "sim_codes_code_key";
DROP INDEX IF EXISTS "master_sims_code_key";
DROP INDEX IF EXISTS "master_sims_phone_number_key";
DROP INDEX IF EXISTS "GroupSim_group_id_key";
DROP INDEX IF EXISTS "GroupSim_group_key_key";
DROP INDEX IF EXISTS "alert_checks_sim_id_alert_id_key";
DROP INDEX IF EXISTS "sim_group_members_group_id_msisdn_key";
DROP INDEX IF EXISTS "rating_plans_rating_plan_id_key";
DROP INDEX IF EXISTS "rating_plans_code_key";
DROP INDEX IF EXISTS "customers_customer_code_key";
DROP INDEX IF EXISTS "contracts_contract_id_key";
DROP INDEX IF EXISTS "contracts_contract_code_key";
DROP INDEX IF EXISTS "monthly_data_usage_msisdn_month_key";

ALTER TABLE "sim_groups" DROP CONSTRAINT IF EXISTS "sim_groups_pkey";
ALTER TABLE "sim_groups"
  ADD CONSTRAINT "sim_groups_pkey"
  PRIMARY KEY ("account_id", "sim_id", "group_id");
DROP INDEX IF EXISTS "sim_groups_account_id_sim_id_group_id_key";
