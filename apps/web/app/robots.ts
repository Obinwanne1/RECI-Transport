import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL?.replace('localhost:3002', 'web-lilac-nine-19.vercel.app') ?? 'https://web-lilac-nine-19.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account/', '/book/', '/api/', '/admin/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
