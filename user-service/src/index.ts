import { serve } from '@hono/node-server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import app from './app.js'
import { config } from './lib/config.js'

const { Client } = pg

async function runStartupMigration() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const migrationPath = path.resolve(currentDir, '../drizzle/0000_mean_the_call.sql')
  const sql = await readFile(migrationPath, 'utf8')
  const statements = sql
    .split('--> statement-breakpoint')
    .map((part) => part.trim())
    .filter(Boolean)

  const client = new Client({ connectionString: config.DATABASE_URL })
  await client.connect()
  try {
    for (const statement of statements) {
      await client.query(statement)
    }
  } finally {
    await client.end()
  }
}

await runStartupMigration()

serve({
  fetch: app.fetch,
  port: config.PORT,
})

console.log(`user-service listening on :${config.PORT}`)
