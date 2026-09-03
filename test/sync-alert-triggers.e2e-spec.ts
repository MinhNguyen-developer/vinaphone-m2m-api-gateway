import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { SyncController } from '../src/sync/sync.controller';
import { SyncService } from '../src/sync/sync.service';
import { ConfigService } from '@nestjs/config';

describe('Sync alert triggers (e2e)', () => {
  let app: INestApplication<App>;
  const alertsService = {
    syncTriggeredAlertsBySimIds: jest.fn().mockResolvedValue(1),
  };
  const syncService = {
    syncSims: jest.fn(async () => {
      await alertsService.syncTriggeredAlertsBySimIds(['sim-1']);
    }),
    syncRatingPlans: jest.fn(),
    syncGroupSims: jest.fn(),
    syncMonthlyUsage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        { provide: SyncService, useValue: syncService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('POST /api/v1/sync/sims returns the same body while triggering alert sync', async () => {
    const startedAt = Date.now();

    const response = await request(app.getHttpServer())
      .post('/api/v1/sync/sims')
      .expect(200);

    expect(response.body.triggered).toBe(true);
    expect(response.body.job).toBe('syncSims');
    expect(typeof response.body.timestamp).toBe('string');
    expect(Date.now() - startedAt).toBeLessThan(10 * 60 * 1000);
    expect(alertsService.syncTriggeredAlertsBySimIds).toHaveBeenCalledWith([
      'sim-1',
    ]);
  });

  afterEach(async () => {
    await app.close();
  });
});
