/*
  Warnings:

  - A unique constraint covering the columns `[rating_plan_id]` on the table `rating_plans` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "rating_plans_rating_plan_id_key" ON "rating_plans"("rating_plan_id");
