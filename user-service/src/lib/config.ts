import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  CENTRAL_API_URL: z.string().url(),
  CENTRAL_API_TOKEN: z.string().min(1),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  const errors = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
  throw new Error(`Invalid environment configuration: ${errors}`)
}

export const config = parsed.data
