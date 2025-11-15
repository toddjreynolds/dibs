import { useMemo } from 'react'
import { useAuthContext } from '../utils/AuthContext'

/**
 * Hook to get the current user's role
 * @returns {string} The user's role: 'participant', 'organizer', or 'admin'
 */
export function useRole() {
  const { profile } = useAuthContext()
  return profile?.role || 'participant'
}

/**
 * Hook to check if the current user is an organizer or admin
 * @returns {boolean} True if user is organizer or admin
 */
export function useIsOrganizer() {
  const role = useRole()
  return role === 'organizer' || role === 'admin'
}

/**
 * Hook to check if the current user is an admin
 * @returns {boolean} True if user is admin
 */
export function useIsAdmin() {
  const role = useRole()
  return role === 'admin'
}

/**
 * Hook to check if the current user can manage (edit/delete) an item
 * @param {Object} item - The item to check permissions for
 * @returns {boolean} True if user can manage the item
 */
export function useCanManageItem(item) {
  const { user } = useAuthContext()
  const isOrganizer = useIsOrganizer()
  
  return useMemo(() => {
    if (!user || !item) return false
    
    // User can manage if they uploaded it OR if they're an organizer/admin
    return item.uploaded_by === user.id || isOrganizer
  }, [user, item, isOrganizer])
}

/**
 * Hook to get the current user's group ID
 * @returns {string|null} The user's group ID
 */
export function useGroupId() {
  const { profile } = useAuthContext()
  return profile?.group_id || null
}

/**
 * Hook to get permission helpers
 * @returns {Object} Object with permission checking functions
 */
export function usePermissions() {
  const role = useRole()
  const isOrganizer = useIsOrganizer()
  const isAdmin = useIsAdmin()
  const groupId = useGroupId()

  return {
    role,
    isOrganizer,
    isAdmin,
    groupId,
    canManageItems: isOrganizer,
    canManageRoles: isAdmin,
    canViewOrganizer: isOrganizer,
    canViewAdmin: isAdmin,
  }
}

