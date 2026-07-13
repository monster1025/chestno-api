import got from 'got'
import type { Response } from 'got'
import { config, envUrls } from '../config.js'
import type { TrueApiEnv } from '../config.js'
import { getCachedToken, clearToken } from './auth-service.js'
import type {
  CisInfoResponseItem,
  PublicCheckResponse,
  CheckCodesRequest,
  CheckCodesResponse,
  SingleCodeResult,
  ApiDebugInfo,
} from '../types/index.js'

// Статусы КМ, при которых код считается действительным (в обороте)
const VALID_STATUSES = ['INTRODUCED', 'APPLIED', 'EMITTED']

function loggedClient(prefixUrl?: string) {
  return got.extend({
    ...(prefixUrl ? { prefixUrl } : {}),
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

function apiClient(env: TrueApiEnv) {
  return loggedClient(envUrls[env].baseUrl)
}

export async function checkCodesPublic(env: TrueApiEnv, body: CheckCodesRequest): Promise<CheckCodesResponse> {
  const results: SingleCodeResult[] = []
  const queue = [...body.codes]

  async function worker() {
    while (queue.length > 0) {
      const code = queue.shift()!
      try {
        // Полный URL передаём как input (без prefixUrl) + searchParams,
        // иначе got добавляет лишний слэш (.../check/?code=) → 404.
        const { body: response } = await loggedClient().get<PublicCheckResponse>(
          envUrls[env].publicCheckUrl,
          { searchParams: { code }, timeout: { request: 10000 } }
        )
        const status = response.outerStatus || response.status || 'UNKNOWN'
        results.push({
          code: response.code || code,
          found: response.codeFounded ?? response.codeResolveData?.found ?? false,
          valid: VALID_STATUSES.includes(status),
          status,
          productName: response.productName,
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

export async function checkCodesAuth(
  env: TrueApiEnv,
  body: CheckCodesRequest,
  log?: (msg: string, data?: Record<string, unknown>) => void,
): Promise<CheckCodesResponse> {
  const token = getToken(env)
  const results: SingleCodeResult[] = []
  let debugInfo: ApiDebugInfo | undefined

  try {
    await processBatch(env, body.codes, token, results, 0)
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 401) {
      clearToken(env)
      throw err
    }
    if (err instanceof AppError) {
      debugInfo = err.debugInfo
      if (log) log('Auth API error (non-401)', { error: err.message, debugInfo })
    } else {
      debugInfo = extractDebugInfo(err)
      if (log) log('Auth API error (non-401)', { error: String(err), debugInfo })
    }

    for (const code of body.codes) {
      if (!results.find(r => r.code === code)) {
        results.push({ code, found: false, valid: false, status: 'ERROR', error: 'Auth API error' })
      }
    }
  }

  return buildResponse(results, debugInfo)
}

function buildResponse(results: SingleCodeResult[], debugInfo?: ApiDebugInfo): CheckCodesResponse {
  return {
    results,
    total: results.length,
    validCount: results.filter(r => r.valid).length,
    invalidCount: results.filter(r => !r.valid && !r.error).length,
    errorCount: results.filter(r => !!r.error).length,
    debugInfo,
  }
}

function extractRequestHeaders(options: Record<string, unknown> | undefined): Record<string, string> {
  const reqHeaders = options?.headers as Record<string, string> | undefined
  const clean: Record<string, string> = {}
  if (reqHeaders) {
    for (const [k, v] of Object.entries(reqHeaders)) {
      clean[k] = k.toLowerCase() === 'authorization' ? 'Bearer ***' : String(v)
    }
  }
  return clean
}

export function extractDebugInfoFromResponse<T>(response: Response<T>): ApiDebugInfo {
  const req = response.request as unknown as Record<string, unknown> | undefined
  const opts = req?.options as Record<string, unknown> | undefined
  return {
    request: {
      method: String(opts?.method || 'POST'),
      url: String(response.requestUrl || response.url || 'unknown'),
      headers: extractRequestHeaders(opts),
      body: (opts?.json || opts?.body) ?? null,
    },
    response: {
      statusCode: response.statusCode,
      headers: (response.headers || {}) as Record<string, string>,
      body: response.body ?? null,
    },
  }
}

export function extractDebugInfo(err: unknown): ApiDebugInfo | undefined {
  if (!err || typeof err !== 'object') return undefined
  const gotErr = err as Record<string, unknown>
  const response = gotErr.response as Record<string, unknown> | undefined
  const options = gotErr.options as Record<string, unknown> | undefined

  const code = gotErr.code ? String(gotErr.code) : undefined
  const message = gotErr.message ? String(gotErr.message) : undefined

  const cleanHeaders = extractRequestHeaders(options)

  let reqUrl = 'unknown'
  if (response?.requestUrl) {
    reqUrl = String(response.requestUrl)
  } else if (options) {
    const u = (options as Record<string, unknown>).url
    if (u) reqUrl = String(u)
    else if ((options as Record<string, unknown>).href) reqUrl = String((options as Record<string, unknown>).href)
    else if ((options as Record<string, unknown>).pathname) reqUrl = String((options as Record<string, unknown>).pathname)
  }

  const resHeaders = response?.headers as Record<string, string> | undefined

  return {
    request: {
      method: String(options?.method || 'POST'),
      url: reqUrl,
      headers: cleanHeaders,
      body: options?.json || options?.body || null,
    },
    response: {
      statusCode: Number(response?.statusCode || 0),
      headers: resHeaders || {},
      body: response?.body || null,
      errorCode: code,
      errorMessage: message,
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
  const response = await apiClient(env).post<CisInfoResponseItem[]>(
    config.trueApi.cisesInfoPath,
    {
      json: batch,
      headers: { Authorization: `Bearer ${token}` },
      timeout: { request: 30000 },
      throwHttpErrors: false,
    }
  )

  if (response.statusCode === 401) {
    const debugInfo = extractDebugInfoFromResponse(response)
    throw new AppError('Token expired', 401, debugInfo)
  }

  if (response.statusCode === 429 || (response.statusCode >= 500 && attempt < config.trueApi.maxRetries)) {
    const delay = Math.pow(2, attempt) * 500
    await sleep(delay)
    return retryOnError(env, batch, token, results, attempt + 1)
  }

  if (!response.body || !Array.isArray(response.body)) {
    const debugInfo = extractDebugInfoFromResponse(response)
    const apiErr = response.body && typeof response.body === 'object'
      ? (response.body as Record<string, unknown>).error_message || ''
      : ''
    throw new AppError(`API error: ${apiErr || response.statusCode}`, response.statusCode, debugInfo)
  }

  const items = response.body as CisInfoResponseItem[]
  for (const item of items) {
    const ci = item.cisInfo
    results.push({
      code: ci.requestedCis,
      found: !!ci.cis && !item.errorCode,
      valid: VALID_STATUSES.includes(ci.status || ''),
      status: item.errorCode || ci.status || 'UNKNOWN',
      gtin: ci.gtin,
      productName: ci.productName,
      producerName: ci.producerName,
      ownerName: ci.ownerName,
    })
  }
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


