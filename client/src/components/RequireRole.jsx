import { useRole, useIsOrganizer, useIsAdmin } from '../hooks/useRole'

/**
 * Component that only renders children if user has the required role
 * @param {string} role - Required role: 'participant', 'organizer', or 'admin'
 * @param {ReactNode} children - Content to render if user has permission
 * @param {ReactNode} fallback - Optional fallback content if user lacks permission
 */
export function RequireRole({ role, children, fallback = null }) {
  const userRole = useRole()
  const isOrganizer = useIsOrganizer()
  const isAdmin = useIsAdmin()

  const hasPermission = () => {
    switch (role) {
      case 'admin':
        return isAdmin
      case 'organizer':
        return isOrganizer // organizer or admin
      case 'participant':
        return true // everyone can access participant features
      default:
        return false
    }
  }

  return hasPermission() ? children : fallback
}

/**
 * Component that only renders children if user is organizer or admin
 */
export function RequireOrganizer({ children, fallback = null }) {
  return <RequireRole role="organizer" fallback={fallback}>{children}</RequireRole>
}

/**
 * Component that only renders children if user is admin
 */
export function RequireAdmin({ children, fallback = null }) {
  return <RequireRole role="admin" fallback={fallback}>{children}</RequireRole>
}

