import { Module } from '@nestjs/common';
import { UsageHistoryService } from './usage-history.service';
import { UsageHistoryController } from './usage-history.controller';

@Module({
  controllers: [UsageHistoryController],
  providers: [UsageHistoryService],
  exports: [UsageHistoryService],
})
export class UsageHistoryModule {}
