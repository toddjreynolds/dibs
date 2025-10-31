import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../utils/AuthContext'
import { ItemCard } from '../components/ItemCard'
import { calculateAvailablePoints } from '../utils/pointsCalculation'

export function MyChoices() {
  const { user } = useAuthContext()
  const [items, setItems] = useState([])
  const [userClaims, setUserClaims] = useState({})
  const [userClaimsArray, setUserClaimsArray] = useState([])
  const [profiles, setProfiles] = useState([])
  const [userPoints, setUserPoints] = useState(100)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')

      if (profilesError) throw profilesError
      setProfiles(profilesData || [])

      // Get current user's points (defaults to 100 if points column doesn't exist yet)
      const userProfile = profilesData?.find(p => p.id === user.id)
      setUserPoints(userProfile?.points || 100)

      // Load user's claims with item details
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select(`
          *,
          items (
            *,
            claims!claims_item_id_fkey(id, user_id, status, bid_amount)
          )
        `)
        .eq('user_id', user.id)

      if (claimsError) throw claimsError

      // Process data
      const claimsMap = {}
      const itemsArray = []

      claimsData.forEach(claim => {
        if (claim.items) {
          const item = {
            ...claim.items,
            interested_count: claim.items.claims?.filter(c => c.status === 'interested').length || 0,
          }
          itemsArray.push(item)
          claimsMap[item.id] = claim
        }
      })

      setItems(itemsArray)
      setUserClaims(claimsMap)
      setUserClaimsArray(claimsData || [])
    } catch (error) {
      console.error('Error loading choices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('my_claims_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const interestedItems = items.filter(item => userClaims[item.id]?.status === 'interested')
  const declinedItems = items.filter(item => userClaims[item.id]?.status === 'declined')

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Choices</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading your choices...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <span className="material-symbols-rounded text-6xl mb-4 block text-gray-400">sentiment_satisfied</span>
          <p className="text-gray-600 text-lg mb-2">You haven't made any choices yet</p>
          <p className="text-gray-500 text-sm">Browse items and mark what you want or don't want</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Interested Items */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="material-symbols-rounded text-2xl" style={{ color: '#FFBE0B' }}>star</span>
              <h2 className="text-2xl font-semibold text-gray-800">
                Items I Want
              </h2>
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(255, 190, 11, 0.2)', color: '#D09F00' }}>
                {interestedItems.length}
              </span>
            </div>

            {interestedItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-500">No items marked as interested yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {interestedItems.map(item => {
                    // Calculate available points for this specific item
                    const availablePoints = calculateAvailablePoints(userPoints, userClaimsArray, items, item.id)
                    
                    return (
                      <ItemCard
                        key={item.id}
                        item={item}
                        userClaim={userClaims[item.id]}
                        onClaimUpdate={loadData}
                        onDataReload={loadData}
                        profiles={profiles}
                        userPoints={availablePoints}
                      />
                    )
                  })}
                </div>

                {/* Conflict Warning */}
                {interestedItems.some(item => item.interested_count > 1) && (
                  <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: 'rgba(251, 86, 7, 0.1)', border: '1px solid rgba(251, 86, 7, 0.3)' }}>
                    <div className="flex items-start space-x-3">
                      <span className="material-symbols-rounded text-2xl" style={{ color: '#FB5607' }}>warning</span>
                      <div>
                        <h3 className="font-semibold mb-1" style={{ color: '#C44505' }}>
                          Conflicts Detected
                        </h3>
                        <p className="text-sm" style={{ color: '#9A3704' }}>
                          Some items you want are also wanted by others. Check the Conflicts page to see details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Declined Items */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="material-symbols-rounded text-2xl text-gray-600">close</span>
              <h2 className="text-2xl font-semibold text-gray-800">
                Items I've Declined
              </h2>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {declinedItems.length}
              </span>
            </div>

            {declinedItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-500">No items declined yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {declinedItems.map(item => {
                  // Calculate available points for this specific item
                  const availablePoints = calculateAvailablePoints(userPoints, userClaimsArray, items, item.id)
                  
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      userClaim={userClaims[item.id]}
                      onClaimUpdate={loadData}
                      onDataReload={loadData}
                      profiles={profiles}
                      userPoints={availablePoints}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

