import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { config } from './config.js'
import { authRoutes } from './routes/auth.js'
import { cisesRoutes } from './routes/cises.js'
import { updRoutes } from './routes/upd.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(multipart)

await app.register(authRoutes)
await app.register(cisesRoutes)
await app.register(updRoutes)

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

try {
  await app.listen({ port: config.port, host: config.host })
  console.log(`Server running on http://${config.host}:${config.port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
