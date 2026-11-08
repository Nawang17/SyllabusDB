import { lazy, Suspense, useEffect, useState } from 'react'
import { ClientOnly, useHydrated } from '@tanstack/react-router'
import { Dialog as Sheet } from 'radix-ui'
import { IconMenu2, IconX } from '@tabler/icons-react'
import { Link, useLocation } from '../lib/navigation'
import ThemeControl from './ThemeControl'
import './SiteHeader.css'

const AccountNavigation = lazy(() => import('./AccountNavigation'))

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const hydrated = useHydrated()
  const location = useLocation()
  const close = () => setOpen(false)
  useEffect(() => { setOpen(false) }, [location.href])
  useEffect(() => {
    const desktop = matchMedia('(min-width: 769px)')
    const resize = () => { if (desktop.matches) setOpen(false) }
    desktop.addEventListener('change', resize)
    return () => desktop.removeEventListener('change', resize)
  }, [])
  const fallback = <button type="button" className="header-signin" disabled aria-label="Loading sign-in status">Sign in</button>
  return <header className="site-header">
    <nav aria-label="Main navigation" className="header-inner">
      <Link to="/" className="header-brand" aria-label="SyllabusDB"><span className="wordmark">Syllabus<span>DB</span></span></Link>
      <div className="header-actions">
        <Link to="/uploadSyllabus" className="header-upload">Upload syllabus</Link>
        <ThemeControl />
        <ClientOnly fallback={fallback}><Suspense fallback={fallback}><AccountNavigation /></Suspense></ClientOnly>
      </div>
      <Sheet.Root open={open} onOpenChange={setOpen}>
        <Sheet.Trigger asChild><button type="button" className="mobile-menu-toggle" disabled={!hydrated} aria-label="Open navigation menu"><IconMenu2 size={24} aria-hidden="true" /></button></Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.Overlay className="mobile-menu-overlay" />
          <Sheet.Content className="mobile-sidebar" aria-describedby={undefined}>
            <div className="mobile-sidebar-heading"><Sheet.Title>Menu</Sheet.Title><Sheet.Close asChild><button type="button" className="mobile-sidebar-close" aria-label="Close navigation menu"><IconX size={22} aria-hidden="true" /></button></Sheet.Close></div>
            <div className="mobile-sidebar-account"><ClientOnly fallback={fallback}><Suspense fallback={fallback}><AccountNavigation sidebar onNavigate={close} /></Suspense></ClientOnly></div>
            <nav className="mobile-sidebar-links" aria-label="Mobile navigation">
              {[['/','Home'],['/colleges','Browse colleges'],['/uploadSyllabus','Upload syllabus'],['/aboutpage','About SyllabusDB']].map(([to,label]) => <Link to={to} key={to} onClick={close} aria-current={location.pathname.toLowerCase() === to.toLowerCase() ? 'page' : undefined}>{label}</Link>)}
            </nav>
            <div className="mobile-sidebar-theme"><span>Appearance</span><ThemeControl /></div>
          </Sheet.Content>
        </Sheet.Portal>
      </Sheet.Root>
    </nav>
  </header>
}
