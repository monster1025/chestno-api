import NodeCache from 'node-cache'
import { config } from '../config.js'
import type { TrueApiEnv } from '../config.js'

const cache = new NodeCache({
  stdTTL: config.trueApi.tokenTTL / 1000,
  checkperiod: 600,
})

function tokenKey(env: TrueApiEnv): string {
  return `true_api_token_${env}`
}

export function getToken(env: TrueApiEnv): string | undefined {
  return cache.get<string>(tokenKey(env))
}

export function setToken(env: TrueApiEnv, token: string): void {
  cache.set(tokenKey(env), token)
}

export function hasToken(env: TrueApiEnv): boolean {
  return cache.has(tokenKey(env))
}

export function getTokenTTL(env: TrueApiEnv): number | undefined {
  return cache.getTtl(tokenKey(env))
}

export function invalidateToken(env: TrueApiEnv): void {
  cache.del(tokenKey(env))
}
