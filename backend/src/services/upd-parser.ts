import { parseStringPromise } from 'xml2js'

export interface ParsedUpd {
  codes: string[]
  fileName: string
  documentNumber?: string
  documentDate?: string
  sellerName?: string
  buyerName?: string
}

export async function parseUpdXml(xmlContent: string, fileName: string): Promise<ParsedUpd> {
  const parsed = await parseStringPromise(xmlContent, {
    ignoreAttrs: false,
    mergeAttrs: true,
  })

  const codes = extractCodes(parsed)

  return {
    codes,
    fileName,
    documentNumber: extractField(parsed, ['Документ', 'НомерДок']),
    documentDate: extractField(parsed, ['Документ', 'ДатаДок']),
    sellerName: extractField(parsed, ['Документ', 'ТаблСчФакт', 'СведПрод', 'НаимОрг']),
    buyerName: extractField(parsed, ['Документ', 'ТаблСчФакт', 'СведПокуп', 'НаимОрг']),
  }
}

function extractCodes(obj: Record<string, unknown>): string[] {
  const codes: string[] = []
  const documents = asArray<Record<string, unknown>>(obj['Документ'])

  for (const document of documents) {
    try {
      const table = document['ТаблСчФакт'] as Record<string, unknown> | undefined
      if (!table) continue
      const items = asArray<Record<string, unknown>>(table['СведТов'])

      for (const item of items) {
        const extInfo = asArray<Record<string, unknown>>(item['ДопСведТов'])
        for (const info of extInfo) {
          const kmCodes = asArray<string>(info['НомСредИдентТов'])
          codes.push(...kmCodes.filter(Boolean))
        }
      }
    } catch {
      console.warn('upd-parser: failed to extract codes from a document')
    }
  }

  return codes
}

function asArray<T>(value: unknown): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value as T[] : [value as T]
}

function extractField(obj: Record<string, unknown>, keys: string[]): string | undefined {
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }
  return typeof current === 'string' ? current : undefined
}
