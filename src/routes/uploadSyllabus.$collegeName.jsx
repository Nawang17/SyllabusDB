import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import ClientPage from '../components/ClientPage'
import { seo } from '../lib/seo'
const Page = lazy(() => import('../pages/UploadSyllabusPage.jsx/UploadSyllabusPage.jsx'))
export const Route = createFileRoute('/uploadSyllabus/$collegeName')({ head: () => seo('Upload a syllabus', 'Upload a syllabus on SyllabusDB.', '/uploadSyllabus', true), component: () => <ClientPage page={Page} /> })
