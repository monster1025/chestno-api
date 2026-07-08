import got from 'got'
import { config, envUrls } from '../config.js'
import type { TrueApiEnv } from '../config.js'
import { getToken, setToken, invalidateToken, hasToken, getTokenTTL } from './token-cache.js'
import { AppError, extractDebugInfo } from './cises-service.js'
import type { AuthKeyResponse, AuthSignInRequest, AuthSignInResponse } from '../types/index.js'

function authClient(env: TrueApiEnv) {
  return got.extend({
    prefixUrl: envUrls[env].baseUrl + config.trueApi.authPath,
    responseType: 'json',
  })
}

export async function getAuthKey(env: TrueApiEnv): Promise<AuthKeyResponse> {
  try {
    const { body } = await authClient(env).get<AuthKeyResponse>('key')
    return body
  } catch (err) {
    const info = extractDebugInfo(err)
    const status = info?.response.statusCode || 502
    throw new AppError(info?.response.body ? String(info.response.body) : 'Failed to get auth key', status, info)
  }
}

export async function signIn(env: TrueApiEnv, body: AuthSignInRequest): Promise<AuthSignInResponse> {
  try {
    const { body: response } = await authClient(env).post<AuthSignInResponse>('simpleSignIn', {
      json: body,
    })
    setToken(env, response.token)
    return response
  } catch (err) {
    const info = extractDebugInfo(err)
    const status = info?.response.statusCode || 502
    throw new AppError(info?.response.body ? String(info.response.body) : 'Failed to sign in', status, info)
  }
}

export function getCachedToken(env: TrueApiEnv): string | undefined {
  return getToken(env)
}

export function clearToken(env: TrueApiEnv): void {
  invalidateToken(env)
}

export function isAuthenticated(env: TrueApiEnv): boolean {
  return hasToken(env)
}

export function getAuthStatus(env: TrueApiEnv): { authenticated: boolean; tokenExpiresAt: string | null } {
  const ttl = getTokenTTL(env)
  return {
    authenticated: hasToken(env),
    tokenExpiresAt: ttl ? new Date(ttl).toISOString() : null,
  }
}
