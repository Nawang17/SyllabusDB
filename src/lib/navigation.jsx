// Small migration bridge for the existing forms' string-based navigation.
import { Link as RouterLink, useNavigate as useRouterNavigate, useLocation as useRouterLocation, useParams as useRouterParams } from '@tanstack/react-router'
import { useCallback } from 'react'
export function Link({ to, ...props }) { return <RouterLink to={to} {...props} /> }
export function NavLink({ className, to, ...props }) {
  const location = useLocation()
  return <Link to={to} className={typeof className === 'function' ? className({ isActive: location.pathname === to }) : className} {...props} />
}
export function useNavigate() {
  const navigate = useRouterNavigate()
  return useCallback((to, options = {}) => navigate({ to, replace: options.replace }), [navigate])
}
export function useLocation() {
  const location = useRouterLocation()
  return { ...location, search: location.searchStr }
}
export function useParams() { return useRouterParams({ strict: false }) }
