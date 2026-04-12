export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  jwt: {
    secret: process.env.JWT_SECRET || 'changeme',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  vinaphone: {
    baseUrl: process.env.VINAPHONE_API_BASE_URL || '',
    apiKey: process.env.VINAPHONE_API_KEY || '',
    timeoutMs: parseInt(process.env.VINAPHONE_API_TIMEOUT_MS ?? '10000', 10),
  },

  syncCron: process.env.SYNC_CRON || '*/10 * * * *',

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
});

