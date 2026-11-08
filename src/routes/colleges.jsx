import { createFileRoute } from '@tanstack/react-router'
import AllCollegesPage from '../pages/AllColleges/AllCollegesPage'
import { getPublicColleges } from '../lib/public-loader'
import { seo } from '../lib/seo'
export const Route = createFileRoute('/colleges')({ loader: () => getPublicColleges(), head: () => seo('All colleges', 'Browse colleges and universities to find subjects, courses and student-shared syllabi.', '/colleges'), component: Page })
function Page() { return <AllCollegesPage initialColleges={Route.useLoaderData()} /> }
