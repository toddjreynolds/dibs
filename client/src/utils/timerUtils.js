/**
 * Calculate expiration time for an item
 * Items expire 7 days from upload at 7pm
 * @param {string|Date} createdAt - The item's creation timestamp
 * @returns {Date} - The expiration timestamp
 */
export function calculateExpiresAt(createdAt) {
  const uploadDate = new Date(createdAt)
  
  // Add 7 days
  const expirationDate = new Date(uploadDate)
  expirationDate.setDate(expirationDate.getDate() + 7)
  
  // Set to 7pm (19:00)
  expirationDate.setHours(19, 0, 0, 0)
  
  return expirationDate
}

/**
 * Get time remaining until expiration in milliseconds
 * @param {string|Date} expiresAt - The expiration timestamp
 * @returns {number} - Milliseconds until expiration (negative if expired)
 */
export function getTimeRemaining(expiresAt) {
  const expiration = new Date(expiresAt)
  const now = new Date()
  return expiration.getTime() - now.getTime()
}

/**
 * Check if an item is expired
 * @param {string|Date} expiresAt - The expiration timestamp
 * @returns {boolean} - True if expired
 */
export function isExpired(expiresAt) {
  return getTimeRemaining(expiresAt) <= 0
}

/**
 * Format time remaining for display
 * @param {string|Date} expiresAt - The expiration timestamp
 * @returns {string} - Formatted time string (e.g., "5 days", "12 hours", "45 minutes")
 */
export function formatTimeRemaining(expiresAt) {
  const msRemaining = getTimeRemaining(expiresAt)
  
  if (msRemaining <= 0) {
    return 'Expired'
  }
  
  const totalMinutes = Math.floor(msRemaining / (1000 * 60))
  const totalHours = Math.floor(msRemaining / (1000 * 60 * 60))
  const totalDays = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
  
  // Last hour: show minutes
  if (totalHours < 1) {
    return totalMinutes === 1 ? '1 minute' : `${totalMinutes} minutes`
  }
  
  // Last day (24 hours to 1 hour): show hours
  if (totalDays < 1) {
    return totalHours === 1 ? '1 hour' : `${totalHours} hours`
  }
  
  // 2-8 days: show days (rounded up)
  return totalDays === 1 ? '1 day' : `${totalDays} days`
}

