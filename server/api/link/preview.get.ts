import type { LinkSchema } from '@/schemas/link'
import type { z } from 'zod'

export default eventHandler(async (event) => {
  const { cloudflare } = event.context

  if (!cloudflare) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cloudflare environment not found',
    })
  }

  const { slug } = getQuery(event)

  if (!slug || typeof slug !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing slug',
    })
  }

  const { KV } = cloudflare.env

  const link = await KV.get<z.infer<typeof LinkSchema>>(
    `link:${slug.toLowerCase()}`,
    {
      type: 'json',
    },
  )

  if (!link) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Link not found',
    })
  }

  return link
})
