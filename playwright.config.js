import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'retain-on-failure' },
  ...(process.env.MIGRATION_TEST_SERVER === 'external' ? {} : { webServer: { command: 'node scripts/test-server.mjs', url: 'http://127.0.0.1:4175/colleges', reuseExistingServer: false, gracefulShutdown: { signal: 'SIGTERM', timeout: 1000 } } }),
})
