import { Controller, Get, Query } from '@nestjs/common';
import { SimGroupService } from './sim-group.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuerySimGroupDto } from './dto/query-sim-group.dto';

@ApiTags('sim-group')
@ApiBearerAuth()
@Controller('sim-group')
export class SimGroupController {
  constructor(private readonly simGroupService: SimGroupService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách nhóm thuê bao' })
  getSimGroups(@Query() query: QuerySimGroupDto) {
    return this.simGroupService.getSimGroups(query);
  }
}
