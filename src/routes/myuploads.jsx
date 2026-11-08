import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import ClientPage from '../components/ClientPage'
import { seo } from '../lib/seo'
const Page = lazy(() => import('../pages/Account/MyUploads/MyUploadsPage.jsx'))
export const Route = createFileRoute('/myuploads')({ head: () => seo('My uploads', 'My uploads on SyllabusDB.', '/myuploads', true), component: () => <ClientPage page={Page} /> })
