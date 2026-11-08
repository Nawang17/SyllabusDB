// Local production-bundle harness, used only by Playwright. No deployment or live writes.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { installFixtures } from './ssr-fixtures.mjs'
installFixtures()
const { default: app } = await import('../dist/server/server.js')
const client = path.resolve('dist/client')
const types = { '.js':'text/javascript', '.css':'text/css', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml' }
export const server = createServer(async (request,response) => {
  try {
    const url = new URL(request.url,'http://localhost:4175')
    if (url.pathname.startsWith('/assets/')) {
      const target = path.resolve(client,'.'+decodeURIComponent(url.pathname))
      if (!target.startsWith(client+path.sep)) { response.writeHead(403).end(); return }
      const file = await readFile(target)
      response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' }).end(file)
      return
    }
    let body
    if (request.method !== 'GET' && request.method !== 'HEAD') { const chunks = []; for await (const chunk of request) chunks.push(chunk); body = Buffer.concat(chunks) }
    const result = await app.fetch(new Request(url, { method: request.method, headers: request.headers, ...(body ? { body, duplex: 'half' } : {}) }))
    response.writeHead(result.status,Object.fromEntries(result.headers))
    for await (const chunk of result.body || []) response.write(chunk)
    response.end()
  } catch { response.writeHead(500).end('Test server error') }
})
await new Promise(resolve => server.listen(4175,'127.0.0.1',resolve))
console.log('Production-bundle fixture server: http://127.0.0.1:4175')
