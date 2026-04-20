import { Module } from '@nestjs/common';
import { SimGroupService } from './sim-group.service';
import { SimGroupController } from './sim-group.controller';

@Module({
  controllers: [SimGroupController],
  providers: [SimGroupService],
  exports: [SimGroupService],
})
export class SimGroupModule {}
