import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { UpdateAlertCheckDto } from './dto/update-alert-check.dto';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách cấu hình cảnh báo' })
  findAll() {
    return this.alertsService.findAll();
  }

  @Get('triggered')
  @ApiOperation({ summary: 'Danh sách SIM đang vượt ngưỡng cảnh báo' })
  @ApiQuery({ name: 'productCode', required: false })
  findTriggered(@Query('productCode') productCode?: string) {
    return this.alertsService.findTriggered(productCode);
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
    return this.alertsService.updateCheck(simId, alertId, dto, req.user.username);
  }
}
