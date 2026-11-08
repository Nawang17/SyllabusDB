import { createFileRoute } from '@tanstack/react-router'
import Page from '../pages/Footer/TakeDown/TakeDownPage.jsx'
import { seo } from '../lib/seo'
export const Route = createFileRoute('/takedown')({ head: () => seo('Takedown requests', 'Takedown requests for SyllabusDB.', '/takedown'), component: Page })
