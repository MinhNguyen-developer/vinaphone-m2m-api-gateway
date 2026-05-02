import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RatingPlanService } from './rating-plan.service';
import { QueryRatingPlanDto } from './dto/query-rating-plan.dto';

@ApiTags('rating-plans')
@ApiBearerAuth()
@Controller('rating-plans')
export class RatingPlanController {
  constructor(private readonly ratingPlanService: RatingPlanService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách gói cước' })
  async findAll(@Query() query: QueryRatingPlanDto) {
    return this.ratingPlanService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin gói cước theo ID' })
  async findById(@Param('id') id: number) {
    return this.ratingPlanService.findByRatingPlanId(id);
  }
}
