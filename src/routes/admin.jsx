import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import ClientPage from '../components/ClientPage'
import { seo } from '../lib/seo'
const Page = lazy(() => import('../pages/Admin/AdminApprovalPage.jsx'))
export const Route = createFileRoute('/admin')({ head: () => seo('Admin', 'Admin on SyllabusDB.', '/admin', true), component: () => <ClientPage page={Page} /> })
