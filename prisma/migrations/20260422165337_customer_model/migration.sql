-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_code" VARCHAR(100) NOT NULL,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers"("customer_code");
