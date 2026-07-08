import got from 'got'
import { config } from '../config.js'
import { getToken, setToken, invalidateToken } from './token-cache.js'
import type { AuthKeyResponse, AuthSignInRequest, AuthSignInResponse } from '../types/index.js'

const authClient = got.extend({
  prefixUrl: config.trueApi.baseUrl + config.trueApi.authPath,
  responseType: 'json',
})

export async function getAuthKey(): Promise<AuthKeyResponse> {
  const { body } = await authClient.get<AuthKeyResponse>('key')
  return body
}

export async function signIn(body: AuthSignInRequest): Promise<AuthSignInResponse> {
  const { body: response } = await authClient.post<AuthSignInResponse>('simpleSignIn', {
    json: body,
  })
  setToken(response.token)
  return response
}

export function getCachedToken(): string | undefined {
  return getToken()
}

export function clearToken(): void {
  invalidateToken()
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
