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
    baseUrl:
      process.env.VINAPHONE_API_BASE_URL ||
      'https://api-m2m.vinaphone.com.vn/api',
    oneiotBaseUrl:
      process.env.VINAPHONE_ONEIOT_BASE_URL ||
      'https://api-m2m.oneiot.com.vn/api',
    email: process.env.VINAPHONE_API_EMAIL || '',
    password: process.env.VINAPHONE_API_PASSWORD || '',
    timeoutMs: parseInt(process.env.VINAPHONE_API_TIMEOUT_MS ?? '10000', 10),
    /** Timeout for large data fetches (quickSearch, memberOfGr) — default 2 minutes */
    dataTimeoutMs: parseInt(
      process.env.VINAPHONE_API_DATA_TIMEOUT_MS ?? '120000',
      10,
    ),
  },

  syncCron: process.env.SYNC_CRON || '*/10 * * * *',

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
});
