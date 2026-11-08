import assert from 'node:assert/strict'
import { installFixtures } from './ssr-fixtures.mjs'
const fixture = process.argv.includes('--live') ? null : installFixtures()
const { default: app } = await import('../dist/server/server.js')
const request = path => app.fetch(new Request(`http://localhost${path}`))
if (!fixture) {
  for (const path of process.argv.slice(2).filter(arg => arg !== '--live')) {
    const response = await request(path)
    const html = await response.text()
    console.log(JSON.stringify({ path, status: response.status, headings: [...html.matchAll(/<h[12][^>]*>(.*?)<\/h[12]>/g)].map(match => match[1].replaceAll(/<[^>]+>/g,'')), canonical: html.match(/rel="canonical"[^>]+/)?.[0], publicLinks: [...new Set([...html.matchAll(/href="(\/college\/[^"?]+)"/g)].map(match => match[1]))].slice(0,4), usefulHTML: html.includes('cp-subject') || html.includes('svp-heading') }))
    const pdf = html.match(/<iframe[^>]+src="([^"]+)"/)
    if (pdf) {
      const result = await fetch(pdf[1].replaceAll('&amp;','&'), { method: 'HEAD', signal: AbortSignal.timeout(12_000) })
      console.log(JSON.stringify({ pdfDeliveryStatus: result.status, pdfContentType: result.headers.get('content-type') }))
    }
  }
} else {
  const base = '/college/test-college/subject/CS-GY/course/CS-GY%209215'
  for (const [path,text] of [['/','Test College'],['/colleges','Test College'],['/college/test-college','CS-GY'],['/college/test-college/subject/CS-GY','Distributed Systems'],[base,'Test Professor'],[`${base}/syllabus/public`,'Test Professor'],[`${base}/syllabus/minimal`,'PDF unavailable']]) {
    const response = await request(path)
    const html = await response.text()
    assert.equal(response.status,200,path)
    const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'')
    assert.ok(visible.includes(text), `Useful server HTML: ${path}`)
    assert.match(html,/<title>[^<]+SyllabusDB<\/title>/)
    assert.match(html,/rel="canonical"/)
    assert.ok(!html.includes('PRIVATE_OWNER') && !html.includes('PRIVATE_STORAGE_PATH') && !html.includes('PRIVATE_PENDING'))
    console.log('SSR content + metadata:', path)
  }
  for (const path of ['/unknown-page','/college/missing',`${base}/syllabus/pending`,`${base}/syllabus/missing`]) assert.equal((await request(path)).status,404,path)
  const redirect = await request('/college/test-alias/subject/cs-gy?course=CS-GY9215')
  assert.equal(redirect.status,301)
  assert.ok(redirect.headers.get('location').endsWith('/college/test-college/subject/CS-GY?course=CS-GY9215'))
  const filterPage = await (await request('/college/test-college/subject/CS-GY?course=CS-GY9215')).text()
  assert.match(filterPage,/name="robots" content="noindex, follow"/)
  const listingQueries = fixture.calls.filter(call => call.body && JSON.parse(call.body).structuredQuery.from[0].collectionId === 'colleges')
  assert.ok(listingQueries.some(call => JSON.parse(call.body).structuredQuery.startAt), 'Collection pagination must use a cursor')
  assert.ok(listingQueries.every(call => JSON.parse(call.body).structuredQuery.limit === 100))
  const minimal = await request('/college/test-college/subject/LEGACY/course/legacy-code/syllabus/orphan')
  assert.equal(minimal.status,200)
  const wrongSubject = await request('/college/test-college/subject/WRONG/course/CS-GY%209215')
  assert.equal(wrongSubject.status,301)
  assert.ok(wrongSubject.headers.get('location').endsWith(base))
  for (const path of ['/uploadsyllabus','/uploadSyllabus/test-college','/settings','/admin','/signin']) {
    const response = await request(path)
    assert.equal(response.status,200,path)
    assert.match(await response.text(),/name="robots" content="noindex, follow"/)
  }
  for (const path of ['/sitemap.xml','/sitemaps/pages','/sitemaps/subjects/test-college','/sitemaps/syllabi/test-college/CS-GY%209215']) {
    const response = await request(path)
    assert.equal(response.status,200,path)
    assert.match(response.headers.get('content-type'),/xml/)
    const body = await response.text()
    assert.ok(!body.includes('/admin') && !body.includes('/signin') && !body.includes('/pending'))
  }
  fixture.setFail(true)
  assert.equal((await request('/college/data-failure')).status,500)
  console.log('404s, 301 preserving queries, optional metadata, sitemap, private field exclusion, and temporary failure status passed.')
  fixture.restore()
}
