import { listRecords, getCollege } from './public-data.server'
import { origin, collegePath, subjectPath, coursePath, syllabusPath } from './seo'
import { extractSubject } from '../utils/courseCode'
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;').replaceAll("'",'&apos;')
export function xml(paths, index = false) {
  if (paths.length > 50_000) throw new Error('Sitemap partition exceeded')
  const tag = index ? 'sitemapindex' : 'urlset'; const item = index ? 'sitemap' : 'url'
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><${tag} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<${item}><loc>${escape(origin + path)}</loc></${item}>`).join('')}</${tag}>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } })
}
export async function sitemapIndex() {
  const colleges = await listRecords([], 'colleges')
  const paths = ['/sitemaps/pages']
  // Sitemap indexes may only reference URL sets, never another sitemap index.
  for (let start = 0; start < colleges.length; start += 4) {
    const groups = await Promise.all(colleges.slice(start,start+4).map(async college => {
      const courses = await listRecords(['colleges',college.id], 'courses', [['approved','EQUAL',true]])
      return [`/sitemaps/subjects/${encodeURIComponent(college.id)}`, ...courses.map(course => `/sitemaps/syllabi/${encodeURIComponent(college.id)}/${encodeURIComponent(course.id)}`)]
    }))
    paths.push(...groups.flat())
  }
  return xml(paths, true)
}
export async function pagesSitemap() {
  const colleges = await listRecords([], 'colleges')
  return xml(['/', '/colleges','/aboutpage','/guidelines','/privacy-policy','/termsofservice','/takedown','/extension-privacy-policy', ...colleges.map(college => collegePath(college.id))])
}
export async function subjectsSitemap(id) {
  const college = await getCollege(id)
  if (!college || college.id !== id) return new Response('Not found', { status: 404 })
  const courses = await listRecords(['colleges',id], 'courses', [['approved','EQUAL',true]])
  const subjects = [...new Set(courses.map(course => extractSubject(course.code || course.id)).filter(Boolean))]
  return xml([...subjects.map(subject => subjectPath(id,subject)), ...courses.map(course => coursePath(id,extractSubject(course.code || course.id),course.id))])
}
export async function syllabiSitemap(id, courseId) {
  const college = await getCollege(id)
  if (!college || college.id !== id) return new Response('Not found', { status: 404 })
  const { getRecord } = await import('./public-data.server')
  const course = await getRecord(['colleges',id,'courses',courseId])
  if (course?.approved !== true) return new Response('Not found', { status: 404 })
  const syllabi = await listRecords(['colleges',id,'courses',courseId], 'syllabi', [['approved','EQUAL',true]])
  return xml(syllabi.map(syllabus => syllabusPath(id,extractSubject(course.code || course.id),course.id,syllabus.id)))
}
export async function safeSitemap(callback) {
  if (import.meta.env.VITE_NOINDEX === 'true') return new Response('Not available', { status: 404 })
  try { return await callback() } catch { return new Response('Temporarily unavailable', { status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } }) }
}
