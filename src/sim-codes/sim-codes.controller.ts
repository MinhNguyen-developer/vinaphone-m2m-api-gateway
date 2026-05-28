import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SimCodesService } from './sim-codes.service';
import { CreateSimCodeDto } from './dto/create-sim-code.dto';
import { UpdateSimCodeDto } from './dto/update-sim-code.dto';
import { QuerySimCodeDto } from './dto/query-sim-code.dto';
import { QuerySimCodeSimsDto } from './dto/query-simcode-sims.dto';

@ApiTags('sim-codes')
@ApiBearerAuth()
@Controller('sim-codes')
export class SimCodesController {
  constructor(private readonly simCodesService: SimCodesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách mã SIM (phân trang + search)' })
  findAll(@Query() query: QuerySimCodeDto) {
    return this.simCodesService.findAll(query);
  }

  @Get(':id/sims')
  @ApiOperation({ summary: 'Danh sách SIM ID thuộc mã SIM' })
  getSimIds(@Param('id') id: string) {
    return this.simCodesService.getSimIds(id);
  }

  @Get(':id/sims-detail')
  @ApiOperation({ summary: 'Danh sách SIM chi tiết (phân trang + sort)' })
  getSimsDetail(@Param('id') id: string, @Query() query: QuerySimCodeSimsDto) {
    return this.simCodesService.getSimsDetail(id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết mã SIM' })
  findOne(@Param('id') id: string) {
    return this.simCodesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mã SIM mới' })
  create(@Body() dto: CreateSimCodeDto) {
    return this.simCodesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật mã SIM' })
  update(@Param('id') id: string, @Body() dto: UpdateSimCodeDto) {
    return this.simCodesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá mã SIM' })
  remove(@Param('id') id: string) {
    return this.simCodesService.remove(id);
  }
}
