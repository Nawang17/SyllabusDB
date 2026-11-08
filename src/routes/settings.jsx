import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import ClientPage from '../components/ClientPage'
import { seo } from '../lib/seo'
const Page = lazy(() => import('../pages/Account/MyUploads/Settings/Settings.jsx'))
export const Route = createFileRoute('/settings')({ head: () => seo('Settings', 'Settings on SyllabusDB.', '/settings', true), component: () => <ClientPage page={Page} /> })
