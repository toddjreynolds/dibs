import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Delete an item from the database and its associated image from storage
 * @param {string} itemId - The ID of the item to delete
 * @param {string} imageUrl - The URL of the image to delete from storage
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function deleteItem(itemId, imageUrl) {
  try {
    // Extract the storage path from the image URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/item-images/{path}
    if (imageUrl) {
      const urlParts = imageUrl.split('/item-images/')
      if (urlParts.length > 1) {
        const imagePath = urlParts[1]
        
        // Delete the image from storage
        const { error: storageError } = await supabase.storage
          .from('item-images')
          .remove([imagePath])
        
        if (storageError) {
          console.error('Error deleting image from storage:', storageError)
          // Continue with item deletion even if storage deletion fails
        }
      }
    }

    // Delete the item from database (CASCADE will handle claims)
    const { error: dbError } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)

    if (dbError) {
      throw dbError
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting item:', error)
    return { success: false, error }
  }
}

