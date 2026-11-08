import { extractSubject, normalizeCourseCode } from '../utils/courseCode.js'
import defaultShareImage from '../assets/college_illustration.jpg'
export const origin = (import.meta.env.VITE_SITE_ORIGIN || 'https://syllabusdb.com').replace(/\/$/, '')
export const collegePath = id => `/college/${encodeURIComponent(id)}`
export const subjectPath = (id, subject) => `${collegePath(id)}/subject/${encodeURIComponent(subject)}`
export const coursePath = (id, subject, course) => `${subjectPath(id, subject)}/course/${encodeURIComponent(course)}`
export const syllabusPath = (id, subject, course, syllabus) => `${coursePath(id, subject, course)}/syllabus/${encodeURIComponent(syllabus)}`
export function canonicalPath(data, params) {
  const { college, course, syllabus } = data
  const subject = course?.code ? extractSubject(course.code) : (params.subject || '').toUpperCase()
  if (syllabus) return syllabusPath(college.id, subject, params.courseId, syllabus.id)
  if (course) return coursePath(college.id, subject, course.id)
  if (params.subject) return subjectPath(college.id, params.subject.toUpperCase())
  return collegePath(college.id)
}
export function seo(title, description, path, noindex = false, image = `${origin}${defaultShareImage}`) {
  const url = `${origin}${path}`
  return { meta: [{ title: `${title} | SyllabusDB` }, { name: 'description', content: description }, { name: 'robots', content: noindex || import.meta.env.VITE_NOINDEX === 'true' ? 'noindex, follow' : 'index, follow' }, { property: 'og:title', content: `${title} | SyllabusDB` }, { property: 'og:description', content: description }, { property: 'og:url', content: url }, { property: 'og:type', content: 'website' }, { property: 'og:image', content: image }, { name: 'twitter:card', content: 'summary_large_image' }, { name: 'twitter:title', content: title }, { name: 'twitter:description', content: description }, { name: 'twitter:image', content: image }], links: [{ rel: 'canonical', href: url }] }
}
export function publicHead(data, params) {
  if (!data) return seo('Page unavailable', 'Please try again.', '/', true)
  const code = data.course ? normalizeCourseCode(data.course.code || data.course.id) : params.subject?.toUpperCase()
  const title = [code, data.course?.title || data.course?.name, data.syllabus ? [data.syllabus.professor, data.syllabus.term, data.syllabus.year].filter(Boolean).join(' · ') : '', data.college.name || data.college.id, data.syllabus ? 'Syllabus' : 'Syllabi'].filter(Boolean).join(' · ')
  const collegeImage = data.college.image_url || `${origin}${defaultShareImage}`
  return seo(title, `Browse ${title}. Read student-shared syllabi and plan your classes.`, canonicalPath(data, params), data.hasSearch, collegeImage)
}
