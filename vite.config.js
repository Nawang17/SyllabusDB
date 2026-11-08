import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // Netlify previews must remain noindex even if a site-wide variable says false.
  ...(process.env.CONTEXT && process.env.CONTEXT !== 'production' ? { define: { 'import.meta.env.VITE_NOINDEX': '"true"' } } : {}),
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [tailwindcss(), tanstackStart(), react(), netlify({ dev: { edgeFunctions: { enabled: false } } }), {
    name: 'preview-robots-header',
    apply: 'build',
    generateBundle() {
      if (this.environment.name === 'client' && process.env.CONTEXT && process.env.CONTEXT !== 'production') {
        this.emitFile({ type: 'asset', fileName: '_headers', source: '/*\n  X-Robots-Tag: noindex, nofollow\n' })
      }
    },
  }],
})
