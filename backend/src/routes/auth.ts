import type { FastifyInstance } from 'fastify'
import type { TrueApiEnv } from '../config.js'
import { getAuthKey, signIn, clearToken, getAuthStatus, setTokenDirect } from '../services/auth-service.js'
import { AppError, extractDebugInfo } from '../services/cises-service.js'

const VALID_ENVS = ['sandbox', 'prod']

function parseEnv(query: Record<string, string>): TrueApiEnv {
  const env = query.env
  if (env && VALID_ENVS.includes(env)) return env as TrueApiEnv
  return 'sandbox'
}

const signInSchema = {
  body: {
    type: 'object',
    required: ['uuid', 'data'],
    properties: {
      uuid: { type: 'string' },
      data: { type: 'string' },
      inn: { type: 'string' },
    },
  },
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get('/auth/key', async (request, reply) => {
    const env = parseEnv(request.query as Record<string, string>)
    try {
      const authKey = await getAuthKey(env)
      return { uuid: authKey.uuid, data: authKey.data }
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({
          error: err.message,
          debugInfo: err.debugInfo,
        })
      }
      const debugInfo = extractDebugInfo(err)
      return reply.status(502).send({
        error: 'Failed to get auth key from True API',
        debugInfo,
      })
    }
  })

  app.post<{ Body: { uuid: string; data: string; inn?: string } }>('/auth/simpleSignIn', { schema: signInSchema }, async (request, reply) => {
    const env = parseEnv(request.query as Record<string, string>)
    try {
      const { uuid, data, inn } = request.body
      const result = await signIn(env, { uuid, data, inn })
      request.log.info({ env, token: result.token }, 'auth: token received')
      return result
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({
          error: err.message,
          debugInfo: err.debugInfo,
        })
      }
      const debugInfo = extractDebugInfo(err)
      return reply.status(502).send({
        error: 'Failed to sign in to True API',
        debugInfo,
      })
    }
  })

  app.get('/auth/status', async (request) => {
    const env = parseEnv(request.query as Record<string, string>)
    return getAuthStatus(env)
  })

  app.post('/auth/logout', async (request) => {
    const env = parseEnv(request.query as Record<string, string>)
    clearToken(env)
    return { success: true }
  })

  app.post<{ Body: { token: string } }>('/auth/setToken', async (request) => {
    const env = parseEnv(request.query as Record<string, string>)
    setTokenDirect(env, request.body.token)
    request.log.info({ env, tokenPrefix: request.body.token.slice(0, 20) + '...' }, 'auth: token set manually')
    return { success: true }
  })
}
