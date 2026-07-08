import type { AuthStatus, CheckCodesResponse, UpdUploadResponse } from '../types'

const BASE_URL = ''

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getAuthKey(): Promise<{ uuid: string; data: string }> {
  return request('/auth/key')
}

export async function signIn(uuid: string, data: string): Promise<{ token: string }> {
  return request('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ uuid, data }),
  })
}

export async function getAuthStatus(): Promise<AuthStatus> {
  return request('/auth/status')
}

export async function checkCodesPublic(codes: string[]): Promise<CheckCodesResponse> {
  return request('/api/check-codes/public', {
    method: 'POST',
    body: JSON.stringify({ codes }),
  })
}

export async function checkCodesAuth(codes: string[]): Promise<CheckCodesResponse> {
  return request('/api/check-codes/auth', {
    method: 'POST',
    body: JSON.stringify({ codes }),
  })
}

export async function uploadUpd(file: File): Promise<UpdUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE_URL}/api/upload-upd`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}
