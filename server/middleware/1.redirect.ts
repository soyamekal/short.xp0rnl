import type { LinkSchema } from '@/schemas/link'
import type { z } from 'zod'
import { parsePath, withQuery } from 'ufo'

export default eventHandler(async (event) => {
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, ''))
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const { homeURL, linkCacheTtl, redirectWithQuery, caseSensitive } = useRuntimeConfig(event)
  const { cloudflare } = event.context

  if (event.path === '/' && homeURL)
    return sendRedirect(event, homeURL)

  if (slug && !reserveSlug.includes(slug) && slugRegex.test(slug) && cloudflare) {
    const { KV } = cloudflare.env

    let link: z.infer<typeof LinkSchema> | null = null

    const getLink = async (key: string) =>
      await KV.get(`link:${key}`, { type: 'json', cacheTtl: linkCacheTtl })

    const lowerCaseSlug = slug.toLowerCase()

    link = await getLink(caseSensitive ? slug : lowerCaseSlug)

    if (!caseSensitive && !link && lowerCaseSlug !== slug) {
      console.log('original slug fallback:', `slug:${slug} lowerCaseSlug:${lowerCaseSlug}`)
      link = await getLink(slug)
    }

    if (link) {
      event.context.link = link

      try {
        await useAccessLog(event)
      }
      catch (error) {
        console.error('Failed write access log:', error)
      }

      const target = redirectWithQuery
        ? withQuery(link.url, getQuery(event))
        : link.url

      return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<title>${link.title || 'Visit Website'}</title>

<meta property="og:title" content="${link.title || ''}">
<meta property="og:description" content="${link.description || ''}">
<meta property="og:image" content="${link.image || ''}">
<meta property="og:type" content="website">
<meta property="og:url" content="${event.node.req.url}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${link.title || ''}">
<meta name="twitter:description" content="${link.description || ''}">
<meta name="twitter:image" content="${link.image || ''}">

<meta http-equiv="refresh" content="3;url=${target}">

</head>

<body>
Redirecting...
</body>

</html>
`
    }
  }
})
