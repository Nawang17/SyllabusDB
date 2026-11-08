import { createFileRoute } from '@tanstack/react-router'
import Page from '../pages/Footer/TermsOfService/TermsOfService.jsx'
import { seo } from '../lib/seo'
export const Route = createFileRoute('/termsofservice')({ head: () => seo('Terms of service', 'Terms of service for SyllabusDB.', '/termsofservice'), component: Page })
