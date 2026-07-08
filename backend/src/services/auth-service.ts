import got from 'got'
import { config } from '../config.js'
import { getToken, setToken } from './token-cache.js'
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

export async function getValidToken(): Promise<string> {
  const cached = getToken()
  if (cached) return cached

  const { uuid, data } = await getAuthKey()
  const signature = await signData(data)
  const { token } = await signIn({ uuid, data: signature })
  return token
}

async function signData(data: string): Promise<string> {
  try {
    const { execSync } = await import('child_process')

    const thumbprint = process.env.CERT_THUMBPRINT
    if (!thumbprint) throw new Error('CERT_THUMBPRINT not set')

    const result = execSync(
      `cryptcp -sign -detached -base64 -thumbprint "${thumbprint}" -in <(echo -n "${data}")`,
      { encoding: 'utf-8' }
    )
    return result.trim()
  } catch (err) {
    throw new Error(`Failed to sign data with CryptoPro: ${err}`)
  }
}
