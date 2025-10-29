import { useEffect } from 'react'
import { supabase } from '../api/supabase'
import { checkAndResolveItem } from '../utils/itemResolution'
import { isExpired } from '../utils/timerUtils'

/**
 * Hook to check for expired items and trigger resolution
 * Runs every minute to check active items
 */
export function useExpirationChecker() {
  useEffect(() => {
    const checkExpiredItems = async () => {
      try {
        // Fetch all active items
        const { data: items, error } = await supabase
          .from('items')
          .select('id, expires_at')
          .eq('status', 'active')

        if (error) throw error

        // Check each item for expiration
        for (const item of items) {
          if (item.expires_at && isExpired(item.expires_at)) {
            await checkAndResolveItem(item.id)
          }
        }
      } catch (error) {
        console.error('Error checking expired items:', error)
      }
    }

    // Check immediately on mount
    checkExpiredItems()

    // Check every minute
    const interval = setInterval(checkExpiredItems, 60000)

    return () => clearInterval(interval)
  }, [])
}

