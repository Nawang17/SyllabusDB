import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import SiteHeader from '../components/SiteHeader'
import ThemeToaster from '../components/ThemeToaster'
import { themeScript } from '../components/ThemeControl'
import Footer from '../pages/Footer/Footer'
import { ErrorPage, NotFoundPage } from '../components/RouteStates'
import '../index.css'
export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'SyllabusDB' }, { name: 'robots', content: 'noindex, follow' }] }),
  component: Outlet,
  shellComponent: Root,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})
function Root({ children }) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /><HeadContent /></head><body><a className="skip-link" href="#content">Skip to content</a><SiteHeader /><div id="content" tabIndex={-1}>{children}</div><Footer /><ThemeToaster /><Scripts /></body></html>
}
