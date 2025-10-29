import { useState, useEffect } from 'react'
import { formatTimeRemaining, isExpired } from '../utils/timerUtils'

export function TimerBadge({ expiresAt }) {
  const [timeDisplay, setTimeDisplay] = useState('')

  useEffect(() => {
    if (!expiresAt) return

    // Update immediately
    const updateDisplay = () => {
      setTimeDisplay(formatTimeRemaining(expiresAt))
    }
    
    updateDisplay()

    // Update every minute
    const interval = setInterval(updateDisplay, 60000)

    return () => clearInterval(interval)
  }, [expiresAt])

  if (!expiresAt || isExpired(expiresAt)) {
    return null
  }

  return (
    <div className="timer-badge">
      <span className="material-symbols-rounded timer-badge-icon">schedule</span>
      <span className="timer-badge-text">{timeDisplay}</span>
    </div>
  )
}
