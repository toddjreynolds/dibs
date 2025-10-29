/**
 * Get a user's couple partner from profiles list
 * @param {string} userId - The user's ID
 * @param {Array} profiles - Array of profile objects
 * @returns {object|null} - Partner's profile or null if no couple
 */
export function getCouplePartner(userId, profiles) {
  const userProfile = profiles.find(p => p.id === userId)
  if (!userProfile?.couple_id) return null
  
  const partner = profiles.find(
    p => p.id !== userId && p.couple_id === userProfile.couple_id
  )
  return partner || null
}

/**
 * Get display name for a user or couple
 * @param {object} user - The user's profile
 * @param {object|null} partner - Partner's profile if coupled
 * @returns {string} - Display name (e.g., "John" or "John & Jane")
 */
export function getCoupleDisplayName(user, partner) {
  if (!partner) return user.first_name || user.full_name
  
  // Always display in alphabetical order for consistency
  const names = [user.first_name || user.full_name, partner.first_name || partner.full_name].sort()
  return `${names[0]} & ${names[1]}`
}

/**
 * Check if two users are a couple
 * @param {string} userId1 - First user's ID
 * @param {string} userId2 - Second user's ID
 * @param {Array} profiles - Array of profile objects
 * @returns {boolean} - True if they are a couple
 */
export function areCoupled(userId1, userId2, profiles) {
  const user1 = profiles.find(p => p.id === userId1)
  const user2 = profiles.find(p => p.id === userId2)
  
  if (!user1?.couple_id || !user2?.couple_id) return false
  
  return user1.couple_id === user2.couple_id
}

/**
 * Get claims for a couple (aggregates both partners' claims)
 * @param {object} item - The item with claims array
 * @param {string} coupleId - The couple_id to look for
 * @param {Array} profiles - Array of profile objects
 * @returns {Array} - Array of claims from either partner
 */
export function getCoupleClaims(item, coupleId, profiles) {
  if (!coupleId) return []
  
  const coupleUserIds = profiles
    .filter(p => p.couple_id === coupleId)
    .map(p => p.id)
  
  return (item.claims || []).filter(claim => 
    coupleUserIds.includes(claim.user_id)
  )
}

/**
 * Group interested users by couple
 * Returns array of groups where each group is either a single user or a couple
 * @param {Array} claims - Array of claims with status 'interested'
 * @param {Array} profiles - Array of profile objects
 * @returns {Array} - Array of groups [{userIds: [id1, id2?], profiles: [profile1, profile2?]}]
 */
export function groupInterestedByCouples(claims, profiles) {
  const interestedClaims = claims.filter(c => c.status === 'interested')
  const processedUserIds = new Set()
  const groups = []
  
  interestedClaims.forEach(claim => {
    if (processedUserIds.has(claim.user_id)) return
    
    const userProfile = profiles.find(p => p.id === claim.user_id)
    if (!userProfile) return
    
    processedUserIds.add(claim.user_id)
    
    // Check if user has a partner in the interested list
    if (userProfile.couple_id) {
      const partner = profiles.find(
        p => p.id !== claim.user_id && p.couple_id === userProfile.couple_id
      )
      
      if (partner && interestedClaims.some(c => c.user_id === partner.id)) {
        // Found a couple
        processedUserIds.add(partner.id)
        groups.push({
          userIds: [userProfile.id, partner.id],
          profiles: [userProfile, partner],
          isCouple: true
        })
        return
      }
    }
    
    // Single user (no partner or partner not interested)
    groups.push({
      userIds: [userProfile.id],
      profiles: [userProfile],
      isCouple: false
    })
  })
  
  return groups
}

