import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import statusRouter from './routes/status.js'
import usersRouter from './routes/users.js'

const app = new Hono()

app.use('*', logger())

app.route('/status', statusRouter)
app.route('/users', usersRouter)

app.notFound((c) => c.json({ error: 'Not Found' }, 404))

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }

  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
