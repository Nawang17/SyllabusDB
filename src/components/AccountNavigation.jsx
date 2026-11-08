import { useEffect, useState } from 'react'
import { DropdownMenu } from 'radix-ui'
import { IconChevronDown, IconUser } from '@tabler/icons-react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebaseConfig'
import { Link, useNavigate } from '../lib/navigation'
import { notifications } from '../lib/notifications'

export default function AccountNavigation({ sidebar = false, onNavigate }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    let currentUid = null
    const stop = onAuthStateChanged(auth, current => {
      const signedIn = current && !current.isAnonymous ? current : null
      currentUid = signedIn?.uid
      setUser(signedIn); setProfile(null); setPhotoFailed(false); setReady(true)
      if (signedIn) getDoc(doc(db, 'users', signedIn.uid)).then(snapshot => {
        if (active && currentUid === signedIn.uid) setProfile(snapshot.exists() ? snapshot.data() : null)
      }).catch(() => { /* Firebase Auth still supplies the name and photo if the profile read fails. */ })
    })
    return () => { active = false; stop() }
  }, [])
  if (!ready) return <button type="button" className="header-signin" disabled aria-label="Loading sign-in status">Sign in</button>
  if (!user) return <Link to="/signin" className="header-signin" onClick={onNavigate}>Sign in</Link>
  const name = profile?.full_name || user?.displayName || user?.email || 'Account'
  const photo = profile?.profile_image || user?.photoURL
  const initials = name.trim().split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase()
  const links = [['/myuploads','My uploads'],['/settings','Settings'],...(user.email === 'nawangsherpa1010@gmail.com' ? [['/admin','Admin']] : [])]
  const handleSignOut = async () => {
    try {
      await signOut(auth)
      onNavigate?.()
      navigate('/')
      notifications.show({ message:'Signed out' })
    } catch {
      notifications.show({ color:'red', message:'Could not sign out. Please try again.' })
    }
  }
  if (sidebar) return <>
    <div className="mobile-account-profile">
      <span className="header-avatar">{photo && !photoFailed ? <img src={photo} alt="" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} /> : initials}</span>
      <div><strong>{name}</strong>{user.email && <span>{user.email}</span>}</div>
    </div>
    <nav className="mobile-account-links" aria-label="Your account">
      {links.map(([to,label]) => <Link to={to} key={to} onClick={onNavigate}>{label}</Link>)}
      <button type="button" className="account-signout" onClick={handleSignOut}>Sign out</button>
    </nav>
  </>
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button type="button" className="account-toggle" disabled={!ready} aria-label={user ? `Account menu for ${name}` : 'Account menu'} title={user ? name : 'Account'}>
        <span className="header-avatar">{photo && !photoFailed ? <img src={photo} alt="" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} /> : user ? initials : <IconUser size={18} aria-hidden="true" />}</span>
        <span className="account-toggle-name">{name}</span>
        <IconChevronDown className="account-chevron" size={14} aria-hidden="true" />
      </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" sideOffset={8} collisionPadding={12} className="header-dropdown" aria-label="Account menu">
        {user && <><DropdownMenu.Label className="account-menu-profile">{name}{user.email && <span>{user.email}</span>}</DropdownMenu.Label><DropdownMenu.Separator className="header-dropdown-separator" /></>}
        {links.map(([to,label]) => <DropdownMenu.Item asChild key={to}><Link to={to} className="header-dropdown-item">{label}</Link></DropdownMenu.Item>)}
        <DropdownMenu.Separator className="header-dropdown-separator" />
        <DropdownMenu.Item asChild><Link to="/colleges" className="header-dropdown-item">Browse colleges</Link></DropdownMenu.Item>
        <DropdownMenu.Item asChild><Link to="/aboutpage" className="header-dropdown-item">About SyllabusDB</Link></DropdownMenu.Item>
        {user && <><DropdownMenu.Separator className="header-dropdown-separator" /><DropdownMenu.Item className="header-dropdown-item account-signout" onSelect={handleSignOut}>Sign out</DropdownMenu.Item></>}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
}
