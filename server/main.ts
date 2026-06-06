import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'fs'
import app from './index.ts'

const PORT = parseInt(process.env.PORT ?? '3000')

app.use('/*', serveStatic({ root: './dist' }))

app.get('*', (c) => {
  const html = readFileSync('./dist/index.html', 'utf-8')
  return c.html(html)
})

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Server running on port ${info.port}`)
})
