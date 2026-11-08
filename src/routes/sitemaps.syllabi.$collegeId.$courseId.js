import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/sitemaps/syllabi/$collegeId/$courseId')({ server: { handlers: { GET: async ({ params }) => { const { safeSitemap, syllabiSitemap } = await import('../lib/sitemap.server'); return safeSitemap(() => syllabiSitemap(params.collegeId, params.courseId)) } } } })
