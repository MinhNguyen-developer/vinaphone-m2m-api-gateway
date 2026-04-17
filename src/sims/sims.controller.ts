import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SimsService } from './sims.service';
import { QuerySimDto } from './dto/query-sim.dto';
import { UpdateSimStatusDto } from './dto/update-sim-status.dto';
import { UpdateFirstUsedAtDto } from './dto/update-first-used-at.dto';
import { QueryGroupMembersDto } from './dto/query-group-members.dto';

@ApiTags('sims')
@ApiBearerAuth()
@Controller('sims')
export class SimsController {
  constructor(private readonly simsService: SimsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách SIM M2M' })
  findAll(@Query() query: QuerySimDto) {
    return this.simsService.findAll(query);
  }

  @Get('group-members/:groupId')
  @ApiOperation({ summary: 'Lấy danh sách thành viên của nhóm gói cước (SOG)' })
  @ApiParam({
    name: 'groupId',
    description: 'ID nhóm từ trường sog của Vinaphone',
  })
  getGroupMembers(
    @Query() query: QueryGroupMembersDto,
    @Param('groupId') groupId: string,
  ) {
    return this.simsService.getGroupMembers(groupId, query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái quản lý nội bộ của SIM' })
  @ApiParam({ name: 'id', description: 'UUID của SIM' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSimStatusDto) {
    return this.simsService.updateStatus(id, dto);
  }

  @Patch(':id/first-used-at')
  @ApiOperation({ summary: 'Sửa thủ công thời gian kích hoạt' })
  @ApiParam({ name: 'id', description: 'UUID của SIM' })
  updateFirstUsedAt(
    @Param('id') id: string,
    @Body() dto: UpdateFirstUsedAtDto,
  ) {
    return this.simsService.updateFirstUsedAt(id, dto);
  }
}
