import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { MasterSimsService } from './master-sims.service';

@ApiTags('master-sims')
@ApiBearerAuth()
@Controller('master-sims')
export class MasterSimsController {
  constructor(private readonly masterSimsService: MasterSimsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách SIM chủ kèm dung lượng tổng / đã dùng / còn lại' })
  findAll() {
    return this.masterSimsService.findAll();
  }

  @Get(':code/members')
  @ApiOperation({ summary: 'Danh sách SIM thành viên thuộc SIM chủ' })
  @ApiParam({ name: 'code', description: 'Mã SIM chủ' })
  findMembers(@Param('code') code: string, @Query() query: Record<string, unknown>) {
    return this.masterSimsService.findMembers(code, query);
  }
}
