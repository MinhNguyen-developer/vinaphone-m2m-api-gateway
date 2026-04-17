/*
  Warnings:

  - Changed the type of `rating_plan_id` on the `rating_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "rating_plans" DROP COLUMN "rating_plan_id",
ADD COLUMN     "rating_plan_id" INTEGER NOT NULL;
