/**
 * storageService.js
 * Handles client-side lossless image compression and direct uploads
 * to Supabase Storage buckets (product_images, product_videos, site_assets).
 */
import { supabase } from '../lib/supabase.js'

export const BUCKETS = {
  PRODUCT_IMAGES: 'product_images',
  PRODUCT_VIDEOS: 'product_videos',
  SITE_ASSETS: 'site_assets',
}

/**
 * Perform visually lossless compression on an image file.
 * - Preserves sharp details and clarity without visible degradation
 * - Normalizes ultra-high resolution DSLR photos (downscales gracefully if > 2048px)
 * - Encodes using high-quality WebP (quality 0.92) or high-quality PNG
 * - Falls back to original if compression doesn't reduce size or on unsupported formats (SVG/GIF)
 *
 * @param {File} file - Original image file
 * @param {Object} options - Custom compression options
 * @returns {Promise<{ blob: Blob, file: File, originalSize: number, compressedSize: number, reductionPercent: number, ext: string }>}
 */
export async function compressImageLossless(file, options = {}) {
  const {
    maxDimension = 2048,
    quality = 0.92, // 0.92 provides visually lossless output in WebP
  } = options

  const originalSize = file.size

  // Don't compress SVGs or animated GIFs — preserve vector/animation data intact
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return {
      blob: file,
      file,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      ext: file.name.split('.').pop() || 'png',
      mimeType: file.type,
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img

        // If dimensions are absurdly high (e.g. 5000px+ raw camera snaps), scale smoothly to maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        // Enable highest quality bicubic interpolation
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, width, height)

        // WebP has superior lossless and near-lossless compression across all modern browsers
        const targetMime = 'image/webp'
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= originalSize) {
              // If the converted blob is somehow larger than the original, keep original
              resolve({
                blob: file,
                file,
                originalSize,
                compressedSize: originalSize,
                reductionPercent: 0,
                ext: file.name.split('.').pop() || 'jpg',
                mimeType: file.type,
              })
              return
            }

            const compressedSize = blob.size
            const reductionPercent = Math.round(
              ((originalSize - compressedSize) / originalSize) * 100
            )

            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image'
            const optimizedFile = new File([blob], `${baseName}.webp`, {
              type: targetMime,
            })

            resolve({
              blob,
              file: optimizedFile,
              originalSize,
              compressedSize,
              reductionPercent,
              ext: 'webp',
              mimeType: targetMime,
            })
          },
          targetMime,
          quality
        )
      }

      img.onerror = () => {
        // Fallback to original file on load error
        resolve({
          blob: file,
          file,
          originalSize,
          compressedSize: originalSize,
          reductionPercent: 0,
          ext: file.name.split('.').pop() || 'jpg',
          mimeType: file.type,
        })
      }

      img.src = event.target.result
    }

    reader.onerror = () => {
      resolve({
        blob: file,
        file,
        originalSize,
        compressedSize: originalSize,
        reductionPercent: 0,
        ext: file.name.split('.').pop() || 'jpg',
        mimeType: file.type,
      })
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Upload an image to Supabase Storage with automatic lossless compression.
 *
 * @param {File} file - Image file to upload
 * @param {string} bucket - Target bucket ('product_images' | 'site_assets')
 * @param {string} folder - Optional subfolder prefix
 * @param {Function} onProgress - Progress/status callback
 * @returns {Promise<{ publicUrl: string, stats: Object }>}
 */
export async function uploadImageToSupabase(
  file,
  bucket = BUCKETS.PRODUCT_IMAGES,
  folder = '',
  onProgress = null
) {
  if (!file) throw new Error('No file provided')

  onProgress?.({ status: 'compressing', progress: 25, message: 'Optimizing image (lossless)...' })

  // 1. Lossless compression
  const compressionResult = await compressImageLossless(file)

  onProgress?.({ status: 'uploading', progress: 65, message: 'Uploading to Supabase bucket...' })

  // 2. Generate a clean, unique file path
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase()
  const uniqueKey = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const fileName = `${sanitizedName}_${uniqueKey}.${compressionResult.ext}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  // 3. Upload to Supabase Storage bucket
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, compressionResult.file, {
      cacheControl: '31536000', // 1 year cache
      upsert: true,
      contentType: compressionResult.mimeType,
    })

  if (error) {
    console.error(`Storage upload failed for bucket "${bucket}":`, error)
    throw new Error(
      error.message?.includes('row-level security') || error.statusCode === '403'
        ? `Upload permission denied by Supabase RLS. Please ensure an INSERT policy is added to storage.objects for bucket "${bucket}".`
        : error.message || 'Failed to upload image'
    )
  }

  // 4. Retrieve public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
  const publicUrl = urlData?.publicUrl

  onProgress?.({
    status: 'complete',
    progress: 100,
    message: `Uploaded! Reduced by ${compressionResult.reductionPercent}%`,
  })

  return {
    publicUrl,
    stats: {
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      reductionPercent: compressionResult.reductionPercent,
      fileName,
      bucket,
    },
  }
}

/**
 * Upload a product video (.mp4, .webm, etc.) to the product_videos bucket.
 *
 * @param {File} file - Video file
 * @param {string} folder - Optional subfolder
 * @param {Function} onProgress - Progress/status callback
 * @returns {Promise<{ publicUrl: string, fileName: string }>}
 */
export async function uploadVideoToSupabase(
  file,
  folder = '',
  onProgress = null
) {
  if (!file) throw new Error('No video file provided')

  const bucket = BUCKETS.PRODUCT_VIDEOS

  // Check 50MB file size limit
  const maxBytes = 50 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(`Video exceeds maximum 50MB limit (size: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`)
  }

  onProgress?.({ status: 'uploading', progress: 50, message: 'Uploading video to product_videos bucket...' })

  const ext = file.name.split('.').pop() || 'mp4'
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase()
  const uniqueKey = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const fileName = `${sanitizedName}_${uniqueKey}.${ext}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: true,
      contentType: file.type || 'video/mp4',
    })

  if (error) {
    console.error(`Storage video upload failed for bucket "${bucket}":`, error)
    throw new Error(
      error.message?.includes('row-level security') || error.statusCode === '403'
        ? `Upload permission denied by Supabase RLS. Please ensure an INSERT policy is added to storage.objects for bucket "${bucket}".`
        : error.message || 'Failed to upload video'
    )
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
  const publicUrl = urlData?.publicUrl

  onProgress?.({ status: 'complete', progress: 100, message: 'Video uploaded successfully!' })

  return {
    publicUrl,
    fileName,
    size: file.size,
  }
}

/**
 * Format bytes into human-readable string (e.g., "1.4 MB", "340 KB")
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Delete a file from Supabase Storage bucket given its full public URL or relative path.
 * If given a full public URL, automatically extracts the bucket name and relative file path.
 *
 * @param {string} filePathOrUrl - Public URL or relative path to delete
 * @param {string} [defaultBucket] - Optional fallback bucket name if passing a relative path
 * @returns {Promise<{ success: boolean, error?: any, skipped?: boolean }>}
 */
export async function deleteFileFromSupabase(filePathOrUrl, defaultBucket = null) {
  if (!filePathOrUrl || typeof filePathOrUrl !== 'string') {
    return { success: false, error: 'No file path or URL provided' }
  }

  let bucket = defaultBucket
  let filePath = filePathOrUrl

  // Check if it's a Supabase public URL
  // e.g. https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path...>
  const publicUrlMatch = filePathOrUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
  if (publicUrlMatch) {
    bucket = publicUrlMatch[1]
    filePath = decodeURIComponent(publicUrlMatch[2])
  }

  // If it's a local static asset (e.g. /src/assets/...) or non-Supabase external URL, skip deletion safely
  if (!bucket || (filePathOrUrl.startsWith('http') && !filePathOrUrl.includes('supabase.co'))) {
    return { success: true, skipped: true }
  }

  try {
    const { data, error } = await supabase.storage.from(bucket).remove([filePath])
    if (error) {
      console.warn(`Storage deletion failed for "${filePath}" in bucket "${bucket}":`, error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (err) {
    console.warn(`Exception deleting file "${filePath}" from bucket "${bucket}":`, err)
    return { success: false, error: err }
  }
}

