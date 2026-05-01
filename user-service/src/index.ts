import { serve } from '@hono/node-server'
import app from './app.js'
import { config } from './lib/config.js'

serve({
  fetch: app.fetch,
  port: config.PORT,
})

console.log(`user-service listening on :${config.PORT}`)
