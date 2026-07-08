import {
  getUserCertificates,
  createAttachedSignature,
} from 'crypto-pro'

export interface CertInfo {
  name: string
  thumbprint: string
  issuer: string
  validTo: string
  valid: boolean
}

export async function isCadesPluginAvailable(): Promise<boolean> {
  try {
    await getUserCertificates(true)
    return true
  } catch (err) {
    if (err instanceof Error && (
      err.message.includes('undefined') || err.message.includes('not defined')
    )) return false
    throw err
  }
}

export async function listCertificates(): Promise<CertInfo[]> {
  const certs = await getUserCertificates(true)
  const now = Date.now()
  return certs.map(c => {
    const validTo = new Date(c.validTo)
    return {
      name: c.name || 'Без имени',
      thumbprint: c.thumbprint,
      issuer: c.issuerName,
      validTo: c.validTo,
      valid: validTo.getTime() > now,
    }
  })
}

export async function signWithCadesPlugin(dataBase64: string, thumbprint?: string): Promise<string> {
  const certs = await getUserCertificates(true)
  const now = Date.now()
  const validCerts = certs.filter(c => c.name && new Date(c.validTo).getTime() > now)

  if (validCerts.length === 0) {
    throw new Error('Нет доступных сертификатов с действующим сроком')
  }

  let tp = thumbprint
  if (!tp) {
    tp = validCerts[0].thumbprint
  } else {
    const found = validCerts.find(c => c.thumbprint.toUpperCase() === tp!.toUpperCase())
    if (!found) throw new Error(`Сертификат с отпечатком ${tp} не найден или просрочен`)
  }

  return createAttachedSignature(tp, dataBase64)
}
