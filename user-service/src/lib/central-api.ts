import { config } from './config.js'

export class CentralApiNotFoundError extends Error {}
export class CentralApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000
const responseCache = new Map<string, { expiresAt: number; data: unknown }>()
const inFlight = new Map<string, Promise<unknown>>()

const readCache = <T>(key: string): T | null => {
  const now = Date.now()
  for (const [k, v] of responseCache.entries()) {
    if (v.expiresAt <= now) responseCache.delete(k)
  }
  const hit = responseCache.get(key)
  if (!hit) return null
  return hit.data as T
}

const writeCache = <T>(key: string, data: T): void => {
  responseCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data })
}

const fetchCentralJson = async <T>(endpoint: string): Promise<T> => {
  const cacheKey = `GET:${endpoint}`
  const cacheHit = readCache<T>(cacheKey)
  if (cacheHit !== null) return cacheHit

  const pending = inFlight.get(cacheKey)
  if (pending) return (await pending) as T

  const task = (async () => {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${config.CENTRAL_API_TOKEN}`,
      },
    })

    if (response.status === 404) {
      throw new CentralApiNotFoundError('User not found in Central API')
    }

    if (!response.ok) {
      throw new CentralApiError('Failed to fetch user from Central API', response.status)
    }

    const data = (await response.json()) as T
    writeCache(cacheKey, data)
    return data
  })().finally(() => {
    inFlight.delete(cacheKey)
  })

  inFlight.set(cacheKey, task)
  return (await task) as T
}

export const getCentralUserSecurityScore = async (userId: number): Promise<number> => {
  const endpoint = `${config.CENTRAL_API_URL}/api/data/users/${userId}`
  const data = await fetchCentralJson<{ securityScore?: number }>(endpoint)

  if (typeof data.securityScore !== 'number') {
    throw new CentralApiError('Central API response missing securityScore', 502)
  }

  return data.securityScore
}

export const discountFromSecurityScore = (securityScore: number): number => {
  if (securityScore >= 80) return 20
  if (securityScore >= 60) return 15
  if (securityScore >= 40) return 10
  if (securityScore >= 20) return 5
  return 0
}
