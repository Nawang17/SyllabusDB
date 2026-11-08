import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import ClientPage from '../components/ClientPage'
import { seo } from '../lib/seo'
const Page = lazy(() => import('../pages/sign-in.jsx'))
export const Route = createFileRoute('/signin')({ head: () => seo('Sign in', 'Sign in on SyllabusDB.', '/signin', true), component: () => <ClientPage page={Page} /> })
