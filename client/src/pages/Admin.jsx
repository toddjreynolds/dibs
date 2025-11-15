import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../utils/AuthContext'
import { useIsAdmin, useGroupId } from '../hooks/useRole'

export function Admin() {
  const { user } = useAuthContext()
  const isAdmin = useIsAdmin()
  const groupId = useGroupId()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState(null)

  useEffect(() => {
    if (!isAdmin) {
      // Redirect non-admins
      window.location.href = '/'
      return
    }
    loadUsers()

    // Subscribe to profile changes
    const profilesSubscription = supabase
      .channel('admin_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadUsers()
      })
      .subscribe()

    return () => {
      profilesSubscription.unsubscribe()
    }
  }, [isAdmin, groupId])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    if (userId === user.id && newRole !== 'admin') {
      if (!confirm('Warning: You are about to remove your own admin privileges. Are you sure?')) {
        return
      }
    }

    setUpdatingUserId(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      
      await loadUsers()
      alert('Role updated successfully!')
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role. Please try again.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handlePointsAdjustment = async (userId) => {
    const currentUser = users.find(u => u.id === userId)
    if (!currentUser) return

    const newPoints = prompt(
      `Current points: ${currentUser.points}\n\nEnter new points value:`,
      currentUser.points
    )

    if (newPoints === null) return // User cancelled

    const pointsValue = parseInt(newPoints, 10)
    if (isNaN(pointsValue) || pointsValue < 0) {
      alert('Please enter a valid positive number')
      return
    }

    setUpdatingUserId(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ points: pointsValue })
        .eq('id', userId)

      if (error) throw error
      
      await loadUsers()
      alert('Points updated successfully!')
    } catch (error) {
      console.error('Error updating points:', error)
      alert('Failed to update points. Please try again.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleRemoveUser = async (userId) => {
    if (userId === user.id) {
      alert('You cannot remove yourself from the group.')
      return
    }

    const userToRemove = users.find(u => u.id === userId)
    const displayName = userToRemove?.first_name || userToRemove?.full_name || 'this user'
    
    if (!confirm(`Are you sure you want to remove ${displayName} from the group? This action cannot be undone.`)) {
      return
    }

    setUpdatingUserId(userId)
    try {
      // Set group_id to null to remove from group
      const { error } = await supabase
        .from('profiles')
        .update({ group_id: null })
        .eq('id', userId)

      if (error) throw error
      
      await loadUsers()
      alert('User removed from group successfully!')
    } catch (error) {
      console.error('Error removing user:', error)
      alert('Failed to remove user. Please try again.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'organizer':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    organizer: users.filter(u => u.role === 'organizer').length,
    participant: users.filter(u => u.role === 'participant').length,
  }

  if (!isAdmin) {
    return null // Will redirect
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Settings</h1>
        <p className="text-gray-600">Manage group members and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Admins</p>
              <p className="text-3xl font-bold text-red-600">{roleStats.admin}</p>
            </div>
            <span className="material-symbols-rounded text-5xl text-red-600">
              shield
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Organizers</p>
              <p className="text-3xl font-bold text-blue-600">{roleStats.organizer}</p>
            </div>
            <span className="material-symbols-rounded text-5xl text-blue-600">
              manage_accounts
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Participants</p>
              <p className="text-3xl font-bold text-gray-600">{roleStats.participant}</p>
            </div>
            <span className="material-symbols-rounded text-5xl text-gray-600">
              group
            </span>
          </div>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <span className="material-symbols-rounded text-6xl mb-4 block text-gray-400">
            person_search
          </span>
          <p className="text-gray-600 text-lg">No users in this group</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={updatingUserId === u.id ? 'opacity-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {(u.first_name || u.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {u.first_name || u.full_name || 'Unknown'}
                            {u.id === user.id && (
                              <span className="ml-2 text-xs text-blue-600">(You)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updatingUserId === u.id}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(u.role)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="participant">Participant</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 font-medium">{u.points}</span>
                        <button
                          onClick={() => handlePointsAdjustment(u.id)}
                          disabled={updatingUserId === u.id}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          title="Adjust points"
                        >
                          <span className="material-symbols-rounded text-sm">edit</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveUser(u.id)}
                        disabled={updatingUserId === u.id || u.id === user.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={u.id === user.id ? "You cannot remove yourself" : "Remove from group"}
                      >
                        <span className="material-symbols-rounded">person_remove</span>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

