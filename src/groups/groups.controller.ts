import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { QueryGroupDto } from './dto/query-group.dto';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách nhóm SIM' })
  findAllWithQuery(@Query() query: QueryGroupDto) {
    return this.groupsService.findAll(query);
  }

  @Get('all')
  @ApiOperation({ summary: 'Danh sách nhóm SIM' })
  findAll() {
    return this.groupsService.getAllGroups();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo nhóm SIM mới' })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get(':id/sims')
  @ApiOperation({ summary: 'Danh sách SIM ID trong nhóm' })
  getSimIds(@Param('id') id: string) {
    return this.groupsService.getSimIds(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nhóm SIM' })
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa nhóm SIM' })
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }
}
