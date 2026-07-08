import type { FastifyInstance } from 'fastify'
import { checkCodesPublic, checkCodesAuth } from '../services/cises-service.js'
import type { CheckCodesRequest } from '../types/index.js'

export async function cisesRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CheckCodesRequest }>('/api/check-codes/public', async (request) => {
    return checkCodesPublic(request.body)
  })

  app.post<{ Body: CheckCodesRequest }>('/api/check-codes/auth', async (request) => {
    return checkCodesAuth(request.body)
  })
}
