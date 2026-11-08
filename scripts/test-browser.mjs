import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { server } from './test-server.mjs'
const child = spawn(process.execPath, [fileURLToPath(import.meta.resolve('@playwright/test/cli')), 'test', ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, MIGRATION_TEST_SERVER: 'external' } })
const code = await new Promise(resolve => { child.on('exit', code => resolve(code ?? 1)); child.on('error', () => resolve(1)) })
server.closeAllConnections()
await new Promise(resolve => server.close(resolve))
// Firebase/Start background timers are irrelevant after this isolated harness finishes.
process.exit(code)
