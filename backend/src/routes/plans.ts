import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import type { FastifyInstance } from 'fastify'

const PLANS_DIR = resolve(import.meta.dirname || __dirname, '../../plans')

export async function plansRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/plans', async () => {
    const files = await readdir(PLANS_DIR)
    const mdFiles: { name: string; path: string; size: number }[] = []

    for (const file of files) {
      if (extname(file) !== '.md') continue
      const fullPath = resolve(PLANS_DIR, file)
      const stats = await stat(fullPath)
      mdFiles.push({ name: file, path: file, size: stats.size })
    }

    mdFiles.sort((a, b) => b.name.localeCompare(a.name))
    return mdFiles
  })

  app.get<{ Params: { filename: string } }>('/api/plans/:filename', async (request, reply) => {
    const { filename } = request.params

    if (extname(filename) !== '.md' || filename.includes('..') || filename.includes('/')) {
      return reply.status(400).send({ error: 'Invalid filename' })
    }

    const fullPath = resolve(PLANS_DIR, filename)

    try {
      await stat(fullPath)
    } catch {
      return reply.status(404).send({ error: 'File not found' })
    }

    const content = await readFile(fullPath, 'utf-8')
    return { name: filename, content }
  })
}
