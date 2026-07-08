export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',

  trueApi: {
    baseUrl: process.env.TRUE_API_URL || 'https://markirovka.sandbox.crptech.ru/api/v3/true-api',
    publicCheckUrl: process.env.PUBLIC_CHECK_URL || 'https://mobile.api.crpt.ru/mobile/check',
    authPath: '/auth',
    cisesInfoPath: '/cises/info',
    codesCheckPath: '/codes/check',
    batchSize: 1000,
    tokenTTL: 10 * 60 * 60 * 1000,
  },
}
