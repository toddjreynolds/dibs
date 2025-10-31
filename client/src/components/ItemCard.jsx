import { useState } from 'react'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../utils/AuthContext'
import { TimerBadge } from './TimerBadge'
import { InterestedUsersBadges } from './InterestedUsersBadges'
import { BiddingPanel } from './BiddingPanel'
import { PlaceBidModal } from './PlaceBidModal'
import { checkAndResolveItem } from '../utils/itemResolution'
import { groupInterestedByCouples } from '../utils/coupleUtils'

export function ItemCard({ item, userClaim, onClaimUpdate, onDataReload, profiles, userPoints, currentSection }) {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)

  const handleClaim = async (status) => {
    if (loading) return
    
    // Optimistic update - update UI immediately
    onClaimUpdate(item.id, status, userClaim)
    
    setLoading(true)

    try {
      if (userClaim) {
        // Update existing claim
        if (userClaim.status === status) {
          // Remove claim if clicking same status
          const { error } = await supabase
            .from('claims')
            .delete()
            .eq('id', userClaim.id)

          if (error) throw error
        } else {
          // Update to new status
          const { error } = await supabase
            .from('claims')
            .update({ status })
            .eq('id', userClaim.id)

          if (error) throw error
        }
      } else {
        // Create new claim
        const { error } = await supabase
          .from('claims')
          .insert({
            item_id: item.id,
            user_id: user.id,
            status,
          })

        if (error) throw error
      }
      // Database update succeeded - real-time subscription will sync any changes
      
      // Check if item should be resolved
      await checkAndResolveItem(item.id)
    } catch (error) {
      console.error('Error updating claim:', error)
      alert('Failed to update claim. Please try again.')
      // TODO: Revert optimistic update on error
    } finally {
      setLoading(false)
    }
  }

  const handleBidUpdate = async () => {
    // Reload data from server after bid is saved
    if (onDataReload) {
      await onDataReload()
    }
  }

  const currentBid = userClaim?.bid_amount || 0
  const availablePoints = (userPoints || 100) - currentBid

  const interestedCount = item.interested_count || 0
  const interestedGroups = groupInterestedByCouples(item.claims || [], profiles || [])
  const hasConflict = interestedGroups.length > 1
  const isInterested = userClaim?.status === 'interested'
  const isDeclined = userClaim?.status === 'declined'
  const isInConflict = hasConflict && isInterested

  return (
    <div className="item-card" style={currentSection === 'donation' ? { paddingBottom: 0 } : undefined}>
      {/* Image */}
      <div className="item-image-container">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name || 'Item'}
            className="item-image"
            style={currentSection === 'donation' ? { opacity: 0.6 } : undefined}
          />
        ) : (
          <div className="item-image-placeholder">
            <span className="material-symbols-rounded text-6xl">inventory_2</span>
          </div>
        )}
        
        {/* Timer Badge - top right */}
        {currentSection !== 'donation' && (
          <TimerBadge expiresAt={item.expires_at} />
        )}

        {/* Interested Users Badges - top left (only in conflict) */}
        {isInConflict && currentSection !== 'donation' && (
          <InterestedUsersBadges claims={item.claims || []} profiles={profiles || []} />
        )}

        {/* Bidding Panel for Conflict State */}
        {isInConflict && currentSection !== 'donation' && (
          <BiddingPanel
            item={item}
            userClaim={userClaim}
            userPoints={userPoints || 100}
            onEdit={() => setIsBidModalOpen(true)}
          />
        )}

        {/* Purple Overlay for Interested State (not in conflict) */}
        {isInterested && !isInConflict && currentSection !== 'donation' && (
          <div className="interested-overlay"></div>
        )}

        {/* White Overlay for Declined State */}
        {isDeclined && currentSection !== 'donation' && (
          <div className="declined-overlay"></div>
        )}

        {/* Centered Badge for Interested State (not in conflict) */}
        {isInterested && !isInConflict && currentSection !== 'donation' && (
          <div className="interested-badge">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 34.0696C19.6667 34.0696 19.331 34.0093 18.993 33.8887C18.6552 33.7685 18.3613 33.5833 18.1113 33.3333L15.6805 31.0971C12.4027 28.0693 9.52548 25.1457 7.04882 22.3262C4.57179 19.5068 3.33337 16.5092 3.33337 13.3333C3.33337 10.7964 4.18521 8.67604 5.88888 6.97209C7.59274 5.26852 9.70385 4.41667 12.2221 4.41667C13.6574 4.41667 15.0556 4.74758 16.4167 5.40963C17.7778 6.07185 18.9723 7.10194 20 8.5C21.1203 7.10194 22.3332 6.07185 23.6388 5.40963C24.9443 4.74758 26.3241 4.41667 27.778 4.41667C30.2963 4.41667 32.4074 5.26852 34.1113 6.97209C35.8149 8.67604 36.6667 10.7964 36.6667 13.3333C36.6667 16.5092 35.4306 19.5092 32.9584 22.3333C30.4862 25.1575 27.6018 28.0835 24.3055 31.1112L21.8888 33.3333C21.6388 33.5833 21.3449 33.7685 21.0071 33.8887C20.6691 34.0093 20.3334 34.0696 20 34.0696Z" fill="#8338EC"/>
            </svg>
          </div>
        )}

        {/* Centered Badge for Declined State */}
        {isDeclined && currentSection !== 'donation' && (
          <div className="declined-badge">
            <span className="material-symbols-rounded declined-badge-icon">delete</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {currentSection !== 'donation' && (
        <div className="card-actions">
          <button
            onClick={() => handleClaim('interested')}
            disabled={loading}
            className={`action-btn ${isInterested && isInConflict ? 'dibs-btn-conflict' : isInterested ? 'dibs-btn-active' : 'dibs-btn'}`}
          >
            {isInterested && isInConflict ? (
              <span className="material-symbols-rounded action-icon">loyalty</span>
            ) : isInterested ? (
              <span className="material-symbols-rounded action-icon" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            ) : (
              <span className="material-symbols-rounded action-icon" style={{ fontVariationSettings: "'FILL' 0" }}>favorite</span>
            )}
            <span className="action-label">{isInterested ? 'Dibbed!' : 'Dibs!'}</span>
          </button>

          <button
            onClick={() => handleClaim('declined')}
            disabled={loading}
            className={`action-btn ${isDeclined ? 'pass-btn-active' : 'pass-btn'}`}
          >
            <span className="material-symbols-rounded action-icon">delete</span>
            <span className="action-label">{isDeclined ? 'Passed' : 'Pass'}</span>
          </button>
        </div>
      )}

      {/* Place Bid Modal */}
      {isInConflict && currentSection !== 'donation' && (
        <PlaceBidModal
          isOpen={isBidModalOpen}
          onClose={() => setIsBidModalOpen(false)}
          currentBid={userClaim?.bid_amount}
          availablePoints={availablePoints}
          userClaim={userClaim}
          onSave={handleBidUpdate}
        />
      )}
    </div>
  )
}
