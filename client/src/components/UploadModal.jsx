import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../utils/AuthContext'
import { compressImage } from '../utils/imageCompression'
import { calculateExpiresAt } from '../utils/timerUtils'

export function UploadModal({ isOpen, onClose, onUploadComplete }) {
  const { user } = useAuthContext()
  const [uploading, setUploading] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [showSuccess, setShowSuccess] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Detect if user is on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()))
    }
    checkMobile()
  }, [])

  // Restore state from sessionStorage on mount (DEVELOPMENT ONLY - for Vite dev reload recovery)
  useEffect(() => {
    // Only restore state in development mode
    if (!import.meta.env.DEV) return
    
    const savedState = sessionStorage.getItem('uploadModalState')
    if (savedState) {
      try {
        const { imageFiles: savedImages } = JSON.parse(savedState)
        if (savedImages && savedImages.length > 0) {
          console.log('Restoring', savedImages.length, 'photos from sessionStorage after page reload (dev mode)')
          // Convert saved data back to File objects with previews
          const restoredFiles = savedImages.map(img => {
            // Convert base64 data URL to Blob, then to File
            const base64Data = img.preview.split(',')[1]
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: img.fileType || 'image/jpeg' })
            const file = new File([blob], img.fileName || 'photo.jpg', { type: img.fileType || 'image/jpeg' })
            
            return {
              id: img.id,
              preview: img.preview,
              file: file
            }
          })
          setImageFiles(restoredFiles)
          // Reopen the modal after reload
          if (!isOpen) {
            console.log('Reopening modal after page reload (dev mode)')
            // Set a flag that the parent should check (already checked DEV mode above)
            try {
              sessionStorage.setItem('uploadModalShouldReopen', 'true')
            } catch (error) {
              console.warn('Could not set reopen flag:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error restoring upload state:', error)
        sessionStorage.removeItem('uploadModalState')
      }
    }
  }, []) // Only run on mount

  // Save imageFiles to sessionStorage whenever they change (DEVELOPMENT ONLY)
  // This handles Vite dev server reloads when returning from camera on Android
  useEffect(() => {
    // Only use sessionStorage in development mode to avoid quota issues in production
    if (!import.meta.env.DEV) return
    
    if (imageFiles.length > 0) {
      console.log('Saving', imageFiles.length, 'photos to sessionStorage (dev mode)')
      try {
        const stateToSave = {
          imageFiles: imageFiles.map(img => ({
            id: img.id,
            preview: img.preview,
            fileName: img.file.name,
            fileType: img.file.type
          }))
        }
        sessionStorage.setItem('uploadModalState', JSON.stringify(stateToSave))
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.warn('SessionStorage quota exceeded, clearing old data')
          sessionStorage.removeItem('uploadModalState')
        } else {
          console.error('Error saving to sessionStorage:', error)
        }
      }
    } else {
      // Clear if no images
      sessionStorage.removeItem('uploadModalState')
    }
  }, [imageFiles])

  // Handle page visibility changes - save state before going to camera
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('Page visibility changed:', document.visibilityState, 'isOpen:', isOpen)
      if (document.visibilityState === 'hidden' && isOpen && imageFiles.length > 0) {
        console.log('Page going hidden - ensuring state is saved')
        // State is already saved by the imageFiles useEffect above
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isOpen, imageFiles])

  // Reset state when modal opens/closes
  useEffect(() => {
    console.log('isOpen changed to:', isOpen)
    if (!isOpen) {
      console.log('Modal is closing - resetting state')
      setImageFiles([])
      setUploadProgress({ current: 0, total: 0 })
      setShowSuccess(false)
      setIsClosing(false)
      // Clear sessionStorage when modal is explicitly closed
      sessionStorage.removeItem('uploadModalState')
      sessionStorage.removeItem('uploadModalShouldReopen')
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match animation duration
  }

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !uploading && isOpen) {
        console.log('Modal closing due to ESC key')
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [uploading, isOpen])

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || [])
    console.log('handleImageChange called, files:', files.length)
    if (files.length === 0) {
      console.log('No files selected - user may have cancelled')
      return
    }

    // Create preview objects for each file
    const newImageFiles = await Promise.all(
      files.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve({
              id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
              file,
              preview: reader.result,
            })
          }
          reader.readAsDataURL(file)
        })
      })
    )

    setImageFiles(prev => [...prev, ...newImageFiles])
  }

  const removeImage = (id) => {
    setImageFiles(prev => prev.filter(img => img.id !== id))
  }

  const uploadSingleImage = async (imageFile) => {
    console.log('Starting upload for:', imageFile.file.name)
    
    const compressedImage = await compressImage(imageFile.file)
    console.log('Image compressed:', compressedImage)
    
    const fileExt = imageFile.file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    console.log('Upload path:', filePath)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(filePath, compressedImage, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    console.log('Upload successful:', uploadData)

    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(filePath)

    console.log('Public URL:', publicUrl)

    // Insert item into database
    const now = new Date()
    const expiresAt = calculateExpiresAt(now)
    
    let insertData, insertError
    
    // Try with new columns
    const fullInsert = await supabase
      .from('items')
      .insert({
        image_url: publicUrl,
        uploaded_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'active',
      })
    
    insertData = fullInsert.data
    insertError = fullInsert.error
    
    // If error due to missing columns, try basic insert
    if (insertError && insertError.message?.includes('column')) {
      console.log('New columns not available yet, using basic insert')
      const basicInsert = await supabase
        .from('items')
        .insert({
          image_url: publicUrl,
          uploaded_by: user.id,
        })
      insertData = basicInsert.data
      insertError = basicInsert.error
    }

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Database insert failed: ${insertError.message}`)
    }

    console.log('Insert successful:', insertData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (imageFiles.length === 0) {
      alert('Please select at least one image')
      return
    }

    setUploading(true)
    setUploadProgress({ current: 0, total: imageFiles.length })

    try {
      // Upload images sequentially to avoid overwhelming the server
      for (let i = 0; i < imageFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: imageFiles.length })
        await uploadSingleImage(imageFiles[i])
      }

      // Show success message
      setShowSuccess(true)
      
      // Clear sessionStorage after successful upload
      console.log('Upload successful - clearing sessionStorage')
      sessionStorage.removeItem('uploadModalState')
      sessionStorage.removeItem('uploadModalShouldReopen')
      
      // Refresh data
      if (onUploadComplete) {
        onUploadComplete()
      }

      // Close modal after brief delay with animation
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (error) {
      console.error('Error uploading:', error)
      alert(`Failed to upload items: ${error.message}`)
    } finally {
      setUploading(false)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3 md:px-8 lg:px-12 py-4 pointer-events-none">
        <div 
          className={`bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transition-all duration-300 ${
            isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Upload Items</h2>
            <button
              onClick={() => {
                console.log('Modal closing due to X button click')
                handleClose()
              }}
              disabled={uploading}
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
                  {imageFiles.length === 1 ? 'Item uploaded successfully!' : `${imageFiles.length} items uploaded successfully!`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Item Photos
                  </label>
                  
                  {/* Selected Images Grid */}
                  {imageFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {imageFiles.map((imageFile) => (
                        <div key={imageFile.id} className="relative group">
                          <img
                            src={imageFile.preview}
                            alt="Preview"
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          {!uploading && (
                            <button
                              type="button"
                              onClick={() => removeImage(imageFile.id)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-rounded text-lg">close</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button(s) */}
                  {!uploading && (
                    <>
                      {isMobile ? (
                        /* Mobile: Two side-by-side buttons */
                        <div className="grid grid-cols-2 gap-3">
                          {/* Take Photo Button */}
                          <label 
                            className="block cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-secondary transition">
                              <span className="material-symbols-rounded text-4xl text-gray-400 mb-2 block">
                                photo_camera
                              </span>
                              <p className="text-gray-600 text-sm font-medium">
                                Take Photo
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleImageChange}
                              onFocus={() => console.log('Take Photo input focused')}
                              onBlur={() => console.log('Take Photo input blurred')}
                              className="hidden"
                            />
                          </label>

                          {/* Choose Photos Button */}
                          <label 
                            className="block cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-secondary transition">
                              <span className="material-symbols-rounded text-4xl text-gray-400 mb-2 block">
                                photo_library
                              </span>
                              <p className="text-gray-600 text-sm font-medium">
                                Choose Photos
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageChange}
                              onFocus={() => console.log('Choose Photos input focused')}
                              onBlur={() => console.log('Choose Photos input blurred')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        /* Desktop: Single button */
                        <label className="block cursor-pointer">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-secondary transition">
                            <span className="material-symbols-rounded text-5xl text-gray-400 mb-3 block">
                              add_photo_alternate
                            </span>
                            <p className="text-gray-600 mb-1 font-medium">
                              {imageFiles.length === 0 ? 'Click to upload photos' : 'Add more photos'}
                            </p>
                            <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </>
                  )}

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-900">
                          Uploading {uploadProgress.current} of {uploadProgress.total}...
                        </span>
                        <span className="text-sm text-blue-700">
                          {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>


                {/* Action Buttons */}
                {!uploading && imageFiles.length > 0 && (
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Modal closing due to Cancel button click')
                        handleClose()
                      }}
                      className="flex-1 py-3 px-6 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 px-6 bg-[#8338EC] text-white rounded-lg font-semibold hover:bg-[#6619DA] transition"
                    >
                      Upload {imageFiles.length === 1 ? '1 Item' : `${imageFiles.length} Items`}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
