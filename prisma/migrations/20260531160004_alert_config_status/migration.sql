/*
  Warnings:

  - You are about to drop the column `active` on the `alert_configs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "alert_configs" DROP COLUMN "active",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;
