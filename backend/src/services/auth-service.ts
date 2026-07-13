import got from 'got'
import type { Response } from 'got'
import { config, envUrls } from '../config.js'
import type { TrueApiEnv } from '../config.js'
import { getToken, setToken, invalidateToken, hasToken, getTokenTTL } from './token-cache.js'
import { AppError, extractDebugInfo } from './cises-service.js'
import type { AuthKeyResponse, AuthSignInRequest, AuthSignInResponse } from '../types/index.js'

function loggedClient(prefixUrl: string) {
  return got.extend({
    prefixUrl,
    responseType: 'json',
    hooks: {
      beforeRequest: [
        (options) => {
          const headers = { ...options.headers } as Record<string, string>
          if (headers.authorization) {
            headers.authorization = 'Bearer ***'
          }
          console.log(JSON.stringify({
            type: 'trueapi_request',
            method: options.method,
            url: String(options.url || ''),
            headers,
            body: options.json || options.body || null,
          }))
        },
      ],
      afterResponse: [
        (response: Response) => {
          console.log(JSON.stringify({
            type: 'trueapi_response',
            statusCode: response.statusCode,
            url: response.requestUrl,
            body: response.body,
          }))
          return response
        },
      ],
    },
  })
}

function authClient(env: TrueApiEnv) {
  return loggedClient(envUrls[env].baseUrl + config.trueApi.authPath)
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
    const requestBody: Record<string, unknown> = { uuid: body.uuid, data: body.data }
    if (body.inn) {
      requestBody.inn = body.inn
    }
    const { body: response } = await authClient(env).post<AuthSignInResponse>('simpleSignIn', {
      json: requestBody,
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

export function setTokenDirect(env: TrueApiEnv, token: string): void {
  setToken(env, token)
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
