import type { FastifyInstance } from 'fastify'
import type { TrueApiEnv } from '../config.js'
import { parseUpdXml } from '../services/upd-parser.js'
import { checkCodesAuth, AppError } from '../services/cises-service.js'

const VALID_ENVS = ['sandbox', 'prod']

function parseEnv(query: Record<string, string>): TrueApiEnv {
  const env = query.env
  if (env && VALID_ENVS.includes(env)) return env as TrueApiEnv
  return 'sandbox'
}

export async function updRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/upload-upd', async (request, reply) => {
    const env = parseEnv(request.query as Record<string, string>)
    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' })
    }

    const buffer = await data.toBuffer()
    const xmlContent = buffer.toString('utf-8')
    const fileName = data.filename

    let parsed
    try {
      parsed = await parseUpdXml(xmlContent, fileName)
    } catch {
      return reply.status(400).send({ error: 'Invalid XML file' })
    }

    if (parsed.codes.length === 0) {
      return reply.status(400).send({ error: 'No marking codes found in UPD' })
    }

    try {
      const checkResults = await checkCodesAuth(env, { codes: parsed.codes })

      return {
        document: {
          number: parsed.documentNumber,
          date: parsed.documentDate,
          seller: parsed.sellerName,
          buyer: parsed.buyerName,
          fileName: parsed.fileName,
        },
        codesFound: parsed.codes.length,
        results: checkResults,
      }
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({
          error: err.message,
          debugInfo: err.debugInfo,
        })
      }
      throw err
    }
  })
}
