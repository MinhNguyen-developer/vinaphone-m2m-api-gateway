ALTER TABLE "sims"
ADD COLUMN "internal_imsi" VARCHAR(10);

UPDATE "sims"
SET "internal_imsi" = RIGHT("imsi", 10);

CREATE OR REPLACE FUNCTION sync_internal_imsi_from_imsi()
RETURNS TRIGGER AS $$
BEGIN
  NEW."internal_imsi" := RIGHT(NEW."imsi", 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "sims_sync_internal_imsi"
BEFORE INSERT OR UPDATE ON "sims"
FOR EACH ROW
EXECUTE FUNCTION sync_internal_imsi_from_imsi();
