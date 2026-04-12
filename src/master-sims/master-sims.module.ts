import { Module } from '@nestjs/common';
import { MasterSimsController } from './master-sims.controller';
import { MasterSimsService } from './master-sims.service';

@Module({
  controllers: [MasterSimsController],
  providers: [MasterSimsService],
  exports: [MasterSimsService],
})
export class MasterSimsModule {}
