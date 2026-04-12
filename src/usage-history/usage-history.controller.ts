import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsageHistoryService } from './usage-history.service';

@ApiTags('sims')
@ApiBearerAuth()
@Controller('sims')
export class UsageHistoryController {
  constructor(private readonly usageHistoryService: UsageHistoryService) {}

  @Get(':phoneNumber/usage-history')
  @ApiOperation({ summary: 'Lịch sử dung lượng theo tháng của một SIM' })
  @ApiParam({ name: 'phoneNumber', description: 'Số điện thoại SIM' })
  @ApiQuery({ name: 'fromMonth', required: false, example: '2025-01' })
  @ApiQuery({ name: 'toMonth', required: false, example: '2025-03' })
  getUsageHistory(
    @Param('phoneNumber') phoneNumber: string,
    @Query('fromMonth') fromMonth?: string,
    @Query('toMonth') toMonth?: string,
  ) {
    return this.usageHistoryService.findByPhoneNumber(phoneNumber, fromMonth, toMonth);
  }
}
