import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { default: app } = await import('../dist/server/server.js')
const request = path => app.fetch(new Request(`https://example-preview.netlify.app${path}`))
const page = await request('/aboutpage')
assert.equal(page.status,200)
const html = await page.text()
assert.match(html,/name="robots" content="noindex, follow"/)
assert.ok(!html.includes('rel="canonical" href="https://example-preview.netlify.app'))
const robots = await (await request('/robots.txt')).text()
assert.match(robots,/Disallow: \//)
assert.equal((await request('/sitemap.xml')).status,404)
assert.match(await readFile('dist/client/_headers','utf8'),/X-Robots-Tag: noindex, nofollow/)
console.log('Preview noindex metadata, production canonical, robots exclusion, sitemap disabled, and Netlify header passed.')
