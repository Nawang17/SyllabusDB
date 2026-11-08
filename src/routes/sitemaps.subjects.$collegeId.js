import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/sitemaps/subjects/$collegeId')({ server: { handlers: { GET: async ({ params }) => { const { safeSitemap, subjectsSitemap } = await import('../lib/sitemap.server'); return safeSitemap(() => subjectsSitemap(params.collegeId)) } } } })
