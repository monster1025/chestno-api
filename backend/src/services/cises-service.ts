import got from 'got'
import { config, envUrls } from '../config.js'
import type { TrueApiEnv } from '../config.js'
import { getCachedToken, clearToken } from './auth-service.js'
import type {
  CisInfoResponse,
  PublicCheckResponse,
  CheckCodesRequest,
  CheckCodesResponse,
  SingleCodeResult,
} from '../types/index.js'

function apiClient(env: TrueApiEnv) {
  return got.extend({
    prefixUrl: envUrls[env].baseUrl,
    responseType: 'json',
  })
}

export async function checkCodesPublic(env: TrueApiEnv, body: CheckCodesRequest): Promise<CheckCodesResponse> {
  const results: SingleCodeResult[] = []
  const queue = [...body.codes]

  async function worker() {
    while (queue.length > 0) {
      const code = queue.shift()!
      try {
        const { body: response } = await got.get<PublicCheckResponse>(
          `${envUrls[env].publicCheckUrl}?code=${encodeURIComponent(code)}`,
          { responseType: 'json', timeout: { request: 10000 } }
        )
        results.push({
          code: response.code,
          found: response.found,
          valid: response.valid,
          status: response.status,
        })
      } catch {
        results.push({
          code,
          found: false,
          valid: false,
          status: 'ERROR',
          error: 'Public check API error',
        })
      }
    }
  }

  const workers = Array.from({ length: config.trueApi.publicCheckConcurrency }, () => worker())
  await Promise.all(workers)

  return buildResponse(results)
}

function getToken(env: TrueApiEnv): string {
  const token = getCachedToken(env)
  if (!token) throw new AppError('Not authenticated', 401)
  return token
}

export async function checkCodesAuth(env: TrueApiEnv, body: CheckCodesRequest): Promise<CheckCodesResponse> {
  const token = getToken(env)
  const results: SingleCodeResult[] = []

  try {
    await processBatch(env, body.codes, token, results, 0)
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 401) {
      clearToken(env)
      throw err
    }
    for (const code of body.codes) {
      if (!results.find(r => r.code === code)) {
        results.push({ code, found: false, valid: false, status: 'ERROR', error: 'Auth API error' })
      }
    }
  }

  return buildResponse(results)
}

export interface ApiDebugInfo {
  request: {
    method: string
    url: string
    headers: Record<string, string>
    body: unknown
  }
  response: {
    statusCode: number
    headers: Record<string, string>
    body: unknown
  }
}

export function extractDebugInfo(err: unknown): ApiDebugInfo | undefined {
  if (!err || typeof err !== 'object') return undefined
  const gotErr = err as Record<string, unknown>
  const response = gotErr.response as Record<string, unknown> | undefined
  const options = gotErr.options as Record<string, unknown> | undefined
  if (!response) return undefined

  const reqHeaders = options?.headers as Record<string, string> | undefined
  const cleanHeaders: Record<string, string> = {}
  if (reqHeaders) {
    for (const [k, v] of Object.entries(reqHeaders)) {
      if (k.toLowerCase() === 'authorization') {
        cleanHeaders[k] = 'Bearer ***'
      } else {
        cleanHeaders[k] = String(v)
      }
    }
  }

  const resHeaders = response.headers as Record<string, string> | undefined

  return {
    request: {
      method: String(options?.method || 'POST'),
      url: String(response.requestUrl || (options?.url?.toString()) || 'unknown'),
      headers: cleanHeaders,
      body: options?.json || options?.body || null,
    },
    response: {
      statusCode: Number(response.statusCode),
      headers: resHeaders || {},
      body: response.body || null,
    },
  }
}

async function processBatch(
  env: TrueApiEnv, codes: string[], token: string, results: SingleCodeResult[], batchIndex: number
): Promise<void> {
  if (batchIndex >= codes.length) return

  const start = batchIndex
  const end = Math.min(start + config.trueApi.batchSize, codes.length)
  const batch = codes.slice(start, end)

  await retryOnError(env, batch, token, results)

  await processBatch(env, codes, token, results, end)
}

async function retryOnError(
  env: TrueApiEnv, batch: string[], token: string, results: SingleCodeResult[], attempt = 0
): Promise<void> {
  try {
    const { body: response } = await apiClient(env).post<CisInfoResponse>(
      config.trueApi.cisesInfoPath,
      {
        json: { cisList: batch },
        headers: { Authorization: `Bearer ${token}` },
        timeout: { request: 30000 },
      }
    )

    for (const item of response.cisInfo) {
      results.push({
        code: item.requestedCis,
        found: !!item.cis,
        valid: item.status === 'INTRODUCED' || item.status === 'APPLIED' || item.status === 'EMITTED',
        status: item.status || 'UNKNOWN',
        gtin: item.gtin,
        productName: item.productName,
        producerName: item.producerName,
        ownerName: item.ownerName,
      })
    }
  } catch (err) {
    if (is401(err)) {
      const debugInfo = extractDebugInfo(err)
      throw new AppError('Token expired', 401, debugInfo)
    }

    const isRetryable = isRetryableError(err)
    if (isRetryable && attempt < config.trueApi.maxRetries) {
      const delay = Math.pow(2, attempt) * 500
      await sleep(delay)
      return retryOnError(env, batch, token, results, attempt + 1)
    }

    throw err
  }
}

function is401(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  return 'response' in err &&
    (err as { response?: { statusCode?: number } }).response?.statusCode === 401
}

function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return true
  const statusCode = (err as { response?: { statusCode?: number } }).response?.statusCode
  if (!statusCode) return true
  return statusCode === 429 || statusCode >= 500
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class AppError extends Error {
  statusCode: number
  debugInfo?: ApiDebugInfo
  constructor(message: string, statusCode: number, debugInfo?: ApiDebugInfo) {
    super(message)
    this.statusCode = statusCode
    this.debugInfo = debugInfo
  }
}

function buildResponse(results: SingleCodeResult[]): CheckCodesResponse {
  return {
    results,
    total: results.length,
    validCount: results.filter(r => r.valid).length,
    invalidCount: results.filter(r => !r.valid && !r.error).length,
    errorCount: results.filter(r => !!r.error).length,
  }
}
