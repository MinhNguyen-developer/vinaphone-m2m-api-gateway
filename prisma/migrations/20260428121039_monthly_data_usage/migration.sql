-- CreateTable
CREATE TABLE "monthly_data_usage" (
    "id" UUID NOT NULL,
    "msisdn" VARCHAR(15) NOT NULL,
    "month" CHAR(7) NOT NULL,
    "sms_noi_mang_used" INTEGER,
    "sms_ngoai_mang_used" INTEGER,
    "data_used_mb" INTEGER,
    "sms_quoc_te_used" INTEGER,
    "total_data" INTEGER,
    "total_sms_noi_mang" INTEGER,
    "total_sms_ngoai_mang" INTEGER,
    "total_sms_quoc_te_used" INTEGER,

    CONSTRAINT "monthly_data_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_data_usage_msisdn_month_key" ON "monthly_data_usage"("msisdn", "month");

-- AddForeignKey
ALTER TABLE "monthly_data_usage" ADD CONSTRAINT "monthly_data_usage_msisdn_fkey" FOREIGN KEY ("msisdn") REFERENCES "sims"("phone_number") ON DELETE CASCADE ON UPDATE CASCADE;
