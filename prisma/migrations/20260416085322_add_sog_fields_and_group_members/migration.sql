-- AlterTable
ALTER TABLE "sims" ADD COLUMN     "sog_group_id" VARCHAR(50),
ADD COLUMN     "sog_group_name" VARCHAR(255),
ADD COLUMN     "sog_is_owner" BOOLEAN,
ADD COLUMN     "sog_ma_goi" VARCHAR(100);

-- CreateTable
CREATE TABLE "sim_group_members" (
    "id" UUID NOT NULL,
    "group_id" VARCHAR(50) NOT NULL,
    "msisdn" VARCHAR(15) NOT NULL,
    "rating_plan_name" VARCHAR(255),
    "status" INTEGER,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "sim_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sim_group_members_group_id_msisdn_key" ON "sim_group_members"("group_id", "msisdn");
