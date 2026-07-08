import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FastifyInstance } from 'fastify'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const PLANS_DIR = resolve(__dirname, '../../plans')

export async function plansRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/plans', async () => {
    let files: string[]
    try {
      files = await readdir(PLANS_DIR)
    } catch {
      return []
    }

    const mdFiles: { name: string; path: string; size: number }[] = []

    for (const file of files) {
      if (extname(file) !== '.md') continue
      const fullPath = resolve(PLANS_DIR, file)
      try {
        const stats = await stat(fullPath)
        mdFiles.push({ name: file, path: file, size: stats.size })
      } catch {
        // skip files that can't be stat'd
      }
    }

    mdFiles.sort((a, b) => b.name.localeCompare(a.name))
    return mdFiles
  })

  app.get<{ Params: { filename: string } }>('/api/plans/:filename', async (request, reply) => {
    const { filename } = request.params

    if (extname(filename) !== '.md' || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return reply.status(400).send({ error: 'Invalid filename' })
    }

    const fullPath = resolve(PLANS_DIR, filename)

    try {
      const content = await readFile(fullPath, 'utf-8')
      return { name: filename, content }
    } catch {
      return reply.status(404).send({ error: 'File not found' })
    }
  })
}
