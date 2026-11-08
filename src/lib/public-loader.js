import { createServerFn } from '@tanstack/react-start'
export const getPublicPage = createServerFn({ method: 'GET' }).validator(data => {
  if (!data || typeof data.collegeId !== 'string') throw new Error('Invalid college')
  const result = {}
  for (const key of ['collegeId','subject','courseId','syllabusId']) {
    if (data[key] != null) {
      if (typeof data[key] !== 'string' || data[key].length > 300 || (key !== 'subject' && data[key].includes('/')) || data[key].includes(String.fromCharCode(0))) throw new Error('Invalid route')
      result[key] = data[key]
    }
  }
  return result
}).handler(async ({ data }) => {
  const { loadPublic } = await import('./public-data.server.js')
  return loadPublic(data)
})
export const getPublicColleges = createServerFn({ method: 'GET' }).handler(async () => {
  const { listRecords } = await import('./public-data.server.js')
  return listRecords([], 'colleges')
})

export const getHelpfulCount = createServerFn({ method:'GET' }).validator(data => {
  const result = {}
  for (const key of ['collegeId','courseId','syllabusId']) {
    if (!data || typeof data[key] !== 'string' || !data[key] || data[key].length > 300 || data[key].includes('/') || data[key].includes(String.fromCharCode(0))) throw new Error('Invalid syllabus')
    result[key] = data[key]
  }
  return result
}).handler(async ({ data }) => {
  try {
    const { getRecord } = await import('./public-data.server.js')
    const stats = await getRecord(['colleges',data.collegeId,'courses',data.courseId,'syllabi',data.syllabusId,'helpfulStats','total'])
    return Number.isSafeInteger(stats?.count) && stats.count >= 0 ? stats.count : null
  } catch {
    // This optional public count must not make the syllabus list unavailable.
    return null
  }
})
