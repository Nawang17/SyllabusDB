import { createFileRoute } from '@tanstack/react-router'
import Page from '../pages/Footer/About/AboutPage.jsx'
import { seo } from '../lib/seo'
export const Route = createFileRoute('/aboutpage')({ head: () => seo('About', 'About for SyllabusDB.', '/aboutpage'), component: Page })
