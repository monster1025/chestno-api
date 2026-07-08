import NodeCache from 'node-cache'
import { config } from '../config.js'

const cache = new NodeCache({
  stdTTL: config.trueApi.tokenTTL / 1000,
  checkperiod: 600,
})

const TOKEN_KEY = 'true_api_token'

export function getToken(): string | undefined {
  return cache.get<string>(TOKEN_KEY)
}

export function setToken(token: string): void {
  cache.set(TOKEN_KEY, token)
}

export function hasToken(): boolean {
  return cache.has(TOKEN_KEY)
}

export function getTokenTTL(): number | undefined {
  return cache.getTtl(TOKEN_KEY)
}

export function invalidateToken(): void {
  cache.del(TOKEN_KEY)
}
