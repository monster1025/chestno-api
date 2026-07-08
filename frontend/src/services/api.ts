import type { AuthStatus, CheckCodesResponse, UpdUploadResponse, ApiErrorResponse, ApiEnv } from '../types'

const BASE_URL = ''

let currentEnv: ApiEnv = 'sandbox'
let onUnauthorized: ((env: ApiEnv) => void) | null = null

export interface RequestError extends Error {
  debugInfo?: ApiErrorResponse['debugInfo']
}

export function setOnUnauthorized(cb: (env: ApiEnv) => void): void {
  onUnauthorized = cb
}

export function getEnv(): ApiEnv {
  return currentEnv
}

export function setEnv(env: ApiEnv): void {
  currentEnv = env
}

function qs(env?: ApiEnv): string {
  return `?env=${env || currentEnv}`
}

async function handleError(res: Response, env: ApiEnv): Promise<never> {
  if (res.status === 401 && onUnauthorized) {
    onUnauthorized(env)
  }
  const body: ApiErrorResponse = await res.json().catch(() => ({ error: res.statusText }))
  const err = new Error(body.error || `HTTP ${res.status}`) as RequestError
  err.debugInfo = body.debugInfo
  throw err
}

async function request<T>(url: string, options?: RequestInit & { env?: ApiEnv }): Promise<T> {
  const reqEnv = options?.env || currentEnv
  const headers: Record<string, string> = {}
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (options?.headers) {
    Object.assign(headers, options.headers as Record<string, string>)
  }

  const urlWithEnv = `${BASE_URL}${url}${qs(reqEnv)}`
  const res = await fetch(urlWithEnv, {
    headers,
    ...options,
  })

  if (!res.ok) await handleError(res, reqEnv)
  return res.json()
}

export async function getAuthKey(env?: ApiEnv): Promise<{ uuid: string; data: string }> {
  return request('/auth/key', { env })
}

export async function signIn(uuid: string, data: string, env?: ApiEnv): Promise<{ token: string }> {
  return request('/auth/simpleSignIn', {
    method: 'POST',
    body: JSON.stringify({ uuid, data }),
    env,
  })
}

export async function getAuthStatus(env?: ApiEnv): Promise<AuthStatus> {
  return request('/auth/status', { env })
}

export async function logout(env?: ApiEnv): Promise<void> {
  await request('/auth/logout', { method: 'POST', env })
}

export async function checkCodesPublic(codes: string[], env?: ApiEnv): Promise<CheckCodesResponse> {
  return request('/api/check-codes/public', {
    method: 'POST',
    body: JSON.stringify({ codes }),
    env,
  })
}

export async function checkCodesAuth(codes: string[], env?: ApiEnv): Promise<CheckCodesResponse> {
  return request('/api/check-codes/auth', {
    method: 'POST',
    body: JSON.stringify({ codes }),
    env,
  })
}

export async function uploadUpd(file: File, env?: ApiEnv): Promise<UpdUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return request('/api/upload-upd', { method: 'POST', body: formData, env })
}

export async function getPlansList(): Promise<{ name: string; path: string; size: number }[]> {
  return request('/api/plans')
}

export async function getPlanContent(filename: string): Promise<{ name: string; content: string }> {
  return request(`/api/plans/${filename}`)
}
