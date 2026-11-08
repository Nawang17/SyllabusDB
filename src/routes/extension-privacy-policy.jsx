import { createFileRoute } from '@tanstack/react-router'
import Page from '../pages/syllabusdb-extension/ExtensionPrivacyPolicy.jsx'
import { seo } from '../lib/seo'
export const Route = createFileRoute('/extension-privacy-policy')({ head: () => seo('Extension privacy policy', 'Extension privacy policy for SyllabusDB.', '/extension-privacy-policy'), component: Page })
