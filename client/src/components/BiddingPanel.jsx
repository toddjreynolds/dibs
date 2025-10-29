import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'

export function BiddingPanel({ item, userClaim, userPoints, onBidUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [bidAmount, setBidAmount] = useState(userClaim?.bid_amount || 0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBidAmount(userClaim?.bid_amount || 0)
  }, [userClaim?.bid_amount])

  const hasBid = userClaim?.bid_amount > 0
  const availablePoints = userPoints - bidAmount

  const handleSaveBid = async () => {
    if (saving) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('claims')
        .update({ bid_amount: bidAmount })
        .eq('id', userClaim.id)

      if (error) throw error
      
      setIsEditing(false)
      if (onBidUpdate) {
        onBidUpdate()
      }
    } catch (error) {
      console.error('Error saving bid:', error)
      alert('Failed to save bid. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setBidAmount(userClaim?.bid_amount || 0)
    setIsEditing(false)
  }

  const handleBidChange = (e) => {
    const value = parseInt(e.target.value) || 0
    const maxBid = userPoints
    setBidAmount(Math.min(Math.max(0, value), maxBid))
  }

  // State 1: Initial (no bid placed)
  if (!hasBid && !isEditing) {
    return (
      <>
        <div className="bidding-overlay"></div>
        <div className="bidding-badge-center">
          <span className="material-symbols-rounded bidding-icon">loyalty</span>
        </div>
        <div className="bidding-panel">
          <button
            onClick={() => setIsEditing(true)}
            className="bidding-panel-button"
          >
            <span className="material-symbols-rounded bidding-panel-icon">loyalty</span>
            <div className="bidding-panel-content">
              <span className="bidding-panel-title">Place Your Bid</span>
              <span className="bidding-panel-subtitle">{userPoints} points available</span>
            </div>
          </button>
        </div>
      </>
    )
  }

  // State 2: Edit Mode
  if (isEditing) {
    return (
      <>
        <div className="bidding-overlay"></div>
        <div className="bidding-badge-center">
          <span className="material-symbols-rounded bidding-icon">loyalty</span>
        </div>
        <div className="bidding-panel bidding-panel-editing">
          <div className="flex items-center gap-2 mb-4" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-rounded bidding-panel-icon" style={{ marginBottom: 'auto' }}>loyalty</span>
            <div className="flex-1">
              <input
                type="text"
                value={bidAmount}
                onChange={handleBidChange}
                className="bid-input"
                style={{ height: '22px' }}
                autoFocus
              />
              <p className="bidding-panel-subtitle" style={{ marginTop: '2px' }}>{userPoints} points available</p>
            </div>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="bidding-panel-subtitle"
              style={{ opacity: 1, fontSize: '16px', fontWeight: 400, letterSpacing: '-0.32px', lineHeight: '100%', marginBottom: 'auto', paddingTop: '4px' }}
            >
              Cancel
            </button>
          </div>
          <button
            onClick={handleSaveBid}
            disabled={saving}
            className="w-full bg-[#FF006E] text-white py-3 px-3 rounded-lg font-bold text-base hover:bg-[#E0005E] transition disabled:opacity-50"
            style={{ letterSpacing: '-0.32px', lineHeight: '74%' }}
          >
            {saving ? 'Saving...' : 'Save Bid'}
          </button>
        </div>
      </>
    )
  }

  // State 3: Bid Placed
  return (
    <>
      <div className="bidding-overlay"></div>
      <div className="bidding-badge-center">
        <span className="material-symbols-rounded bidding-icon">loyalty</span>
      </div>
      <div className="bidding-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded bidding-panel-icon">loyalty</span>
            <div className="bidding-panel-content">
              <span className="bidding-panel-title" style={{ color: '#000' }}>{bidAmount} points</span>
              <span className="bidding-panel-subtitle">{availablePoints} points available</span>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="bidding-panel-subtitle"
            style={{ opacity: 1, fontSize: '16px', fontWeight: 400, letterSpacing: '-0.32px', lineHeight: '100%' }}
          >
            Edit
          </button>
        </div>
      </div>
    </>
  )
}
