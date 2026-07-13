export interface AuthKeyResponse {
  uuid: string
  data: string
}

export interface AuthSignInRequest {
  uuid: string
  data: string
  inn?: string
}

export interface AuthSignInResponse {
  token: string
  uuidToken?: string
  expireDate?: string
}

export interface CisInfoItem {
  requestedCis: string
  cis?: string
  gtin?: string
  status?: string
  productName?: string
  productGroup?: string
  producerName?: string
  ownerName?: string
  ownerBin?: string
  producedDate?: string
  packageType?: string
  error?: string
}

export interface CisInfoResponseItem {
  cisInfo: CisInfoItem
  errorMessage?: string | null
  errorCode?: string | null
}

export interface PublicCheckResponse {
  code: string
  found: boolean
  valid: boolean
  status: string
}

export interface CheckCodesRequest {
  codes: string[]
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
    errorCode?: string
    errorMessage?: string
  }
}

export interface SingleCodeResult {
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
  results: SingleCodeResult[]
  total: number
  validCount: number
  invalidCount: number
  errorCount: number
  debugInfo?: ApiDebugInfo
}
