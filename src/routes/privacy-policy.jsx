import { createFileRoute } from '@tanstack/react-router'
import Page from '../pages/Footer/PrivacyPolicy/PrivacyPolicy.jsx'
import { seo } from '../lib/seo'
export const Route = createFileRoute('/privacy-policy')({ head: () => seo('Privacy policy', 'Privacy policy for SyllabusDB.', '/privacy-policy'), component: Page })
