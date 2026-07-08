export type ApiEnv = 'sandbox' | 'prod'

export interface AuthStatus {
  authenticated: boolean
  tokenExpiresAt: string | null
}

export interface CodeResult {
  code: string
  found: boolean
  valid: boolean
  status: string
  gtin?: string
  productName?: string
  producerName?: string
  ownerName?: string
  error?: string
}

export interface CheckCodesResponse {
  results: CodeResult[]
  total: number
  validCount: number
  invalidCount: number
  errorCount: number
}

export interface UpdDocument {
  number: string | undefined
  date: string | undefined
  seller: string | undefined
  buyer: string | undefined
  fileName: string
}

export interface ApiErrorLog {
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

export interface ApiErrorResponse {
  error: string
  debugInfo?: ApiErrorLog
}

export interface UpdUploadResponse {
  document: UpdDocument
  codesFound: number
  results: CheckCodesResponse
}
