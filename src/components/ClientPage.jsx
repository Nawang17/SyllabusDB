import { ClientOnly } from '@tanstack/react-router'
import { Suspense } from 'react'
export default function ClientPage({ page: Page }) {
  return <ClientOnly fallback={<main className="page-shell" role="status">Loading…</main>}><Suspense fallback={<main className="page-shell" role="status">Loading…</main>}><Page /></Suspense></ClientOnly>
}
