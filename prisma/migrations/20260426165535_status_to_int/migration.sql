-- Migrate status column from VARCHAR to INT without data loss
-- 1 = Mới, 2 = Đã hoạt động, 3 = Đã xác nhận

ALTER TABLE "sims" ADD COLUMN "status_new" INTEGER NOT NULL DEFAULT 1;

UPDATE "sims" SET "status_new" = CASE
  WHEN status = 'Đã hoạt động' THEN 2
  WHEN status = 'Đã xác nhận'  THEN 3
  ELSE 1
END;

ALTER TABLE "sims" DROP COLUMN "status";
ALTER TABLE "sims" RENAME COLUMN "status_new" TO "status";
