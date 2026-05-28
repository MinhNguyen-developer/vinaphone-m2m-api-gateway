import { Module } from '@nestjs/common';
import { SimCodesController } from './sim-codes.controller';
import { SimCodesService } from './sim-codes.service';

@Module({
  controllers: [SimCodesController],
  providers: [SimCodesService],
  exports: [SimCodesService],
})
export class SimCodesModule {}
