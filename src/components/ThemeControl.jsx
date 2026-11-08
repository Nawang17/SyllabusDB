import { useEffect, useState } from 'react'
import { DropdownMenu } from 'radix-ui'
import { IconCheck, IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
let sessionTheme
export const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!['light','dark','system'].includes(t))t='system';document.documentElement.classList.toggle('dark',t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))}catch(e){document.documentElement.classList.toggle('dark',matchMedia('(prefers-color-scheme: dark)').matches)}})();`
export default function ThemeControl() {
  const [theme, setTheme] = useState('system')
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const sync = event => {
      let saved = sessionTheme
      if (event?.type === 'syllabusdb-theme-change') saved = event.detail
      else try { saved = localStorage.getItem('theme') ?? sessionTheme } catch { /* Optional storage */ }
      sessionTheme = ['light','dark','system'].includes(saved) ? saved : 'system'
      setTheme(sessionTheme)
    }
    sync(); setReady(true)
    window.addEventListener('syllabusdb-theme-change', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('syllabusdb-theme-change', sync); window.removeEventListener('storage', sync) }
  }, [])
  useEffect(() => {
    if (!ready) return
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media.matches))
    apply(); media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme, ready])
  const changeTheme = next => {
    setTheme(next); sessionTheme = next
    try { localStorage.setItem('theme', next) } catch { /* Optional storage */ }
    window.dispatchEvent(new CustomEvent('syllabusdb-theme-change', { detail:next }))
  }
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild><button type="button" className="theme-toggle" aria-label="Color theme" title={`Color theme: ${theme}`} disabled={!ready}><IconSun className="theme-sun" size={20} stroke={1.7} aria-hidden="true" /><IconMoon className="theme-moon" size={20} stroke={1.7} aria-hidden="true" /></button></DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} collisionPadding={12} className="header-dropdown theme-menu" aria-label="Color theme options">
      <DropdownMenu.RadioGroup value={theme} onValueChange={changeTheme}>
        {[[ 'light','Light',IconSun ],[ 'dark','Dark',IconMoon ],[ 'system','System',IconDeviceDesktop ]].map(([value,label,Icon]) => <DropdownMenu.RadioItem key={value} value={value} className="header-dropdown-item"><Icon size={17} aria-hidden="true" />{label}<DropdownMenu.ItemIndicator className="theme-selected"><IconCheck size={15} aria-hidden="true" /></DropdownMenu.ItemIndicator></DropdownMenu.RadioItem>)}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root>
}
