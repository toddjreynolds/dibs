import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../utils/AuthContext'
import { ItemCard } from '../components/ItemCard'
import { UploadModal } from '../components/UploadModal'
import { useExpirationChecker } from '../hooks/useExpirationChecker'

export function Browse({ currentSection = 'browse' }) {
  const { user } = useAuthContext()
  const [items, setItems] = useState([])
  const [userClaims, setUserClaims] = useState({})
  const [profiles, setProfiles] = useState([])
  const [userPoints, setUserPoints] = useState(100)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  // Check for expired items periodically
  useExpirationChecker()

  const optimisticClaimUpdate = (itemId, status, existingClaim) => {
    // Update userClaims immediately for instant UI feedback
    setUserClaims(prev => {
      const newClaims = { ...prev }
      if (existingClaim) {
        if (existingClaim.status === status) {
          // Remove claim if clicking same status
          delete newClaims[itemId]
        } else {
          // Update to new status
          newClaims[itemId] = { ...existingClaim, status }
        }
      } else {
        // Create new claim
        newClaims[itemId] = { item_id: itemId, user_id: user.id, status }
      }
      return newClaims
    })

    // Update interested_count in items
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      
      let interestedDelta = 0
      const wasInterested = existingClaim?.status === 'interested'
      const nowInterested = status === 'interested' && existingClaim?.status !== 'interested'
      
      if (nowInterested) interestedDelta = 1
      if (wasInterested && status !== 'interested') interestedDelta = -1
      
      return {
        ...item,
        interested_count: Math.max(0, item.interested_count + interestedDelta)
      }
    }))
  }

  const loadData = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      // Fetch all profiles for couple and bidding display
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')

      if (profilesError) throw profilesError
      setProfiles(profilesData || [])

      // Get current user's points (defaults to 100 if points column doesn't exist yet)
      const userProfile = profilesData?.find(p => p.id === user.id)
      setUserPoints(userProfile?.points || 100)

      // Fetch items
      // Note: Queries bid_amount from claims, but works even if column doesn't exist yet
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          *,
          claims!claims_item_id_fkey(id, user_id, status, bid_amount)
        `)
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError

      // Process items - only filter active items at the top level
      // All sections except 'mystuff' should only see active items
      // 'mystuff' needs to see awarded items
      let filteredItemsData = itemsData || []

      // Filter by status based on current section
      if (itemsData.length > 0 && 'status' in itemsData[0]) {
        if (currentSection === 'mystuff') {
          // Only show resolved items won by the user
          filteredItemsData = itemsData.filter(item => item.status === 'resolved' && item.winner_id === user.id)
        } else if (currentSection === 'donation') {
          // Only show donated items
          filteredItemsData = itemsData.filter(item => item.status === 'donated')
        } else {
          // All other sections should only see active items
          filteredItemsData = itemsData.filter(item => item.status === 'active')
        }
      }

      const processedItems = filteredItemsData.map(item => ({
        ...item,
        interested_count: item.claims?.filter(c => c.status === 'interested').length || 0,
      }))

      setItems(processedItems)

      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .eq('user_id', user.id)

      if (claimsError) throw claimsError

      const claimsMap = {}
      claimsData.forEach(claim => {
        claimsMap[claim.item_id] = claim
      })
      setUserClaims(claimsMap)
    } catch (error) {
      console.error('Error loading data:', error.message || JSON.stringify(error))
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    // Initial load shows spinner
    loadData(true)

    // Check if modal should reopen after Vite dev reload (Android camera fix)
    const shouldReopen = sessionStorage.getItem('uploadModalShouldReopen')
    if (shouldReopen === 'true') {
      console.log('Reopening upload modal after page reload')
      setShowUploadModal(true)
      sessionStorage.removeItem('uploadModalShouldReopen')
    }

    // Real-time subscriptions update silently in background
    const itemsSubscription = supabase
      .channel('items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        loadData() // No loading spinner for real-time updates
      })
      .subscribe()

    const claimsSubscription = supabase
      .channel('claims_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, () => {
        loadData() // No loading spinner for real-time updates
      })
      .subscribe()

    // Also subscribe to profile changes for points updates
    const profilesSubscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadData() // No loading spinner for real-time updates
      })
      .subscribe()

    return () => {
      itemsSubscription.unsubscribe()
      claimsSubscription.unsubscribe()
      profilesSubscription.unsubscribe()
    }
  }, [user, currentSection])

  const getFilteredItems = () => {
    switch (currentSection) {
      case 'dibbed':
        return items.filter(item => userClaims[item.id]?.status === 'interested')
      case 'passed':
        return items.filter(item => userClaims[item.id]?.status === 'declined')
      case 'conflicts':
        return items.filter(item => {
          const userDibbed = userClaims[item.id]?.status === 'interested'
          const hasConflict = item.interested_count > 1
          return userDibbed && hasConflict
        })
      case 'mystuff':
        // Items are already filtered to resolved items won by user
        return items
      case 'donation':
        // Items are already filtered to donated items
        return items
      default:
        return items
    }
  }

  const filteredItems = getFilteredItems()

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'dibbed':
        return 'Items I\'ve Dibbed'
      case 'passed':
        return 'Items I\'ve Passed'
      case 'conflicts':
        return 'My Conflicts'
      case 'mystuff':
        return 'My Stuff'
      case 'donation':
        return 'Donate/Sell'
      default:
        return 'All Items'
    }
  }

  const getEmptyMessage = () => {
    switch (currentSection) {
      case 'dibbed':
        return 'You haven\'t dibbed any items yet'
      case 'passed':
        return 'You haven\'t passed on any items yet'
      case 'conflicts':
        return 'No conflicts! All items you want are available.'
      case 'mystuff':
        return 'No items awarded to you yet'
      case 'donation':
        return 'No items available to donate or sell'
      default:
        return 'No items yet. Upload the first one!'
    }
  }

  return (
    <div>
      {/* Floating Action Button */}
      <button onClick={() => setShowUploadModal(true)} className="fab">
        <svg className="fab-icon" width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.5 16C3.98333 16 2.6875 15.475 1.6125 14.425C0.5375 13.375 0 12.0917 0 10.575C0 9.275 0.391667 8.11667 1.175 7.1C1.95833 6.08333 2.98333 5.43333 4.25 5.15C4.66667 3.61667 5.5 2.375 6.75 1.425C8 0.475 9.41667 0 11 0C12.95 0 14.6042 0.679167 15.9625 2.0375C17.3208 3.39583 18 5.05 18 7C19.15 7.13333 20.1042 7.62917 20.8625 8.4875C21.6208 9.34583 22 10.35 22 11.5C22 12.75 21.5625 13.8125 20.6875 14.6875C19.8125 15.5625 18.75 16 17.5 16H12V8.85L12.9 9.725C13.0833 9.90833 13.3125 10 13.5875 10C13.8625 10 14.1 9.9 14.3 9.7C14.4833 9.51667 14.575 9.28333 14.575 9C14.575 8.71667 14.4833 8.48333 14.3 8.3L11.7 5.7C11.5 5.5 11.2667 5.4 11 5.4C10.7333 5.4 10.5 5.5 10.3 5.7L7.7 8.3C7.51667 8.48333 7.42083 8.7125 7.4125 8.9875C7.40417 9.2625 7.5 9.5 7.7 9.7C7.88333 9.88333 8.1125 9.97917 8.3875 9.9875C8.6625 9.99583 8.9 9.90833 9.1 9.725L10 8.85V16H5.5Z" fill="white"/>
        </svg>
        <span className="fab-label">Upload</span>
      </button>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => {
          console.log('Browse.jsx: onClose called - closing modal')
          console.trace('Browse.jsx: Stack trace for onClose')
          setShowUploadModal(false)
        }}
        onUploadComplete={() => loadData(false)}
      />

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-rounded text-6xl mb-4 block text-gray-400">
            {currentSection === 'conflicts' ? 'celebration' : 'inventory_2'}
          </span>
          <p className="text-gray-600 text-lg">{getEmptyMessage()}</p>
        </div>
      ) : (
        <div className={currentSection === 'donation' ? 'grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4' : 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4'}>
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              userClaim={userClaims[item.id]}
              onClaimUpdate={optimisticClaimUpdate}
              onDataReload={() => loadData(false)}
              profiles={profiles}
              userPoints={userPoints}
              currentSection={currentSection}
            />
          ))}
        </div>
      )}
    </div>
  )
}
