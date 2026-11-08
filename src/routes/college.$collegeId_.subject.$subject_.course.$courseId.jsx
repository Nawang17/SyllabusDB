import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { getPublicPage } from '../lib/public-loader'
import { canonicalPath, publicHead } from '../lib/seo'
import PublicPage from '../components/PublicPage'
export const Route = createFileRoute('/college/$collegeId_/subject/$subject_/course/$courseId')({
  loaderDeps: ({ search }) => search,
  loader: async ({ params, location }) => {
    const data = await getPublicPage({ data: params })
    if (!data) throw notFound()
    const canonical = canonicalPath(data, params)
    if (decodeURIComponent(canonical) !== decodeURIComponent(location.pathname)) throw redirect({ href: canonical + location.searchStr, statusCode: 301 })
    return { ...data, hasSearch: Boolean(location.searchStr) }
  },
  head: ({ loaderData, params }) => publicHead(loaderData, params),
  pendingComponent: () => <main className="page-shell" role="status">Loading public syllabi…</main>,
  component: Page,
})
function Page() { return <PublicPage key={JSON.stringify(Route.useParams())} data={Route.useLoaderData()} params={Route.useParams()} /> }
