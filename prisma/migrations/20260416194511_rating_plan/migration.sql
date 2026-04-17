-- AlterTable
ALTER TABLE "sims" ADD COLUMN     "rating_plan_id" INTEGER,
ADD COLUMN     "rating_plan_name" VARCHAR(255);

-- CreateTable
CREATE TABLE "rating_plans" (
    "id" UUID NOT NULL,
    "rating_plan_id" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "rating_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rating_plans_code_key" ON "rating_plans"("code");
