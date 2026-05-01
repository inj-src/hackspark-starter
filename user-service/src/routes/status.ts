import { Hono } from 'hono'

const statusRouter = new Hono()

statusRouter.get('/', (c) => {
  return c.json({ service: 'user-service', status: 'OK' })
})

export default statusRouter
