-- CreateTable
CREATE TABLE "sims" (
    "id" UUID NOT NULL,
    "phone_number" VARCHAR(15) NOT NULL,
    "imsi" VARCHAR(15),
    "contract_code" VARCHAR(50),
    "product_code" VARCHAR(50) NOT NULL,
    "master_sim_code" VARCHAR(20),
    "system_status" VARCHAR(20),
    "status" VARCHAR(30) NOT NULL DEFAULT 'Mới',
    "used_mb" INTEGER NOT NULL DEFAULT 0,
    "first_used_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "created_at" DATE NOT NULL,
    "note" TEXT,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "sims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_history" (
    "id" UUID NOT NULL,
    "sim_id" UUID NOT NULL,
    "month" CHAR(7) NOT NULL,
    "used_mb" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_sims" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "phone_number" VARCHAR(15) NOT NULL,
    "package_name" VARCHAR(100) NOT NULL,
    "package_capacity_mb" INTEGER NOT NULL,
    "used_mb" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "master_sims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sim_groups" (
    "sim_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,

    CONSTRAINT "sim_groups_pkey" PRIMARY KEY ("sim_id","group_id")
);

-- CreateTable
CREATE TABLE "alert_configs" (
    "id" UUID NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "threshold_mb" INTEGER NOT NULL,
    "sim_id" UUID,
    "group_id" UUID,
    "product_code" VARCHAR(50),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_checks" (
    "id" UUID NOT NULL,
    "sim_id" UUID NOT NULL,
    "alert_id" UUID NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checked_at" TIMESTAMP(3),
    "checked_by" VARCHAR(100),

    CONSTRAINT "alert_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sims_phone_number_key" ON "sims"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "sims_imsi_key" ON "sims"("imsi");

-- CreateIndex
CREATE UNIQUE INDEX "usage_history_sim_id_month_key" ON "usage_history"("sim_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "master_sims_code_key" ON "master_sims"("code");

-- CreateIndex
CREATE UNIQUE INDEX "master_sims_phone_number_key" ON "master_sims"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "alert_checks_sim_id_alert_id_key" ON "alert_checks"("sim_id", "alert_id");

-- AddForeignKey
ALTER TABLE "usage_history" ADD CONSTRAINT "usage_history_sim_id_fkey" FOREIGN KEY ("sim_id") REFERENCES "sims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_groups" ADD CONSTRAINT "sim_groups_sim_id_fkey" FOREIGN KEY ("sim_id") REFERENCES "sims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_groups" ADD CONSTRAINT "sim_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_sim_id_fkey" FOREIGN KEY ("sim_id") REFERENCES "sims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_checks" ADD CONSTRAINT "alert_checks_sim_id_fkey" FOREIGN KEY ("sim_id") REFERENCES "sims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_checks" ADD CONSTRAINT "alert_checks_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alert_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
