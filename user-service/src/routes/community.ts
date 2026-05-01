import { type Context, Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { jwt, type JwtVariables } from 'hono/jwt'
import { config } from '../lib/config.js'

type Variables = JwtVariables

type CommunityPost = {
  id: string
  authorId: number
  authorName: string
  body: string
  createdAt: string
  likes: number
  likedBy: number[]
}

const createPostSchema = z.object({
  body: z.string().trim().min(1).max(500),
})

const postIdParamSchema = z.object({
  id: z.string().trim().min(1),
})

const communityRouter = new Hono<{ Variables: Variables }>()

const posts: CommunityPost[] = []

function parseUserFromJwt(c: Context<{ Variables: Variables }>) {
  const payload = c.get('jwtPayload') as {
    sub?: string
    name?: string
  }

  const userId = Number(payload.sub)
  if (!payload.sub || Number.isNaN(userId) || !payload.name) {
    throw new HTTPException(401, { message: 'Invalid token payload' })
  }

  return {
    id: userId,
    name: payload.name,
  }
}

const listPostsHandler = (c: Context<{ Variables: Variables }>) => {
  const feed = posts
    .map((post) => ({
      id: post.id,
      authorId: post.authorId,
      authorName: post.authorName,
      body: post.body,
      createdAt: post.createdAt,
      likes: post.likes,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return c.json({ posts: feed })
}

communityRouter.get('/posts', listPostsHandler)
communityRouter.get('/', listPostsHandler)

communityRouter.use('/posts', jwt({ secret: config.JWT_SECRET, alg: 'HS256' }))
communityRouter.use('/posts/*', jwt({ secret: config.JWT_SECRET, alg: 'HS256' }))
communityRouter.use('/', jwt({ secret: config.JWT_SECRET, alg: 'HS256' }))
communityRouter.use('/*', jwt({ secret: config.JWT_SECRET, alg: 'HS256' }))

communityRouter.post('/posts', zValidator('json', createPostSchema), (c) => {
  const user = parseUserFromJwt(c)
  const payload = c.req.valid('json')

  const post: CommunityPost = {
    id: crypto.randomUUID(),
    authorId: user.id,
    authorName: user.name,
    body: payload.body,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedBy: [],
  }

  posts.unshift(post)

  return c.json(
    {
      post: {
        id: post.id,
        authorId: post.authorId,
        authorName: post.authorName,
        body: post.body,
        createdAt: post.createdAt,
        likes: post.likes,
      },
    },
    201
  )
})

communityRouter.post('/', zValidator('json', createPostSchema), (c) => {
  const user = parseUserFromJwt(c)
  const payload = c.req.valid('json')

  const post: CommunityPost = {
    id: crypto.randomUUID(),
    authorId: user.id,
    authorName: user.name,
    body: payload.body,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedBy: [],
  }

  posts.unshift(post)

  return c.json(
    {
      post: {
        id: post.id,
        authorId: post.authorId,
        authorName: post.authorName,
        body: post.body,
        createdAt: post.createdAt,
        likes: post.likes,
      },
    },
    201
  )
})

communityRouter.post('/posts/:id/like', zValidator('param', postIdParamSchema), (c) => {
  const user = parseUserFromJwt(c)
  const { id } = c.req.valid('param')
  const post = posts.find((entry) => entry.id === id)

  if (!post) {
    throw new HTTPException(404, { message: 'Post not found' })
  }

  if (!post.likedBy.includes(user.id)) {
    post.likedBy.push(user.id)
    post.likes += 1
  }

  return c.json({
    post: {
      id: post.id,
      likes: post.likes,
    },
  })
})

communityRouter.post('/:id/like', zValidator('param', postIdParamSchema), (c) => {
  const user = parseUserFromJwt(c)
  const { id } = c.req.valid('param')
  const post = posts.find((entry) => entry.id === id)

  if (!post) {
    throw new HTTPException(404, { message: 'Post not found' })
  }

  if (!post.likedBy.includes(user.id)) {
    post.likedBy.push(user.id)
    post.likes += 1
  }

  return c.json({
    post: {
      id: post.id,
      likes: post.likes,
    },
  })
})

communityRouter.post('/posts/:id/unlike', zValidator('param', postIdParamSchema), (c) => {
  const user = parseUserFromJwt(c)
  const { id } = c.req.valid('param')
  const post = posts.find((entry) => entry.id === id)

  if (!post) {
    throw new HTTPException(404, { message: 'Post not found' })
  }

  if (post.likedBy.includes(user.id)) {
    post.likedBy = post.likedBy.filter((userId) => userId !== user.id)
    post.likes = Math.max(0, post.likes - 1)
  }

  return c.json({
    post: {
      id: post.id,
      likes: post.likes,
    },
  })
})

communityRouter.post('/:id/unlike', zValidator('param', postIdParamSchema), (c) => {
  const user = parseUserFromJwt(c)
  const { id } = c.req.valid('param')
  const post = posts.find((entry) => entry.id === id)

  if (!post) {
    throw new HTTPException(404, { message: 'Post not found' })
  }

  if (post.likedBy.includes(user.id)) {
    post.likedBy = post.likedBy.filter((userId) => userId !== user.id)
    post.likes = Math.max(0, post.likes - 1)
  }

  return c.json({
    post: {
      id: post.id,
      likes: post.likes,
    },
  })
})

export default communityRouter
