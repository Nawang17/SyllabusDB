import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/sitemaps/pages')({ server: { handlers: { GET: async () => { const { safeSitemap, pagesSitemap } = await import('../lib/sitemap.server'); return safeSitemap(pagesSitemap) } } } })
