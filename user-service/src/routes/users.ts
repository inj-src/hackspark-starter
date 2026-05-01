import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { jwt, type JwtVariables } from 'hono/jwt'
import { and, eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../lib/db.js'
import { users } from '../db/schema.js'
import { createAccessToken } from '../lib/jwt.js'
import { config } from '../lib/config.js'
import {
  CentralApiError,
  CentralApiNotFoundError,
  discountFromSecurityScore,
  getCentralUserSecurityScore,
} from '../lib/central-api.js'

type Variables = JwtVariables

const usersRouter = new Hono<{ Variables: Variables }>()

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
})

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

usersRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const payload = c.req.valid('json')
  const email = payload.email.toLowerCase().trim()
  const passwordHash = await bcrypt.hash(payload.password, 10)

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)

  if (existing.length > 0) {
    throw new HTTPException(409, { message: 'Email already registered' })
  }

  const inserted = await db
    .insert(users)
    .values({
      name: payload.name,
      email,
      passwordHash,
    })
    .returning({ id: users.id, name: users.name, email: users.email })

  const user = inserted[0]
  const token = await createAccessToken({ userId: user.id, email: user.email, name: user.name })

  return c.json({ token, user }, 201)
})

usersRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const payload = c.req.valid('json')
  const email = payload.email.toLowerCase().trim()

  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (rows.length === 0) {
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  const user = rows[0]
  const ok = await bcrypt.compare(payload.password, user.passwordHash)

  if (!ok) {
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  const token = await createAccessToken({ userId: user.id, email: user.email, name: user.name })

  return c.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  })
})

usersRouter.use('/me', jwt({ secret: config.JWT_SECRET, alg: 'HS256' }))

usersRouter.get('/me', async (c) => {
  const payload = c.get('jwtPayload') as {
    sub?: string
    email?: string
    name?: string
    exp?: number
  }

  if (!payload.sub || !payload.email || !payload.name) {
    throw new HTTPException(401, { message: 'Invalid token payload' })
  }

  const userId = Number(payload.sub)

  const found = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.email, payload.email)))
    .limit(1)

  if (found.length === 0) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  return c.json({ user: found[0] })
})

usersRouter.get('/:id/discount', zValidator('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param')

  try {
    const securityScore = await getCentralUserSecurityScore(id)
    const discountPercent = discountFromSecurityScore(securityScore)

    return c.json({
      userId: id,
      securityScore,
      discountPercent,
    })
  } catch (error) {
    if (error instanceof CentralApiNotFoundError) {
      throw new HTTPException(404, { message: 'User not found' })
    }

    if (error instanceof CentralApiError) {
      throw new HTTPException(502, {
        message: `Central API error (${error.status})`,
      })
    }

    throw error
  }
})

export default usersRouter
