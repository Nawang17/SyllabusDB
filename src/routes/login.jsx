import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import ClientPage from '../components/ClientPage'
import { seo } from '../lib/seo'
const Page = lazy(() => import('../pages/Login/LoginPage.jsx'))
export const Route = createFileRoute('/login')({ head: () => seo('Admin login', 'Admin login on SyllabusDB.', '/login', true), component: () => <ClientPage page={Page} /> })
