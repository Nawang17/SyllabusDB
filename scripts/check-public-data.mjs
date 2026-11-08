import { loadEnv } from 'vite'
const env = loadEnv(process.argv[2] || 'production', process.cwd(), 'VITE_')
if (!env.VITE_FIREBASE_PROJECT_ID || !env.VITE_FIREBASE_API_KEY) { console.log('Firebase web configuration missing'); process.exit(2) }
const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.VITE_FIREBASE_PROJECT_ID)}/databases/(default)/documents`
try {
  const response = await fetch(`${base}:runQuery?key=${encodeURIComponent(env.VITE_FIREBASE_API_KEY)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'colleges' }], limit: 3 } }), signal: AbortSignal.timeout(12_000) })
  console.log('Anonymous Firestore status:', response.status)
  if (!response.ok) { console.log('Public access unavailable; response body omitted'); process.exit(1) }
  const data = await response.json()
  console.log('Sample public college records:', data.filter(row => row.document && row.document.fields?.approved?.booleanValue !== false).map(row => ({ id: row.document.name.split('/').at(-1), name: row.document.fields?.name?.stringValue, approved: row.document.fields?.approved?.booleanValue })))
} catch (error) { console.log('Public data connection failed:', error.name); process.exit(1) }
