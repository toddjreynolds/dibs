import { useEffect, useCallback, useState } from 'react'
import { deleteItem } from '../api/supabase'

export function ImageViewerModal({ isOpen, onClose, imageUrl, item, user, onDelete }) {
  const [isClosing, setIsClosing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false)
      setDeleting(false)
      setShowSuccess(false)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  const handleDelete = async (e) => {
    e.stopPropagation()
    console.log('Delete button clicked', { item, user, deleting })
    
    if (!item) {
      console.error('No item provided to ImageViewerModal')
      return
    }
    
    if (deleting) {
      console.log('Already deleting, ignoring click')
      return
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete this item? This action cannot be undone.'
    )
    
    if (!confirmed) return

    setDeleting(true)
    try {
      const result = await deleteItem(item.id, item.image_url)
      
      if (result.success) {
        // Show success message
        setShowSuccess(true)
        
        // Call onDelete callback to refresh data
        if (onDelete) {
          onDelete()
        }
        
        // Close modal after brief delay
        setTimeout(() => {
          handleClose()
        }, 1500)
      } else {
        throw result.error || new Error('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(`Failed to delete item: ${error.message}`)
      setDeleting(false)
    }
  }

  // Check if current user is the item owner
  const isOwner = item && user && item.uploaded_by === user.id
  
  console.log('ImageViewerModal render:', { 
    isOpen, 
    hasItem: !!item, 
    hasUser: !!user, 
    itemUploadedBy: item?.uploaded_by,
    userId: user?.id,
    isOwner 
  })

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

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
          className={`relative max-w-[90vw] max-h-[90vh] pointer-events-auto transition-all duration-300 ${
            isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {showSuccess ? (
            /* Success Message */
            <div className="bg-white rounded-lg shadow-2xl p-12 text-center">
              <span className="material-symbols-rounded text-6xl text-green-500 mb-4 block">
                check_circle
              </span>
              <p className="text-xl font-semibold text-gray-800">
                Item deleted successfully!
              </p>
            </div>
          ) : (
            <>
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition z-10"
                aria-label="Close image viewer"
              >
                <span className="material-symbols-rounded text-3xl">close</span>
              </button>

              {/* Image */}
              <img
                src={imageUrl}
                alt="Full size view"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Delete Button - Only show if user is the owner */}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="delete-item-btn absolute bottom-6 left-1/2 -translate-x-1/2 h-10 px-4 bg-white rounded-full flex items-center justify-center gap-2 hover:bg-gray-50 transition z-10 shadow-lg disabled:opacity-50 whitespace-nowrap"
                  aria-label="Delete item"
                >
                  <span
                    className="material-symbols-rounded text-accent-pink flex-shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}
                  >
                    do_not_disturb_on
                  </span>
                  <span className="delete-item-text text-accent-pink font-semibold text-[20px] leading-[74%] tracking-[-0.4px]">
                    {deleting ? 'Deleting...' : 'Delete Item'}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
