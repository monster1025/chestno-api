export type TrueApiEnv = 'sandbox' | 'prod'

export const envUrls: Record<TrueApiEnv, { baseUrl: string; publicCheckUrl: string }> = {
  sandbox: {
    baseUrl: process.env.SANDBOX_URL || 'https://markirovka.sandbox.crptech.ru/api/v3/true-api',
    publicCheckUrl: process.env.SANDBOX_PUBLIC_CHECK_URL || 'https://mobile.api.crpt.ru/mobile/check',
  },
  prod: {
    baseUrl: process.env.PROD_URL || 'https://markirovka.crpt.ru/api/v3/true-api',
    publicCheckUrl: process.env.PROD_PUBLIC_CHECK_URL || 'https://mobile.api.crpt.ru/mobile/check',
  },
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',

  corsOrigin: process.env.CORS_ORIGIN || '*',

  trueApi: {
    authPath: '/auth',
    cisesInfoPath: 'cises/info',
    codesCheckPath: 'codes/check',
    batchSize: 1000,
    tokenTTL: 10 * 60 * 60 * 1000,
    maxRetries: 3,
    publicCheckConcurrency: 10,
  },
}
