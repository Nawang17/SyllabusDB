import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
export default function ThemeToaster() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return <Toaster richColors closeButton theme={dark ? 'dark' : 'light'} />
}
