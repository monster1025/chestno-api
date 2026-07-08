import type { FastifyInstance } from 'fastify'
import type { TrueApiEnv } from '../config.js'
import { checkCodesPublic, checkCodesAuth, AppError } from '../services/cises-service.js'
import type { CheckCodesRequest } from '../types/index.js'

const VALID_ENVS = ['sandbox', 'prod']

function parseEnv(query: Record<string, string>): TrueApiEnv {
  const env = query.env
  if (env && VALID_ENVS.includes(env)) return env as TrueApiEnv
  return 'sandbox'
}

const checkCodesSchema = {
  body: {
    type: 'object',
    required: ['codes'],
    properties: {
      codes: {
        type: 'array',
        items: { type: 'string', minLength: 1, maxLength: 256 },
        minItems: 1,
        maxItems: 10000,
      },
    },
  },
}

export async function cisesRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CheckCodesRequest }>('/api/check-codes/public', { schema: checkCodesSchema }, async (request) => {
    const env = parseEnv(request.query as Record<string, string>)
    return checkCodesPublic(env, request.body)
  })

  app.post<{ Body: CheckCodesRequest }>('/api/check-codes/auth', { schema: checkCodesSchema }, async (request, reply) => {
    const env = parseEnv(request.query as Record<string, string>)
    try {
      return await checkCodesAuth(env, request.body)
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
