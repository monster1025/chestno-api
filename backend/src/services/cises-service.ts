import got from 'got'
import { config } from '../config.js'
import { getCachedToken, clearToken } from './auth-service.js'
import type {
  CisInfoResponse,
  PublicCheckResponse,
  CheckCodesRequest,
  CheckCodesResponse,
  SingleCodeResult,
} from '../types/index.js'

const apiClient = got.extend({
  prefixUrl: config.trueApi.baseUrl,
  responseType: 'json',
})

export async function checkCodesPublic(body: CheckCodesRequest): Promise<CheckCodesResponse> {
  const results: SingleCodeResult[] = []
  const queue = [...body.codes]

  async function worker() {
    while (queue.length > 0) {
      const code = queue.shift()!
      try {
        const { body: response } = await got.get<PublicCheckResponse>(
          `${config.trueApi.publicCheckUrl}?code=${encodeURIComponent(code)}`,
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

function getToken(): string {
  const token = getCachedToken()
  if (!token) throw new AppError('Not authenticated', 401)
  return token
}

export async function checkCodesAuth(body: CheckCodesRequest): Promise<CheckCodesResponse> {
  const token = getToken()
  const results: SingleCodeResult[] = []

  try {
    await processBatch(body.codes, token, results, 0)
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 401) {
      clearToken()
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

async function processBatch(
  codes: string[], token: string, results: SingleCodeResult[], batchIndex: number
): Promise<void> {
  if (batchIndex >= codes.length) return

  const start = batchIndex
  const end = Math.min(start + config.trueApi.batchSize, codes.length)
  const batch = codes.slice(start, end)

  await retryOnError(batch, token, results)

  await processBatch(codes, token, results, end)
}

async function retryOnError(
  batch: string[], token: string, results: SingleCodeResult[], attempt = 0
): Promise<void> {
  try {
    const { body: response } = await apiClient.post<CisInfoResponse>(
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
      throw new AppError('Token expired', 401)
    }

    const isRetryable = isRetryableError(err)
    if (isRetryable && attempt < config.trueApi.maxRetries) {
      const delay = Math.pow(2, attempt) * 500
      await sleep(delay)
      return retryOnError(batch, token, results, attempt + 1)
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
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
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
