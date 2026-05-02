-- AddForeignKey
ALTER TABLE "sims" ADD CONSTRAINT "sims_rating_plan_id_fkey" FOREIGN KEY ("rating_plan_id") REFERENCES "rating_plans"("rating_plan_id") ON DELETE SET NULL ON UPDATE CASCADE;
