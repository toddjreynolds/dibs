import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'

export function Conflicts() {
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalItems: 0,
    claimedItems: 0,
    conflictedItems: 0,
    unclaimedItems: 0,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Load all items with claims and profiles
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          *,
          claims!claims_item_id_fkey(
            id,
            status,
            claimed_at,
            profiles:user_id(first_name, id)
          )
        `)
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError

      // Calculate conflicts and stats
      const conflictedItems = []
      let claimedCount = 0
      let unclaimedCount = 0

      itemsData.forEach(item => {
        const interestedClaims = item.claims?.filter(c => c.status === 'interested') || []
        
        // Check if current user is interested in this item
        const userIsInterested = interestedClaims.some(c => c.profiles.id === user.id)
        
        // Only add to conflicts if user is interested AND there are multiple interested parties
        if (userIsInterested && interestedClaims.length > 1) {
          conflictedItems.push({
            ...item,
            interestedUsers: interestedClaims.map(c => ({
              id: c.profiles.id,
              name: c.profiles.first_name,
              claimedAt: c.claimed_at,
            })),
          })
        }

        if (interestedClaims.length > 0) {
          claimedCount++
        } else {
          unclaimedCount++
        }
      })

      setConflicts(conflictedItems)
      setStats({
        totalItems: itemsData.length,
        claimedItems: claimedCount,
        conflictedItems: conflictedItems.length,
        unclaimedItems: unclaimedCount,
      })
    } catch (error) {
      console.error('Error loading conflicts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('conflicts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Conflict Resolution</h1>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-primary">{stats.totalItems}</div>
          <div className="text-sm text-gray-600 mt-1">Total Items</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold" style={{ color: '#8338EC' }}>{stats.claimedItems}</div>
          <div className="text-sm text-gray-600 mt-1">Claimed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold" style={{ color: '#FB5607' }}>{stats.conflictedItems}</div>
          <div className="text-sm text-gray-600 mt-1">Conflicts</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-gray-600">{stats.unclaimedItems}</div>
          <div className="text-sm text-gray-600 mt-1">Unclaimed</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading conflicts...</p>
        </div>
      ) : conflicts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <span className="material-symbols-rounded text-6xl mb-4 block" style={{ color: '#FFBE0B' }}>celebration</span>
          <p className="text-gray-600 text-lg mb-2">No conflicts!</p>
          <p className="text-gray-500 text-sm">All items have at most one person interested</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'rgba(251, 86, 7, 0.1)', border: '1px solid rgba(251, 86, 7, 0.3)' }}>
            <div className="flex items-start space-x-3">
              <span className="material-symbols-rounded text-2xl" style={{ color: '#FB5607' }}>warning</span>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: '#C44505' }}>
                  {conflicts.length} Item{conflicts.length !== 1 ? 's' : ''} with Multiple Claims
                </h3>
                <p className="text-sm" style={{ color: '#9A3704' }}>
                  These items need resolution. Multiple people are interested in the same item.
                </p>
              </div>
            </div>
          </div>

          {conflicts.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="md:flex">
                {/* Image */}
                <div className="md:w-64 md:flex-shrink-0">
                  <div className="aspect-square bg-gray-200 relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name || 'Item'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="material-symbols-rounded text-6xl">inventory_2</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 text-white px-3 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: '#FF006E' }}>
                      {item.interestedUsers.length} people
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      People Interested ({item.interestedUsers.length})
                    </h3>
                    <div className="space-y-2">
                      {item.interestedUsers.map((user, index) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-semibold">
                              {user.name?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium text-gray-800">
                              {user.name || 'Unknown User'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(user.claimedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

