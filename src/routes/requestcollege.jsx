import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import ClientPage from '../components/ClientPage'
import { seo } from '../lib/seo'
const Page = lazy(() => import('../pages/RequestCollege/RequestCollege.jsx'))
export const Route = createFileRoute('/requestcollege')({ head: () => seo('Request a college', 'Request a college on SyllabusDB.', '/requestcollege', true), component: () => <ClientPage page={Page} /> })
