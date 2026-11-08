import { createFileRoute } from '@tanstack/react-router'
import Page from '../pages/Footer/GuidelinesPage/GuideLinesPage.jsx'
import { seo } from '../lib/seo'
export const Route = createFileRoute('/guidelines')({ head: () => seo('Upload guidelines', 'Upload guidelines for SyllabusDB.', '/guidelines'), component: Page })
