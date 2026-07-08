import type { FastifyInstance } from 'fastify'
import { checkCodesPublic, checkCodesAuth, AppError } from '../services/cises-service.js'
import type { CheckCodesRequest } from '../types/index.js'

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
    return checkCodesPublic(request.body)
  })

  app.post<{ Body: CheckCodesRequest }>('/api/check-codes/auth', { schema: checkCodesSchema }, async (request, reply) => {
    try {
      return await checkCodesAuth(request.body)
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.message })
      }
      throw err
    }
  })
}
