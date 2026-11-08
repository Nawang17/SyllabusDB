import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/sitemap.xml')({ server: { handlers: { GET: async () => { const { safeSitemap, sitemapIndex } = await import('../lib/sitemap.server'); return safeSitemap(sitemapIndex) } } } })
