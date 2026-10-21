import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SimsModule } from './sims/sims.module';
import { MasterSimsModule } from './master-sims/master-sims.module';
import { UsageHistoryModule } from './usage-history/usage-history.module';
import { GroupsModule } from './groups/groups.module';
import { AlertsModule } from './alerts/alerts.module';
import { SyncModule } from './sync/sync.module';
import { RatingPlanModule } from './rating-plan/rating-plan.module';
import { SimGroupModule } from './sim-group/sim-group.module';
import { ContractsModule } from './contracts/contracts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SimCodesModule } from './sim-codes/sim-codes.module';
import { BackupModule } from './backup/backup.module';
import { TenantContextInterceptor } from './auth/tenant-context.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    HttpModule,
    PrismaModule,
    AuthModule,
    SimsModule,
    MasterSimsModule,
    UsageHistoryModule,
    GroupsModule,
    AlertsModule,
    SyncModule,
    RatingPlanModule,
    SimGroupModule,
    ContractsModule,
    DashboardModule,
    SimCodesModule,
    BackupModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
