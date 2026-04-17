import { Module } from '@nestjs/common';
import { RatingPlanController } from './rating-plan.controller';
import { RatingPlanService } from './rating-plan.service';

@Module({
  controllers: [RatingPlanController],
  providers: [RatingPlanService],
  exports: [RatingPlanService],
})
export class RatingPlanModule {}
