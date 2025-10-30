import { useState, useEffect } from 'react'
import { useAuthContext } from '../utils/AuthContext'

export function ChangePasswordModal({ isOpen, onClose }) {
  const { updatePassword } = useAuthContext()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowSuccess(false)
      setIsClosing(false)
    }
  }, [isOpen])

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !saving && isOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [saving, isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match animation duration
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!currentPassword.trim()) {
      alert('Please enter your current password')
      return
    }
    
    if (!newPassword.trim()) {
      alert('Please enter a new password')
      return
    }
    
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    setSaving(true)
    try {
      await updatePassword(currentPassword, newPassword)
      
      // Show success message
      setShowSuccess(true)
      
      // Close modal after brief delay with animation
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (error) {
      console.error('Error updating password:', error)
      alert(`Failed to update password: ${error.message}`)
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
            <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
            <button
              onClick={handleClose}
              disabled={saving}
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
                  Password changed!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8338EC] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter current password"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8338EC] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8338EC] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Confirm new password"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={saving}
                    className="flex-1 py-3 px-6 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 px-6 bg-[#8338EC] text-white rounded-lg font-semibold hover:bg-[#6619DA] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
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

