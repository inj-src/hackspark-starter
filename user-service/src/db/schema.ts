import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex('users_email_unique_idx').on(table.email),
  })
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
