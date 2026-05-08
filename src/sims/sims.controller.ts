import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SimsService } from './sims.service';
import { QuerySimDto } from './dto/query-sim.dto';
import {
  BatchUpdateSimStatusDto,
  UpdateSimStatusDto,
  BulkCancelSimsByPhoneDto,
} from './dto/update-sim-status.dto';
import { UpdateFirstUsedAtDto } from './dto/update-first-used-at.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
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

  @Get('all')
  @ApiOperation({
    summary:
      'Lấy tất cả SIM (không phân trang, chỉ trả về id/phoneNumber/ratingPlanName/productCode)',
  })
  getAllSims() {
    return this.simsService.getAllSims();
  }

  @Get('group/rating-plans')
  @ApiOperation({
    summary: 'Lấy danh sách SIM theo nhóm gói cước (SOG) và gói cước',
  })
  findAllSimsGroupByRatingPlan() {
    return this.simsService.findAllSimsGroupByRatingPlan();
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

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một SIM theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của SIM' })
  findDetail(@Param('id') id: string) {
    return this.simsService.findDetail(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái quản lý nội bộ của SIM' })
  @ApiParam({ name: 'id', description: 'UUID của SIM' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSimStatusDto) {
    return this.simsService.updateStatus(id, dto);
  }

  @Patch('batch-update-status')
  @ApiOperation({ summary: 'Cập nhật trạng thái quản lý nội bộ của nhiều SIM' })
  batchUpdateStatus(@Body() body: BatchUpdateSimStatusDto) {
    return this.simsService.batchUpdateStatus(body);
  }

  @Post('bulk-cancel')
  @ApiOperation({ summary: 'Hủy hàng loạt SIM theo số điện thoại' })
  bulkCancelSims(@Body() dto: BulkCancelSimsByPhoneDto) {
    return this.simsService.bulkCancelSims(dto);
  }

  @Patch(':id/note')
  @ApiOperation({ summary: 'Cập nhật ghi chú nội bộ của SIM' })
  @ApiParam({ name: 'id', description: 'UUID của SIM' })
  updateNote(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.simsService.updateNote(id, dto);
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
