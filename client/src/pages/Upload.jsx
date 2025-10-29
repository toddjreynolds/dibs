import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../utils/AuthContext'
import { compressImage } from '../utils/imageCompression'
import { calculateExpiresAt } from '../utils/timerUtils'

export function Upload() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!imageFile) {
      alert('Please select an image')
      return
    }

    setUploading(true)

    try {
      console.log('Starting upload process...')
      console.log('Image file:', imageFile)
      
      const compressedImage = await compressImage(imageFile)
      console.log('Image compressed:', compressedImage)
      
      const fileExt = imageFile.name.split('.').pop()
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

      // Try to insert with new columns first, fall back to basic insert if they don't exist
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
      navigate('/')
    } catch (error) {
      console.error('Error uploading:', error)
      alert(`Failed to upload item: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Upload Item</h1>

      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Item Photo
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-secondary transition">
                  <span className="material-symbols-rounded text-6xl text-gray-400 mb-4 block">
                    add_photo_alternate
                  </span>
                  <p className="text-gray-600 mb-2">Click to upload photo</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                  required
                />
              </label>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-3 px-6 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !imageFile}
              className="flex-1 py-3 px-6 bg-[#8338EC] text-white rounded-lg font-semibold hover:bg-[#6619DA] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Uploading...
                </span>
              ) : (
                'Upload Item'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <span className="material-symbols-rounded text-xl mr-2">lightbulb</span>
          Tips for better photos
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 ml-7">
          <li>Use good lighting</li>
          <li>Show the entire item clearly</li>
          <li>Keep the background simple</li>
          <li>Take photos from multiple angles if needed</li>
        </ul>
      </div>
    </div>
  )
}
