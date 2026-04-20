-- AlterTable
ALTER TABLE "sims" ADD COLUMN     "group_name" VARCHAR(255);

-- CreateTable
CREATE TABLE "GroupSim" (
    "id" UUID NOT NULL,
    "group_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "group_key" VARCHAR(50) NOT NULL,

    CONSTRAINT "GroupSim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupSim_group_id_key" ON "GroupSim"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupSim_group_key_key" ON "GroupSim"("group_key");
