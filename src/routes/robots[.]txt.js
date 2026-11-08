import { createFileRoute } from '@tanstack/react-router'
import { origin } from '../lib/seo'
export const Route = createFileRoute('/robots.txt')({ server: { handlers: { GET: () => new Response(import.meta.env.VITE_NOINDEX === 'true' ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /signin\nDisallow: /myuploads\nDisallow: /settings\nDisallow: /uploadSyllabus\nDisallow: /uploadsyllabus\nDisallow: /requestcollege\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }) } } })
