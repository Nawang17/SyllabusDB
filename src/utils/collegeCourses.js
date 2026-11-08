import { courseCodeMatches, normalizeCourseCode } from './courseCode.js'

export function courseInitial(course) {
  const first = normalizeCourseCode(course.code || course.id).charAt(0)
  return /^[A-Z]$/.test(first) ? first : '#'
}

export function syllabusCount(course) {
  const count = Number(course.approvedSyllabiCount)
  return Number.isFinite(count) && count > 0 ? count : 0
}

export function browseCollegeCourses(courses, { search = '', letter = '', sort = 'popular' } = {}) {
  const query = search.trim()
  return courses.filter(course => (
    (!letter || courseInitial(course) === letter) &&
    (courseCodeMatches(course.code || course.id, query) ||
      String(course.title || course.name || '').toLowerCase().includes(query.toLowerCase()))
  )).sort((a, b) => {
    const popularity = sort === 'popular' ? syllabusCount(b) - syllabusCount(a) : 0
    return popularity || normalizeCourseCode(a.code || a.id).localeCompare(
      normalizeCourseCode(b.code || b.id), 'en', { numeric: true },
    ) || a.id.localeCompare(b.id, 'en')
  })
}
