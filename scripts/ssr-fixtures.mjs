// Test data only: installed as a fetch stub by verify-ssr, never imported by the app.
const fields = value => Object.fromEntries(Object.entries(value).map(([key,value]) => [key, typeof value === 'boolean' ? { booleanValue: value } : typeof value === 'number' ? { integerValue: String(value) } : Array.isArray(value) ? { arrayValue: { values: value.map(stringValue => ({ stringValue })) } } : { stringValue: value }]))
export function installFixtures() {
  const original = globalThis.fetch
  const documents = new Map([
    ['colleges/test-college', { name: 'Test College', city: 'New York', state: 'NY', aliases: ['test-alias'], approvedSyllabiTotal: 2 }],
    ['colleges/test-college/courses/CS-GY 9215', { code: 'CS-GY 9215', title: 'Distributed Systems', approved: true, approvedSyllabiCount: 2 }],
    ['colleges/test-college/courses/ART 101', { code: 'ART 101', title: 'Painting', approved: true, approvedSyllabiCount: 5 }],
    ['colleges/test-college/courses/ACCT 101', { code: 'ACCT 101', title: 'Accounting', approved: true, approvedSyllabiCount: 3 }],
    ['colleges/test-college/courses/2D 101', { code: '2D 101', title: 'Design', approved: true, approvedSyllabiCount: 1 }],
    ['colleges/test-college/courses/CS-GY 9215/syllabi/public', { approved: true, professor: 'Test Professor', term: 'Fall', year: 2025, pdf_url: 'https://example.com/test.pdf', rating: 4, experience_text: 'Review from a student.', owner: 'PRIVATE_OWNER', file_path: 'PRIVATE_STORAGE_PATH' }],
    ['colleges/test-college/courses/CS-GY 9215/syllabi/minimal', { approved: true }],
    ['colleges/test-college/courses/CS-GY 9215/syllabi/public/helpfulStats/total', { count:3 }],
    ['colleges/test-college/courses/CS-GY 9215/syllabi/minimal/helpfulStats/total', { count:1 }],
    ['colleges/test-college/courses/CS-GY 9215/syllabi/pending', { approved: false, professor: 'PRIVATE_PENDING' }],
    ['colleges/test-college/courses/legacy-code/syllabi/orphan', { approved: true, term: 'Spring' }],
  ])
  const calls = []
  for (let index = 0; index < 101; index++) documents.set(`colleges/pagination-${String(index).padStart(3,'0')}`, { name: `Pagination College ${index}`, approved: true })
  let fail = false
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url)
    if (url.hostname !== 'firestore.googleapis.com') return original(input,init)
    calls.push({ url: url.pathname, body: init?.body })
    if (fail) return Response.json({ error: {} }, { status: 503 })
    const start = url.pathname.indexOf('/documents')
    const base = decodeURIComponent(url.pathname.slice(0,start+10))
    const raw = decodeURIComponent(url.pathname.slice(start+10)).replace(/^\//,'')
    const toDoc = ([key,value]) => ({ name: base.slice(4) + '/' + key, fields: fields(value) })
    if (!raw.endsWith(':runQuery') && raw !== ':runQuery') {
      const value = documents.get(raw)
      return value ? Response.json(toDoc([raw,value])) : Response.json({}, { status: 404 })
    }
    const query = JSON.parse(init.body).structuredQuery
    const parent = raw.replace(':runQuery','')
    const prefix = `${parent ? parent+'/' : ''}${query.from[0].collectionId}/`
    let matches = [...documents.entries()].filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes('/'))
    const filter = query.where?.fieldFilter
    if (filter) matches = matches.filter(([,value]) => {
      const expected = filter.value.booleanValue ?? filter.value.stringValue
      return filter.op === 'ARRAY_CONTAINS' ? value[filter.field.fieldPath]?.includes(expected) : value[filter.field.fieldPath] === expected
    })
    matches.sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0)
    if (query.startAt) matches = matches.filter(entry => toDoc(entry).name > query.startAt.values[0].referenceValue)
    return Response.json(matches.slice(0,query.limit).map(entry => ({ document: toDoc(entry) })))
  }
  return { calls, setFail: value => { fail = value }, restore: () => { globalThis.fetch = original } }
}
