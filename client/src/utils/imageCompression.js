import imageCompression from 'browser-image-compression'

/**
 * Validates that a compressed image contains actual content (not solid white/blank)
 * 
 * @param {File} file - The compressed image file to validate
 * @returns {Promise<boolean>} - Returns true if image appears blank/corrupt, false if valid
 */
async function isImageBlank(file) {
  return new Promise((resolve) => {
    // Check if file size is suspiciously small (< 5KB for a photo is likely corrupt)
    if (file.size < 5000) {
      console.warn('Image file suspiciously small:', file.size, 'bytes')
      resolve(true) // Flag as blank
      return
    }

    // Load the image and sample pixel data
    const img = new Image()
    const reader = new FileReader()
    
    reader.onload = (e) => {
      img.onload = () => {
        try {
          // Create canvas and draw image
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          
          // Sample pixels from 5 strategic points
          const centerX = Math.floor(img.width / 2)
          const centerY = Math.floor(img.height / 2)
          
          const samplePoints = [
            { x: centerX, y: centerY }, // Center
            { x: 10, y: 10 }, // Top-left
            { x: img.width - 10, y: 10 }, // Top-right
            { x: 10, y: img.height - 10 }, // Bottom-left
            { x: img.width - 10, y: img.height - 10 }, // Bottom-right
          ]
          
          const samples = samplePoints.map(point => {
            const pixel = ctx.getImageData(point.x, point.y, 1, 1).data
            return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] }
          })
          
          // Check if all sampled pixels are identical or nearly identical
          const firstPixel = samples[0]
          const allIdentical = samples.every(pixel => {
            return Math.abs(pixel.r - firstPixel.r) < 5 &&
                   Math.abs(pixel.g - firstPixel.g) < 5 &&
                   Math.abs(pixel.b - firstPixel.b) < 5
          })
          
          if (allIdentical) {
            console.warn('Image appears to be solid color (likely corrupt):', firstPixel)
            resolve(true) // Flag as blank
          } else {
            resolve(false) // Valid image
          }
        } catch (error) {
          console.error('Error validating image:', error)
          resolve(false) // If we can't validate, assume it's okay
        }
      }
      
      img.onerror = () => {
        console.error('Failed to load image for validation')
        resolve(true) // Flag as blank if we can't even load it
      }
      
      img.src = e.target.result
    }
    
    reader.onerror = () => {
      console.error('Failed to read file for validation')
      resolve(true) // Flag as blank if we can't read it
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Compresses an image file with progressive retry strategy
 * Tries multiple compression tiers until a valid image is produced
 * Target: ~200KB max, quality 75%, max dimensions 1280x720
 * 
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - The compressed image file
 */
export async function compressImage(file) {
  console.log('Starting compression for:', file.name, 'Size:', file.size, 'bytes')
  
  // Define compression tiers (progressively less aggressive)
  const compressionTiers = [
    {
      name: 'Tier 1 (Aggressive)',
      options: {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        quality: 0.75,
        fileType: 'image/jpeg',
      }
    },
    {
      name: 'Tier 2 (Relaxed)',
      options: {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        quality: 0.85,
        fileType: 'image/jpeg',
      }
    },
    {
      name: 'Tier 3 (Minimal)',
      options: {
        maxSizeMB: 1.0,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: 0.90,
        fileType: 'image/jpeg',
      }
    }
  ]

  // Try each compression tier until we get a valid image
  for (const tier of compressionTiers) {
    try {
      console.log(`Attempting ${tier.name} compression...`)
      
      const compressedFile = await imageCompression(file, tier.options)
      console.log(`${tier.name} compressed to:`, compressedFile.size, 'bytes')
      
      // Validate the compressed image
      const isBlank = await isImageBlank(compressedFile)
      
      if (!isBlank) {
        console.log(`${tier.name} SUCCESS - valid image produced`)
        
        // Return with original filename (but .jpg extension)
        const originalName = file.name.replace(/\.[^/.]+$/, '')
        return new File([compressedFile], `${originalName}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
      } else {
        console.warn(`${tier.name} produced blank/corrupt image, trying next tier...`)
      }
    } catch (error) {
      console.error(`${tier.name} compression error:`, error)
      // Continue to next tier
    }
  }

  // If all tiers failed, throw error
  throw new Error('Unable to compress image - all compression attempts produced blank images. Please try a different photo or image format.')
}

