import { useState } from 'react'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../utils/AuthContext'
import { TimerBadge } from './TimerBadge'
import { InterestedUsersBadges } from './InterestedUsersBadges'
import { BiddingPanel } from './BiddingPanel'
import { checkAndResolveItem } from '../utils/itemResolution'
import { groupInterestedByCouples } from '../utils/coupleUtils'

export function ItemCard({ item, userClaim, onClaimUpdate, onDataReload, profiles, userPoints }) {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)

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

  const interestedCount = item.interested_count || 0
  const interestedGroups = groupInterestedByCouples(item.claims || [], profiles || [])
  const hasConflict = interestedGroups.length > 1
  const isInterested = userClaim?.status === 'interested'
  const isDeclined = userClaim?.status === 'declined'
  const isInConflict = hasConflict && isInterested

  return (
    <div className="item-card">
      {/* Image */}
      <div className="item-image-container">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name || 'Item'}
            className="item-image"
          />
        ) : (
          <div className="item-image-placeholder">
            <span className="material-symbols-rounded text-6xl">inventory_2</span>
          </div>
        )}
        
        {/* Timer Badge - top right */}
        <TimerBadge expiresAt={item.expires_at} />
        
        {/* Interested Users Badges - top left (only in conflict) */}
        {isInConflict && (
          <InterestedUsersBadges claims={item.claims || []} profiles={profiles || []} />
        )}
        
        {/* Bidding Panel for Conflict State */}
        {isInConflict && (
          <BiddingPanel
            item={item}
            userClaim={userClaim}
            userPoints={userPoints || 100}
            onBidUpdate={handleBidUpdate}
          />
        )}
        
        {/* Purple Overlay for Interested State (not in conflict) */}
        {isInterested && !isInConflict && (
          <div className="interested-overlay"></div>
        )}

        {/* White Overlay for Declined State */}
        {isDeclined && (
          <div className="declined-overlay"></div>
        )}

        {/* Centered Badge for Interested State (not in conflict) */}
        {isInterested && !isInConflict && (
          <div className="interested-badge">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 34.0696C19.6667 34.0696 19.331 34.0093 18.993 33.8887C18.6552 33.7685 18.3613 33.5833 18.1113 33.3333L15.6805 31.0971C12.4027 28.0693 9.52548 25.1457 7.04882 22.3262C4.57179 19.5068 3.33337 16.5092 3.33337 13.3333C3.33337 10.7964 4.18521 8.67604 5.88888 6.97209C7.59274 5.26852 9.70385 4.41667 12.2221 4.41667C13.6574 4.41667 15.0556 4.74758 16.4167 5.40963C17.7778 6.07185 18.9723 7.10194 20 8.5C21.1203 7.10194 22.3332 6.07185 23.6388 5.40963C24.9443 4.74758 26.3241 4.41667 27.778 4.41667C30.2963 4.41667 32.4074 5.26852 34.1113 6.97209C35.8149 8.67604 36.6667 10.7964 36.6667 13.3333C36.6667 16.5092 35.4306 19.5092 32.9584 22.3333C30.4862 25.1575 27.6018 28.0835 24.3055 31.1112L21.8888 33.3333C21.6388 33.5833 21.3449 33.7685 21.0071 33.8887C20.6691 34.0093 20.3334 34.0696 20 34.0696Z" fill="#8338EC"/>
            </svg>
          </div>
        )}

        {/* Centered Badge for Declined State */}
        {isDeclined && (
          <div className="declined-badge">
            <span className="material-symbols-rounded declined-badge-icon">delete</span>
          </div>
        )}
        
        {/* Conflict Badge (only when viewing but not interested) */}
        {hasConflict && !isInterested && !isDeclined && (
          <div className="conflict-badge">
            <span className="material-symbols-rounded text-sm">warning</span>
            <span>{interestedGroups.length} want this</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="card-actions">
        <button
          onClick={() => handleClaim('interested')}
          disabled={loading}
          className={`action-btn ${isInterested && isInConflict ? 'dibs-btn-conflict' : isInterested ? 'dibs-btn-active' : 'dibs-btn'}`}
        >
          {isInterested && isInConflict ? (
            <span className="material-symbols-rounded action-icon">loyalty</span>
          ) : isInterested ? (
            <svg className="action-icon" width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 17.675C9.76667 17.675 9.52917 17.6333 9.2875 17.55C9.04583 17.4667 8.83333 17.3333 8.65 17.15L6.925 15.575C5.15833 13.9583 3.5625 12.3542 2.1375 10.7625C0.7125 9.17083 0 7.41667 0 5.5C0 3.93333 0.525 2.625 1.575 1.575C2.625 0.525 3.93333 0 5.5 0C6.38333 0 7.21667 0.1875 8 0.5625C8.78333 0.9375 9.45 1.45 10 2.1C10.55 1.45 11.2167 0.9375 12 0.5625C12.7833 0.1875 13.6167 0 14.5 0C16.0667 0 17.375 0.525 18.425 1.575C19.475 2.625 20 3.93333 20 5.5C20 7.41667 19.2917 9.175 17.875 10.775C16.4583 12.375 14.85 13.9833 13.05 15.6L11.35 17.15C11.1667 17.3333 10.9542 17.4667 10.7125 17.55C10.4708 17.6333 10.2333 17.675 10 17.675Z" fill="currentColor"/>
            </svg>
          ) : (
            <svg className="action-icon" width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 17.675C9.76667 17.675 9.52917 17.6333 9.2875 17.55C9.04583 17.4667 8.83333 17.3333 8.65 17.15L6.925 15.575C5.15833 13.9583 3.5625 12.3542 2.1375 10.7625C0.7125 9.17083 0 7.41667 0 5.5C0 3.93333 0.525 2.625 1.575 1.575C2.625 0.525 3.93333 0 5.5 0C6.38333 0 7.21667 0.1875 8 0.5625C8.78333 0.9375 9.45 1.45 10 2.1C10.55 1.45 11.2167 0.9375 12 0.5625C12.7833 0.1875 13.6167 0 14.5 0C16.0667 0 17.375 0.525 18.425 1.575C19.475 2.625 20 3.93333 20 5.5C20 7.41667 19.2917 9.175 17.875 10.775C16.4583 12.375 14.85 13.9833 13.05 15.6L11.35 17.15C11.1667 17.3333 10.9542 17.4667 10.7125 17.55C10.4708 17.6333 10.2333 17.675 10 17.675ZM9.05 4.1C8.56667 3.41667 8.05 2.89583 7.5 2.5375C6.95 2.17917 6.28333 2 5.5 2C4.5 2 3.66667 2.33333 3 3C2.33333 3.66667 2 4.5 2 5.5C2 6.36667 2.30833 7.2875 2.925 8.2625C3.54167 9.2375 4.27917 10.1833 5.1375 11.1C5.99583 12.0167 6.87917 12.875 7.7875 13.675C8.69583 14.475 9.43333 15.1333 10 15.65C10.5667 15.1333 11.3042 14.475 12.2125 13.675C13.1208 12.875 14.0042 12.0167 14.8625 11.1C15.7208 10.1833 16.4583 9.2375 17.075 8.2625C17.6917 7.2875 18 6.36667 18 5.5C18 4.5 17.6667 3.66667 17 3C16.3333 2.33333 15.5 2 14.5 2C13.7167 2 13.05 2.17917 12.5 2.5375C11.95 2.89583 11.4333 3.41667 10.95 4.1C10.8333 4.26667 10.6917 4.39167 10.525 4.475C10.3583 4.55833 10.1833 4.6 10 4.6C9.81667 4.6 9.64167 4.55833 9.475 4.475C9.30833 4.39167 9.16667 4.26667 9.05 4.1Z" fill="currentColor"/>
            </svg>
          )}
          <span className="action-label">{isInterested ? 'Dibbed!' : 'Dibs!'}</span>
        </button>
        
        <button
          onClick={() => handleClaim('declined')}
          disabled={loading}
          className={`action-btn ${isDeclined ? 'pass-btn-active' : 'pass-btn'}`}
        >
          <svg className="action-icon" width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3C0.716667 3 0.479167 2.90417 0.2875 2.7125C0.0958333 2.52083 0 2.28333 0 2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1H5C5 0.716667 5.09583 0.479167 5.2875 0.2875C5.47917 0.0958333 5.71667 0 6 0H10C10.2833 0 10.5208 0.0958333 10.7125 0.2875C10.9042 0.479167 11 0.716667 11 1H15C15.2833 1 15.5208 1.09583 15.7125 1.2875C15.9042 1.47917 16 1.71667 16 2C16 2.28333 15.9042 2.52083 15.7125 2.7125C15.5208 2.90417 15.2833 3 15 3V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3ZM13 3H3V16H13V3ZM6 14C6.28333 14 6.52083 13.9042 6.7125 13.7125C6.90417 13.5208 7 13.2833 7 13V6C7 5.71667 6.90417 5.47917 6.7125 5.2875C6.52083 5.09583 6.28333 5 6 5C5.71667 5 5.47917 5.09583 5.2875 5.2875C5.09583 5.47917 5 5.71667 5 6V13C5 13.2833 5.09583 13.5208 5.2875 13.7125C5.47917 13.9042 5.71667 14 6 14ZM10 14C10.2833 14 10.5208 13.9042 10.7125 13.7125C10.9042 13.5208 11 13.2833 11 13V6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6V13C9 13.2833 9.09583 13.5208 9.2875 13.7125C9.47917 13.9042 9.71667 14 10 14Z" fill="currentColor"/>
          </svg>
          <span className="action-label">{isDeclined ? 'Passed' : 'Pass'}</span>
        </button>
      </div>
    </div>
  )
}
