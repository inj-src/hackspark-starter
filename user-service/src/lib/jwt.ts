import { sign } from 'hono/jwt'
import { config } from './config.js'

type JwtClaims = {
  sub: string
  email: string
  name: string
  exp: number
}

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60

export const createAccessToken = async (payload: {
  userId: number
  email: string
  name: string
}): Promise<string> => {
  const now = Math.floor(Date.now() / 1000)
  const claims: JwtClaims = {
    sub: String(payload.userId),
    email: payload.email,
    name: payload.name,
    exp: now + SEVEN_DAYS_SECONDS,
  }

  return sign(claims, config.JWT_SECRET, 'HS256')
}
