export function BiddingPanel({ item, userClaim, userPoints, onEdit }) {
  const hasBid = userClaim?.bid_amount > 0
  const currentBid = userClaim?.bid_amount || 0

  const handleClick = (e) => {
    e.stopPropagation()
    onEdit()
  }

  // State 1: Initial (no bid placed)
  if (!hasBid) {
    return (
      <>
        <div className="bidding-overlay"></div>
        <div className="bidding-badge-center" onClick={handleClick} style={{ cursor: 'pointer' }}>
          <span className="material-symbols-rounded bidding-icon">loyalty</span>
        </div>
        <div className="bidding-panel">
          <button
            onClick={handleClick}
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

  // State 2: Bid Placed - Show small badge
  return (
    <>
      <div className="bidding-overlay"></div>
      <div className="bidding-badge-center" onClick={handleClick} style={{ cursor: 'pointer' }}>
        <span className="material-symbols-rounded bidding-icon">loyalty</span>
      </div>
      <div 
        className="user-bid-badge"
        onClick={handleClick}
      >
        You bid {currentBid} points
      </div>
    </>
  )
}
