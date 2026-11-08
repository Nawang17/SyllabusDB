// No Admin SDK, auth cookies, or service account: all requests obey anonymous Firestore rules.
import { extractSubject, normalizeCourseCode } from '../utils/courseCode.js'
const fields = {
  colleges: ['name','nickname','city','state','image_url','slug','aliases','approved','approvedSyllabiTotal'],
  courses: ['code','title','name','approved','approvedSyllabiCount'],
  syllabi: ['professor','term','year','pdf_url','approved','rating','experience_text','title'],
  helpfulStats: ['count'],
}
const cache = new Map()
export class PublicDataError extends Error { constructor() { super('Public data is temporarily unavailable. Please try again.'); this.name = 'PublicDataError' } }
function decode(value) {
  if ('stringValue' in value) return value.stringValue
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode)
  return null
}
export function publicRecord(document, type) {
  if (!document?.name) return null
  const record = { id: document.name.split('/').at(-1) }
  for (const key of fields[type]) if (document.fields?.[key]) record[key] = decode(document.fields[key])
  return record
}
function config() {
  const project = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const key = import.meta.env.VITE_FIREBASE_API_KEY
  if (!project || !key) throw new PublicDataError()
  return { base: `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents`, key }
}
async function request(path, body) {
  const { base, key } = config()
  let response
  try {
    response = await fetch(`${base}${path}?key=${encodeURIComponent(key)}`, {
      method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12_000),
    })
  } catch { throw new PublicDataError() }
  if (response.status === 404 && !body) return null
  if (!response.ok) throw new PublicDataError()
  return response.json()
}
const encodePath = segments => segments.map(encodeURIComponent).join('/')
export async function getRecord(segments) { return publicRecord(await request(`/${encodePath(segments)}`), segments.at(-2)) }
async function queryBatch(parent, type, filters, after) {
  const conditions = filters.map(([fieldPath, op, value]) => ({ fieldFilter: { field: { fieldPath }, op, value: typeof value === 'boolean' ? { booleanValue: value } : { stringValue: value } } }))
  const result = await request(`${parent.length ? `/${encodePath(parent)}` : ''}:runQuery`, { structuredQuery: {
    from: [{ collectionId: type }], limit: 100,
    ...(conditions.length ? { where: conditions.length === 1 ? conditions[0] : { compositeFilter: { op: 'AND', filters: conditions } } } : {}),
    orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
    ...(after ? { startAt: { values: [{ referenceValue: after }], before: false } } : {}),
  } })
  return result.filter(row => row.document).map(row => row.document)
}
export async function listRecords(parent, type, filters = []) {
  const key = JSON.stringify([parent, type, filters])
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) return cached.value
  const all = []; let after
  // Bounded requests, with a protective total ceiling rather than silently truncating data.
  do {
    const batch = await queryBatch(parent, type, filters, after)
    all.push(...batch.map(document => publicRecord(document, type)))
    if (batch.length < 100) break
    if (all.length >= 10_000) throw new PublicDataError()
    after = batch.at(-1).name
  } while (after)
  const value = all.filter(record => type === 'colleges' ? record.approved !== false : record.approved === true)
  if (cache.size > 500) cache.clear()
  cache.set(key, { value, expires: Date.now() + 60_000 })
  return value
}
export async function getCollege(id) {
  let college = await getRecord(['colleges', id])
  if (!college) {
    for (const [field, op] of [['slug','EQUAL'], ['aliases','ARRAY_CONTAINS']]) {
      const matches = await queryBatch([], 'colleges', [[field, op, id]])
      college = matches.map(item => publicRecord(item, 'colleges')).find(item => item.approved !== false)
      if (college) break
    }
  }
  return college?.approved !== false ? college : null
}
export async function loadPublic(params) {
  const college = await getCollege(params.collegeId)
  if (!college) return null
  const base = ['colleges', college.id]
  if (params.syllabusId) {
    const syllabus = await getRecord([...base, 'courses', params.courseId, 'syllabi', params.syllabusId])
    if (!syllabus || syllabus.approved !== true) return null
    // Optional parent metadata must not make a public syllabus inaccessible.
    const course = await getRecord([...base, 'courses', params.courseId])
    return { college, course: course?.approved === true ? course : { id: params.courseId }, syllabus }
  }
  if (params.courseId) {
    const course = await getRecord([...base, 'courses', params.courseId])
    if (course?.approved !== true) return null
    const syllabi = await listRecords([...base, 'courses', course.id], 'syllabi', [['approved','EQUAL',true]])
    return { college, course, syllabi }
  }
  const courses = await listRecords(base, 'courses', [['approved','EQUAL',true]])
  const subjects = [...new Set(courses.map(course => extractSubject(course.code || course.id)).filter(Boolean))].sort()
  if (params.subject && !subjects.includes(params.subject.toUpperCase())) return null
  return { college, subjects, courses: courses.filter(course => !params.subject || extractSubject(course.code || course.id) === params.subject.toUpperCase()).sort((a,b) => normalizeCourseCode(a.code || a.id).localeCompare(normalizeCourseCode(b.code || b.id), undefined, { numeric: true })) }
}
