import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'

export function BiddingPanel({ item, userClaim, userPoints, onBidUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [bidAmount, setBidAmount] = useState(userClaim?.bid_amount || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBidAmount(userClaim?.bid_amount || '')
  }, [userClaim?.bid_amount])

  const hasBid = userClaim?.bid_amount > 0
  const currentBid = bidAmount === '' ? 0 : parseInt(bidAmount)
  const availablePoints = userPoints - currentBid

  const handleSaveBid = async () => {
    if (saving) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('claims')
        .update({ bid_amount: currentBid })
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
    setBidAmount(userClaim?.bid_amount || '')
    setIsEditing(false)
  }

  const handleBidChange = (e) => {
    const value = e.target.value
    if (value === '') {
      setBidAmount('')
      return
    }
    const numValue = parseInt(value) || 0
    const maxBid = userPoints
    setBidAmount(Math.min(Math.max(0, numValue), maxBid).toString())
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
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-rounded bidding-panel-icon">loyalty</span>
            <div className="flex-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={bidAmount}
                onChange={handleBidChange}
                className="bid-input"
                style={{ height: '22px', borderBottomColor: '#FF006E' }}
                autoFocus
              />
              <p className="bidding-panel-subtitle" style={{ marginTop: '2px' }}>{userPoints} points available</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              style={{ letterSpacing: '-0.32px', lineHeight: '12px', height: '36px', fontSize: '14px', padding: '8px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBid}
              disabled={saving}
              className="flex-1 bg-[#FF006E] text-white rounded-lg font-bold hover:bg-[#E0005E] transition disabled:opacity-50"
              style={{ letterSpacing: '-0.32px', lineHeight: '12px', height: '36px', fontSize: '14px', padding: '8px' }}
            >
              {saving ? 'Saving...' : 'Save Bid'}
            </button>
          </div>
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
