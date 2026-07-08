import type { FastifyInstance } from 'fastify'
import { getAuthKey, signIn, clearToken, isAuthenticated } from '../services/auth-service.js'
import { getTokenTTL } from '../services/token-cache.js'

const signInSchema = {
  body: {
    type: 'object',
    required: ['uuid', 'data'],
    properties: {
      uuid: { type: 'string' },
      data: { type: 'string' },
    },
  },
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get('/auth/key', async () => {
    const authKey = await getAuthKey()
    return { uuid: authKey.uuid, data: authKey.data }
  })

  app.post<{ Body: { uuid: string; data: string } }>('/auth/simpleSignIn', { schema: signInSchema }, async (request) => {
    const { uuid, data } = request.body
    const result = await signIn({ uuid, data })
    return result
  })

  app.get('/auth/status', async () => {
    const authenticated = isAuthenticated()
    const ttl = getTokenTTL()
    return {
      authenticated,
      tokenExpiresAt: ttl ? new Date(ttl).toISOString() : null,
    }
  })

  app.post('/auth/logout', async () => {
    clearToken()
    return { success: true }
  })
}
