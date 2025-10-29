import imageCompression from 'browser-image-compression'

/**
 * Compresses an image file to reduce storage requirements
 * Target: ~200KB max, quality 75%, max dimensions 1280x720
 * 
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - The compressed image file
 */
export async function compressImage(file) {
  try {
    const options = {
      maxSizeMB: 0.2, // 200KB max
      maxWidthOrHeight: 1280, // Max dimension 1280x720
      useWebWorker: true,
      quality: 0.75, // 75% quality
      fileType: 'image/jpeg', // Convert all to JPEG for better compression
    }

    const compressedFile = await imageCompression(file, options)
    
    // Return with original filename (but .jpg extension)
    const originalName = file.name.replace(/\.[^/.]+$/, '')
    return new File([compressedFile], `${originalName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch (error) {
    console.error('Error compressing image:', error)
    // If compression fails, return original file
    return file
  }
}

