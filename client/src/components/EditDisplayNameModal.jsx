import { useState, useEffect } from 'react'
import { useAuthContext } from '../utils/AuthContext'

export function EditDisplayNameModal({ isOpen, onClose }) {
  const { profile, updateDisplayName } = useAuthContext()
  const [firstName, setFirstName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Prepopulate with current first_name
  useEffect(() => {
    if (isOpen && profile?.first_name) {
      setFirstName(profile.first_name)
    }
  }, [isOpen, profile])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFirstName('')
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
    if (!firstName.trim()) {
      alert('Please enter a display name')
      return
    }

    setSaving(true)
    try {
      await updateDisplayName(firstName.trim())
      
      // Show success message
      setShowSuccess(true)
      
      // Close modal after brief delay with animation
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (error) {
      console.error('Error updating display name:', error)
      alert(`Failed to update display name: ${error.message}`)
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
            <h2 className="text-2xl font-bold text-gray-800">Edit Display Name</h2>
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
                  Display name updated!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8338EC] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your first name"
                    autoFocus
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

