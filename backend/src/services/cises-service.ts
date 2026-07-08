import got from 'got'
import { config } from '../config.js'
import { getValidToken } from './auth-service.js'
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

  for (const code of body.codes) {
    try {
      const { body: response } = await got.get<PublicCheckResponse>(
        `${config.trueApi.publicCheckUrl}?code=${encodeURIComponent(code)}`,
        { responseType: 'json' }
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

  return buildResponse(results)
}

export async function checkCodesAuth(body: CheckCodesRequest): Promise<CheckCodesResponse> {
  const token = await getValidToken()
  const results: SingleCodeResult[] = []

  for (let i = 0; i < body.codes.length; i += config.trueApi.batchSize) {
    const batch = body.codes.slice(i, i + config.trueApi.batchSize)

    try {
      const { body: response } = await apiClient.post<CisInfoResponse>(
        config.trueApi.cisesInfoPath,
        {
          json: { cisList: batch },
          headers: { Authorization: `Bearer ${token}` },
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
    } catch {
      for (const code of batch) {
        results.push({
          code,
          found: false,
          valid: false,
          status: 'ERROR',
          error: 'Auth API error',
        })
      }
    }
  }

  return buildResponse(results)
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
