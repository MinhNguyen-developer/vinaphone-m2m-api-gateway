/*
  Warnings:

  - You are about to drop the column `contract_info` on the `contracts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contract_id]` on the table `contracts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contract_id` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "contract_info",
ADD COLUMN     "birthday" DATE,
ADD COLUMN     "center_code" VARCHAR(20),
ADD COLUMN     "contact_address" TEXT,
ADD COLUMN     "contact_phone" VARCHAR(20),
ADD COLUMN     "contract_id" INTEGER NOT NULL,
ADD COLUMN     "contractor" VARCHAR(50),
ADD COLUMN     "customer_code" VARCHAR(100),
ADD COLUMN     "customer_name" VARCHAR(255),
ADD COLUMN     "payment_address" TEXT,
ADD COLUMN     "payment_name" VARCHAR(255),
ADD COLUMN     "route_code" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_id_key" ON "contracts"("contract_id");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customers"("customer_code") ON DELETE SET NULL ON UPDATE CASCADE;
