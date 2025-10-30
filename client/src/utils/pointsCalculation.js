/**
 * Calculate available points for bidding, accounting for outstanding bids on other items
 * @param {number} totalPoints - User's total points from profile
 * @param {Array} allClaims - All of the user's claims
 * @param {Array} allItems - All items with their claims data
 * @param {string} currentItemId - The item being bid on (optional, to exclude from calculation)
 * @returns {number} Available points for bidding
 */
export function calculateAvailablePoints(totalPoints, allClaims, allItems, currentItemId = null) {
  // Sum up all outstanding bids on conflict items (excluding current item if editing)
  let outstandingBids = 0
  
  allClaims.forEach(claim => {
    // Skip if this is the current item being edited
    if (claim.item_id === currentItemId) {
      return
    }
    
    // Only count bids on items that are in conflict
    const item = allItems.find(i => i.id === claim.item_id)
    if (item && claim.status === 'interested') {
      // Check if item is in conflict (more than 1 interested party)
      const hasConflict = item.interested_count > 1
      if (hasConflict && claim.bid_amount > 0) {
        outstandingBids += claim.bid_amount
      }
    }
  })
  
  return totalPoints - outstandingBids
}

