import { useState, useEffect, useCallback, useRef } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { supabase } from '../api/supabase'

export function PlaceBidModal({ isOpen, onClose, currentBid, availablePoints, userClaim, itemId, onSave }) {
  const [bidAmount, setBidAmount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [fetchingClaim, setFetchingClaim] = useState(false)
  const claimIdRef = useRef(null)

  // Prepopulate with current bid amount and fetch claim ID if needed
  useEffect(() => {
    if (isOpen) {
      setBidAmount(currentBid || 0)
      
      // If we have the claim ID, use it
      if (userClaim?.id) {
        claimIdRef.current = userClaim.id
      } else if (itemId) {
        // Otherwise, fetch the claim from the database
        const fetchClaimId = async () => {
          setFetchingClaim(true)
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
              console.error('No authenticated user found')
              return
            }
            
            const { data, error } = await supabase
              .from('claims')
              .select('id')
              .eq('item_id', itemId)
              .eq('user_id', user.id)
              .single()

            if (error) {
              console.error('Error fetching claim:', error)
            } else if (data?.id) {
              claimIdRef.current = data.id
            }
          } catch (err) {
            console.error('Error in fetchClaimId:', err)
          } finally {
            setFetchingClaim(false)
          }
        }
        
        fetchClaimId()
      }
    }
  }, [isOpen, currentBid, userClaim, itemId])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setBidAmount(0)
      setShowSuccess(false)
      setIsClosing(false)
      setFetchingClaim(false)
      claimIdRef.current = null
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !saving && !fetchingClaim && isOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [saving, fetchingClaim, isOpen, handleClose])

  const handleBidChange = (value) => {
    const numValue = typeof value === 'number' ? value : parseInt(value) || 0
    const currentBidValue = currentBid || 0
    const maxBid = (availablePoints || 0) + currentBidValue
    setBidAmount(Math.min(Math.max(0, numValue), maxBid))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const bidValue = bidAmount || 0
    const currentBidValue = currentBid || 0
    const maxBid = (availablePoints || 0) + currentBidValue
    
    if (bidValue < 0) {
      alert('Bid amount must be non-negative')
      return
    }
    
    if (bidValue > maxBid) {
      alert(`Bid amount cannot exceed ${maxBid} total points`)
      return
    }

    const claimId = claimIdRef.current || userClaim?.id
    
    if (!claimId) {
      alert('Unable to find your claim. Please close this modal and try again. If the problem persists, try refreshing the page.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('claims')
        .update({ bid_amount: bidValue })
        .eq('id', claimId)

      if (error) throw error
      
      // Show success message
      setShowSuccess(true)
      
      // Call onSave callback to refresh data
      if (onSave) {
        await onSave()
      }
      
      // Close modal after brief delay with animation
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (error) {
      console.error('Error saving bid:', error)
      alert(`Failed to save bid: ${error.message}`)
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`bg-white rounded-xl shadow-2xl max-w-md w-full pointer-events-auto transition-all duration-300 ${
            isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-2xl font-bold text-gray-800">Place Your Bid</h2>
            <button
              onClick={handleClose}
              disabled={saving || fetchingClaim}
              className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-rounded text-3xl">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {showSuccess ? (
              <div className="text-center py-12">
                <span className="material-symbols-rounded text-6xl text-green-500 mb-4 block">
                  check_circle
                </span>
                <p className="text-xl font-semibold text-gray-800">
                  Bid saved!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  {/* Large Bid Display */}
                  <div className="text-center">
                    <div className="text-6xl font-bold text-black" style={{ marginBottom: 0 }}>
                      {bidAmount}
                    </div>
                    <div className="text-base text-gray-500">
                      points
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="space-y-2">
                    <div className="bid-slider-wrapper" style={{ marginLeft: '16px', marginRight: '16px' }}>
                      <Slider
                        min={0}
                        max={(availablePoints || 0) + (currentBid || 0)}
                        step={1}
                        value={bidAmount}
                        onChange={handleBidChange}
                        disabled={saving || fetchingClaim}
                      />
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      {(availablePoints || 0) + (currentBid || 0)} points available
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving || fetchingClaim}
                    className="w-full bg-[#FF006E] text-white rounded-lg font-bold hover:bg-[#E0005E] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: '18px', letterSpacing: '-0.4px', lineHeight: '74%', padding: '14px 12px' }}
                  >
                    {fetchingClaim ? 'Loading...' : saving ? 'Saving...' : 'Save Your Bid'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

