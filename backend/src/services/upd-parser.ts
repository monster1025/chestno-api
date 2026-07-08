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
    explicitArray: false,
    ignoreAttrs: false,
    mergeAttrs: true,
  })

  const codes = extractCodes(parsed)

  return {
    codes,
    fileName,
    documentNumber: extractField(parsed, 'Документ', 'НомерДок'),
    documentDate: extractField(parsed, 'Документ', 'ДатаДок'),
    sellerName: extractField(parsed, 'Документ', 'ТаблСчФакт', 'СведПрод', 'НаимОрг'),
    buyerName: extractField(parsed, 'Документ', 'ТаблСчФакт', 'СведПокуп', 'НаимОрг'),
  }
}

function extractCodes(obj: Record<string, unknown>): string[] {
  const codes: string[] = []

  try {
    const document = obj['Документ'] as Record<string, unknown>
    const table = document['ТаблСчФакт'] as Record<string, unknown>
    const items = table['СведТов'] as Record<string, unknown>[]

    if (Array.isArray(items)) {
      for (const item of items) {
        const extInfo = item['ДопСведТов'] as Record<string, unknown>
        if (extInfo) {
          const kmCodes = extInfo['НомСредИдентТов']
          if (Array.isArray(kmCodes)) {
            codes.push(...kmCodes.filter(Boolean))
          } else if (typeof kmCodes === 'string') {
            codes.push(kmCodes)
          }
        }
      }
    }
  } catch {
    // XML structure may vary; return what we found
  }

  return codes
}

function extractField(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
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
