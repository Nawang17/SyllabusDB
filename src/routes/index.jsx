import { createFileRoute } from '@tanstack/react-router'
import HomePage from '../pages/HomePage/HomePage'
import { getPublicColleges } from '../lib/public-loader'
import { seo } from '../lib/seo'
export const Route = createFileRoute('/')({ loader: () => getPublicColleges(), head: () => seo('Browse past college syllabi', 'Find student-shared college syllabi, course expectations, grading policies and workloads before you enroll.', '/'), component: Page })
function Page() { return <HomePage initialColleges={Route.useLoaderData()} /> }
