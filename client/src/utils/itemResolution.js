import { supabase } from '../api/supabase'
import { groupInterestedByCouples } from './coupleUtils'

/**
 * Check if an item should be resolved and resolve it
 * @param {string} itemId - The item's ID
 * @returns {Promise<object|null>} - Resolution result or null if not resolved
 */
export async function checkAndResolveItem(itemId) {
  try {
    // Fetch item with all claims and profiles
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select(`
        *,
        claims!claims_item_id_fkey(id, user_id, status, bid_amount)
      `)
      .eq('id', itemId)
      .single()

    if (itemError) throw itemError
    if (item.status !== 'active') return null

    // Fetch all profiles to handle couples
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    if (profilesError) throw profilesError

    const claims = item.claims || []
    const interestedClaims = claims.filter(c => c.status === 'interested')
    const declinedClaims = claims.filter(c => c.status === 'declined')
    
    // Group interested users by couples
    const interestedGroups = groupInterestedByCouples(interestedClaims, profiles)

    // Get all eligible users (everyone can claim any item, including uploader)
    const eligibleUserIds = profiles.map(p => p.id)

    // Get all user IDs that have acted
    const actedUserIds = new Set([
      ...interestedClaims.map(c => c.user_id),
      ...declinedClaims.map(c => c.user_id)
    ])

    // Group eligible users by couples to count total groups
    const eligibleCoupleIds = new Set()
    const eligibleSingleUserIds = new Set()
    
    eligibleUserIds.forEach(userId => {
      const user = profiles.find(p => p.id === userId)
      if (user?.couple_id) {
        eligibleCoupleIds.add(user.couple_id)
      } else {
        eligibleSingleUserIds.add(userId)
      }
    })

    // Count how many eligible groups have acted
    let actedGroups = 0
    let totalEligibleGroups = eligibleSingleUserIds.size

    // Count couple groups that have acted
    eligibleCoupleIds.forEach(coupleId => {
      const coupleUsers = profiles.filter(p => p.couple_id === coupleId)
      totalEligibleGroups++
      if (coupleUsers.some(u => actedUserIds.has(u.id))) {
        actedGroups++
      }
    })

    // Count single users that have acted
    eligibleSingleUserIds.forEach(userId => {
      if (actedUserIds.has(userId)) {
        actedGroups++
      }
    })

    const allEligibleUsersActed = actedGroups === totalEligibleGroups

    // Resolution logic
    let resolution = null

    // Rule 3: All eligible users passed → immediate donation
    if (!resolution && allEligibleUsersActed && interestedClaims.length === 0) {
      resolution = { status: 'donated', winner_id: null }
    }
    
    // Rule 4: Expires with no dibs → donation
    if (!resolution && interestedClaims.length === 0 && declinedClaims.length === 0) {
      const now = new Date()
      const expiresAt = new Date(item.expires_at)
      if (now >= expiresAt) {
        resolution = { status: 'donated', winner_id: null }
      }
    }

    // Rule 2 & Rule 1: Solo dibs (one group interested)
    if (!resolution && interestedGroups.length === 1) {
      // Rule 2: If all eligible users have acted, resolve immediately
      if (allEligibleUsersActed) {
        const winnerId = interestedGroups[0].userIds[0] // Use first user ID (couples share wins)
        resolution = { status: 'resolved', winner_id: winnerId }
      }
      
      // Rule 1: If item expired with solo dibs (even if not all users acted), award it
      if (!resolution) {
        const now = new Date()
        const expiresAt = new Date(item.expires_at)
        
        if (now >= expiresAt) {
          const winnerId = interestedGroups[0].userIds[0]
          resolution = { status: 'resolved', winner_id: winnerId }
        }
      }
    }

    // Rule 5 & Rule 6: Conflict at expiration → highest bidder wins
    if (!resolution && interestedGroups.length > 1) {
      const now = new Date()
      const expiresAt = new Date(item.expires_at)
      
      if (now >= expiresAt) {
        // Find highest bid among groups
        const groupBids = interestedGroups.map(group => {
          // For couples, use the max bid between partners
          const bids = group.userIds.map(userId => {
            const claim = interestedClaims.find(c => c.user_id === userId)
            return claim?.bid_amount || 0
          })
          return {
            group,
            maxBid: Math.max(...bids)
          }
        })

        // Sort by bid amount (descending)
        groupBids.sort((a, b) => b.maxBid - a.maxBid)
        
        const highestBid = groupBids[0].maxBid
        const tiedGroups = groupBids.filter(g => g.maxBid === highestBid)

        if (tiedGroups.length > 1) {
          // Tie: extend expires_at by 24 hours
          const newExpiresAt = new Date(expiresAt)
          newExpiresAt.setHours(newExpiresAt.getHours() + 24)
          
          await supabase
            .from('items')
            .update({ expires_at: newExpiresAt.toISOString() })
            .eq('id', itemId)

          return { type: 'extended', new_expires_at: newExpiresAt }
        } else {
          // Winner found
          const winnerId = groupBids[0].group.userIds[0]
          resolution = { status: 'resolved', winner_id: winnerId, bid: highestBid }
        }
      }
    }

    // Apply resolution if determined
    if (resolution) {
      const { error: updateError } = await supabase
        .from('items')
        .update({
          status: resolution.status,
          winner_id: resolution.winner_id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (updateError) throw updateError

      // Deduct points from winner if they bid
      if (resolution.winner_id && resolution.bid > 0) {
        const winnerProfile = profiles.find(p => p.id === resolution.winner_id)
        if (winnerProfile) {
          await supabase
            .from('profiles')
            .update({ points: winnerProfile.points - resolution.bid })
            .eq('id', resolution.winner_id)

          // If winner has a partner, update their points too (shared pool)
          if (winnerProfile.couple_id) {
            await supabase
              .from('profiles')
              .update({ points: winnerProfile.points - resolution.bid })
              .eq('couple_id', winnerProfile.couple_id)
              .neq('id', resolution.winner_id)
          }
        }
      }

      return resolution
    }

    return null
  } catch (error) {
    console.error('Error checking/resolving item:', error)
    return null
  }
}

