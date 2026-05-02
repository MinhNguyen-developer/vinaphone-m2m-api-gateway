-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "contract_code" VARCHAR(50) NOT NULL,
    "contract_info" TEXT,
    "contract_date" DATE,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContractSims" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ContractSims_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_code_key" ON "contracts"("contract_code");

-- CreateIndex
CREATE INDEX "_ContractSims_B_index" ON "_ContractSims"("B");

-- AddForeignKey
ALTER TABLE "_ContractSims" ADD CONSTRAINT "_ContractSims_A_fkey" FOREIGN KEY ("A") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContractSims" ADD CONSTRAINT "_ContractSims_B_fkey" FOREIGN KEY ("B") REFERENCES "sims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
