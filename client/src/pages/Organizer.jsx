import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../utils/AuthContext'
import { useIsOrganizer } from '../hooks/useRole'
import { ItemCard } from '../components/ItemCard'
import { ImageViewerModal } from '../components/ImageViewerModal'

export function Organizer() {
  const { user } = useAuthContext()
  const isOrganizer = useIsOrganizer()
  const [items, setItems] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDelivered, setShowDelivered] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [markingAllFor, setMarkingAllFor] = useState(null)

  useEffect(() => {
    if (!isOrganizer) {
      // Redirect non-organizers
      window.location.href = '/'
      return
    }
    loadData()

    // Subscribe to real-time updates
    const itemsSubscription = supabase
      .channel('organizer_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      itemsSubscription.unsubscribe()
    }
  }, [isOrganizer])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch all profiles for displaying winner names
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')

      if (profilesError) throw profilesError
      setProfiles(profilesData || [])

      // Fetch all resolved items with winner information
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'resolved')
        .order('resolved_at', { ascending: false })

      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (error) {
      console.error('Error loading organizer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDeliveryStatus = async (itemId, currentStatus) => {
    try {
      const newStatus = currentStatus ? null : new Date().toISOString()
      
      const { error } = await supabase
        .from('items')
        .update({ delivered_at: newStatus })
        .eq('id', itemId)

      if (error) throw error
      
      // Reload data to reflect changes
      await loadData()
    } catch (error) {
      console.error('Error updating delivery status:', error)
      alert('Failed to update delivery status. Please try again.')
    }
  }

  const markAllAsDelivered = async (winnerId) => {
    if (!confirm('Mark all pending items for this participant as delivered?')) {
      return
    }

    setMarkingAllFor(winnerId)
    try {
      const itemsToMark = items.filter(
        item => item.winner_id === winnerId && !item.delivered_at
      )
      
      const { error } = await supabase
        .from('items')
        .update({ delivered_at: new Date().toISOString() })
        .in('id', itemsToMark.map(item => item.id))

      if (error) throw error
      
      await loadData()
    } catch (error) {
      console.error('Error marking all as delivered:', error)
      alert('Failed to mark items as delivered. Please try again.')
    } finally {
      setMarkingAllFor(null)
    }
  }

  // Group items by winner
  const getGroupedItems = () => {
    let filtered = items

    // Filter by delivery status
    if (!showDelivered) {
      filtered = filtered.filter(item => !item.delivered_at)
    }

    // Group by winner
    const grouped = {}
    filtered.forEach(item => {
      const winnerId = item.winner_id
      if (!grouped[winnerId]) {
        const winner = profiles.find(p => p.id === winnerId)
        grouped[winnerId] = {
          winner: winner,
          winnerName: winner ? (winner.first_name || winner.full_name || 'Unknown') : 'Unknown',
          items: []
        }
      }
      grouped[winnerId].items.push(item)
    })

    // Sort by winner name
    return Object.values(grouped).sort((a, b) => 
      a.winnerName.localeCompare(b.winnerName)
    )
  }

  const groupedItems = getGroupedItems()
  const pendingCount = items.filter(item => !item.delivered_at).length
  const deliveredCount = items.filter(item => item.delivered_at).length

  if (!isOrganizer) {
    return null // Will redirect
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Organizer Dashboard</h1>
        <p className="text-gray-600">Track and manage item deliveries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Items</p>
              <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <span className="material-symbols-rounded text-5xl text-orange-600">
              pending_actions
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Delivered Items</p>
              <p className="text-3xl font-bold text-green-600">{deliveredCount}</p>
            </div>
            <span className="material-symbols-rounded text-5xl text-green-600">
              check_circle
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center">
          {/* Show Delivered Toggle */}
          <button
            onClick={() => setShowDelivered(!showDelivered)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showDelivered
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="material-symbols-rounded text-lg">
              {showDelivered ? 'visibility' : 'visibility_off'}
            </span>
            {showDelivered ? 'Hide Delivered' : 'Show Delivered'}
          </button>
        </div>
      </div>

      {/* Grouped Items by Participant */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading items...</p>
        </div>
      ) : groupedItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <span className="material-symbols-rounded text-6xl mb-4 block text-gray-400">
            celebration
          </span>
          <p className="text-gray-600 text-lg">
            {!showDelivered && pendingCount === 0 && 'All items delivered! 🎉'}
            {showDelivered && 'No resolved items yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {groupedItems.map(group => {
              const pendingItems = group.items.filter(item => !item.delivered_at)
              const deliveredItems = group.items.filter(item => item.delivered_at)
              const hasPending = pendingItems.length > 0

              return (
                <motion.div
                  key={group.winner?.id || 'unknown'}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Participant Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                          {group.winnerName[0].toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{group.winnerName}</h2>
                          <p className="text-sm text-gray-600">
                            {pendingItems.length} pending{deliveredItems.length > 0 && `, ${deliveredItems.length} delivered`}
                          </p>
                        </div>
                      </div>
                      
                      {/* Mark All Delivered Button */}
                      {hasPending && (
                        <button
                          onClick={() => markAllAsDelivered(group.winner?.id)}
                          disabled={markingAllFor === group.winner?.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {markingAllFor === group.winner?.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Marking...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-rounded text-lg">done_all</span>
                              Mark All Delivered
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {group.items.map(item => {
                        const isDelivered = !!item.delivered_at

                        return (
                          <div
                            key={item.id}
                            className="relative group"
                          >
                            {/* Image */}
                            <div 
                              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                              onClick={() => item.image_url && setSelectedImage(item.image_url)}
                            >
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt="Item"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-rounded text-4xl text-gray-300">
                                    image
                                  </span>
                                </div>
                              )}
                              
                              {/* Delivery Status Badge */}
                              <div className={`absolute top-2 right-2 rounded-full p-1.5 ${
                                isDelivered 
                                  ? 'bg-green-500' 
                                  : 'bg-orange-500'
                              }`}>
                                <span className="material-symbols-rounded text-white text-sm">
                                  {isDelivered ? 'check' : 'schedule'}
                                </span>
                              </div>

                              {/* Toggle Button on Hover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleDeliveryStatus(item.id, isDelivered)
                                }}
                                className={`absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                                  isDelivered ? 'text-gray-200' : 'text-white'
                                }`}
                              >
                                <span className="material-symbols-rounded text-2xl">
                                  {isDelivered ? 'replay' : 'done'}
                                </span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  )
}

