import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { UpdateAlertCheckDto } from './dto/update-alert-check.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { QueryAlertDto } from './dto/query-alert.dto';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách cấu hình cảnh báo' })
  findAll(@Query() dto: QueryAlertDto) {
    return this.alertsService.findAll(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo cấu hình cảnh báo mới' })
  create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Bật/tắt cảnh báo' })
  @ApiParam({ name: 'id', description: 'UUID của AlertConfig' })
  toggleActive(@Param('id') id: string) {
    return this.alertsService.toggleActive(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật cấu hình cảnh báo' })
  @ApiParam({ name: 'id', description: 'UUID của AlertConfig' })
  update(@Param('id') id: string, @Body() dto: UpdateAlertDto) {
    return this.alertsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá cấu hình cảnh báo' })
  @ApiParam({ name: 'id', description: 'UUID của AlertConfig' })
  remove(@Param('id') id: string) {
    return this.alertsService.remove(id);
  }

  @Get('triggered')
  @ApiOperation({ summary: 'Danh sách SIM đang vượt ngưỡng cảnh báo' })
  @ApiQuery({ name: 'ratingPlanId', required: false })
  findTriggered(@Query('ratingPlanId') ratingPlanId?: number) {
    return this.alertsService.findTriggered(ratingPlanId);
  }

  @Patch('triggered/:simId/:alertId/check')
  @ApiOperation({ summary: 'Đánh dấu cảnh báo đã được kiểm tra' })
  @ApiParam({ name: 'simId', description: 'UUID của SIM' })
  @ApiParam({ name: 'alertId', description: 'UUID của AlertConfig' })
  updateCheck(
    @Param('simId') simId: string,
    @Param('alertId') alertId: string,
    @Body() dto: UpdateAlertCheckDto,
    @Request() req: { user: { username: string } },
  ) {
    return this.alertsService.updateCheck(
      simId,
      alertId,
      dto,
      req.user.username,
    );
  }
}
