import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

const port = Number(process.env.PORT ?? 8000)

const serviceUrls = {
  'user-service': process.env.USER_SERVICE_URL ?? 'http://user-service:8001',
  'rental-service': process.env.RENTAL_SERVICE_URL ?? 'http://rental-service:8002',
  'analytics-service': process.env.ANALYTICS_SERVICE_URL ?? 'http://analytics-service:8003',
  'agentic-service': process.env.AGENTIC_SERVICE_URL ?? 'http://agentic-service:8004',
} as const

const routeTargets: Array<{ prefix: string; service: keyof typeof serviceUrls }> = [
  { prefix: '/users', service: 'user-service' },
  { prefix: '/rentals', service: 'rental-service' },
  { prefix: '/analytics', service: 'analytics-service' },
  { prefix: '/agentic', service: 'agentic-service' },
  { prefix: '/chat', service: 'agentic-service' },
  { prefix: '/sessions', service: 'agentic-service' },
]

app.use('*', cors())

async function fetchDownstreamStatus(baseUrl: string): Promise<'OK' | 'UNREACHABLE'> {
  try {
    const response = await fetch(`${baseUrl}/status`, { method: 'GET' })
    return response.ok ? 'OK' : 'UNREACHABLE'
  } catch {
    return 'UNREACHABLE'
  }
}

app.get('/status', async (c) => {
  const entries = Object.entries(serviceUrls) as Array<[keyof typeof serviceUrls, string]>

  const checks = await Promise.all(
    entries.map(async ([name, url]) => [name, await fetchDownstreamStatus(url)] as const)
  )

  const downstream = Object.fromEntries(checks)

  return c.json({
    service: 'api-gateway',
    status: 'OK',
    downstream,
  })
})

app.all('*', async (c) => {
  const path = c.req.path
  const target = routeTargets.find((route) => path === route.prefix || path.startsWith(`${route.prefix}/`))

  if (!target) {
    return c.json({ error: 'Not Found' }, 404)
  }

  const incomingUrl = new URL(c.req.url)
  const upstreamUrl = new URL(path + incomingUrl.search, serviceUrls[target.service])

  const headers = new Headers(c.req.raw.headers)
  headers.delete('host')
  headers.delete('connection')

  let body: ArrayBuffer | undefined
  if (!['GET', 'HEAD'].includes(c.req.method.toUpperCase())) {
    body = await c.req.raw.arrayBuffer()
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: c.req.method,
      headers,
      body,
    })

    const responseHeaders = new Headers(upstreamResponse.headers)
    responseHeaders.delete('transfer-encoding')

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream request failed'
    return c.json(
      {
        error: 'Bad Gateway',
        message,
      },
      502
    )
  }
})

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
})

console.log(`[api-gateway] running on :${port}`)
