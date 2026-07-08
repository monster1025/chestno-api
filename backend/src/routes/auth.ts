import type { FastifyInstance } from 'fastify'
import { getAuthKey, signIn } from '../services/auth-service.js'
import { getTokenTTL, hasToken } from '../services/token-cache.js'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get('/auth/key', async () => {
    const authKey = await getAuthKey()
    return { uuid: authKey.uuid, data: authKey.data }
  })

  app.post<{ Body: { uuid: string; data: string } }>('/auth/signin', async (request) => {
    const { uuid, data } = request.body
    const result = await signIn({ uuid, data })
    return result
  })

  app.get('/auth/status', async () => {
    const authenticated = hasToken()
    const ttl = getTokenTTL()
    return {
      authenticated,
      tokenExpiresAt: ttl ? new Date(ttl).toISOString() : null,
    }
  })
}
