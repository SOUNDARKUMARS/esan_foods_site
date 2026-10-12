import React, { useState, useRef } from 'react'
import {
  Upload,
  Image as ImageIcon,
  Video,
  CheckCircle,
  X,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  FileText,
} from 'lucide-react'
import {
  uploadImageToSupabase,
  uploadVideoToSupabase,
  deleteFileFromSupabase,
  formatBytes,
  BUCKETS,
} from '../data/storageService'

/**
 * Modern Media Uploader with client-side lossless compression
 * and direct upload to Supabase storage buckets.
 */
export default function MediaUploader({
  bucket = BUCKETS.PRODUCT_IMAGES,
  mode = 'image', // 'image' | 'video' | 'gallery'
  value = '', // URL string or array of URLs (for gallery)
  onChange, // (newUrlOrUrls) => void
  label = 'Media Asset',
  hint = 'Auto-compressed losslessly before upload',
  folder = '',
  onNotify = null,
}) {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatusText, setUploadStatusText] = useState('')
  const [compressionStats, setCompressionStats] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [showRlsHelp, setShowRlsHelp] = useState(false)

  // Parse gallery URLs if mode is 'gallery'
  const galleryUrls = mode === 'gallery'
    ? (Array.isArray(value)
        ? value
        : (typeof value === 'string' && value.trim()
            ? value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
            : []))
    : []

  // Single URL for image/video mode
  const singleUrl = typeof value === 'string' ? value : ''

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = async (files) => {
    if (!files.length) return
    setErrorMessage('')
    setCompressionStats(null)

    if (mode === 'video') {
      // Single video upload
      const file = files[0]
      if (!file.type.startsWith('video/')) {
        setErrorMessage('Please choose a valid video file (.mp4, .webm, .mov).')
        return
      }
      setUploading(true)
      try {
        const oldUrl = singleUrl
        const res = await uploadVideoToSupabase(file, folder, (p) => {
          setUploadProgress(p.progress)
          setUploadStatusText(p.message)
        })
        if (oldUrl && oldUrl.includes('supabase.co')) {
          deleteFileFromSupabase(oldUrl, bucket).catch((err) => console.warn('Old video delete note:', err))
        }
        onChange(res.publicUrl)
        onNotify?.('Video Uploaded! 🎬', `Saved to ${bucket} bucket.`)
      } catch (err) {
        handleUploadError(err, file)
      } finally {
        setUploading(false)
      }
    } else if (mode === 'gallery') {
      // Multiple image upload
      const imageFiles = files.filter((f) => f.type.startsWith('image/'))
      if (!imageFiles.length) {
        setErrorMessage('Please select valid image files (PNG, JPG, WebP).')
        return
      }

      setUploading(true)
      const uploadedUrls = []
      let totalOrig = 0
      let totalComp = 0

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        setUploadStatusText(`Optimizing & uploading ${i + 1} of ${imageFiles.length}...`)
        setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100))

        try {
          const res = await uploadImageToSupabase(file, bucket, folder)
          uploadedUrls.push(res.publicUrl)
          totalOrig += res.stats.originalSize
          totalComp += res.stats.compressedSize
        } catch (err) {
          handleUploadError(err, file)
          break
        }
      }

      if (uploadedUrls.length > 0) {
        const newGallery = [...galleryUrls, ...uploadedUrls]
        onChange(newGallery.join('\n'))
        const reduction = totalOrig > 0 ? Math.round(((totalOrig - totalComp) / totalOrig) * 100) : 0
        setCompressionStats({
          originalSize: totalOrig,
          compressedSize: totalComp,
          reductionPercent: reduction,
          count: uploadedUrls.length,
        })
        onNotify?.(
          `Uploaded ${uploadedUrls.length} Gallery Images! 📸`,
          reduction > 0 ? `Optimized by ${reduction}% (lossless WebP).` : 'Saved to Supabase!'
        )
      }
      setUploading(false)
    } else {
      // Single image upload
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please choose a valid image file (PNG, JPG, WebP, SVG).')
        return
      }

      setUploading(true)
      try {
        const oldUrl = singleUrl
        const res = await uploadImageToSupabase(file, bucket, folder, (p) => {
          setUploadProgress(p.progress)
          setUploadStatusText(p.message)
        })
        if (oldUrl && oldUrl.includes('supabase.co')) {
          deleteFileFromSupabase(oldUrl, bucket).catch((err) => console.warn('Old image delete note:', err))
        }
        onChange(res.publicUrl)
        setCompressionStats(res.stats)
        onNotify?.(
          'Image Uploaded! ✨',
          res.stats.reductionPercent > 0
            ? `Compressed ${formatBytes(res.stats.originalSize)} → ${formatBytes(res.stats.compressedSize)} (${res.stats.reductionPercent}% saved, lossless WebP).`
            : `Saved to ${bucket} bucket.`
        )
      } catch (err) {
        handleUploadError(err, file)
      } finally {
        setUploading(false)
      }
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUploadError = (err, file) => {
    console.error('Upload error:', err)
    if (err.message && err.message.includes('RLS') || err.message.includes('permission denied')) {
      setShowRlsHelp(true)
      setErrorMessage(
        'Upload restricted by Supabase Storage RLS. Run the SQL policy below in your Supabase SQL editor to allow uploads.'
      )
    } else {
      setErrorMessage(err.message || 'Upload failed. Please try again.')
    }
  }

  const handleRemoveSingle = async () => {
    if (singleUrl && singleUrl.includes('supabase.co')) {
      deleteFileFromSupabase(singleUrl, bucket).catch((err) => console.warn('Delete error:', err))
    }
    onChange('')
    setCompressionStats(null)
    setErrorMessage('')
  }

  const handleRemoveGalleryItem = async (indexToRemove) => {
    const itemToRemove = galleryUrls[indexToRemove]
    if (itemToRemove && itemToRemove.includes('supabase.co')) {
      deleteFileFromSupabase(itemToRemove, bucket).catch((err) => console.warn('Delete error:', err))
    }
    const updated = galleryUrls.filter((_, idx) => idx !== indexToRemove)
    onChange(updated.join('\n'))
  }

  const handleCopyUrl = (url) => {
    if (!url) return
    navigator.clipboard?.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const rlsSql = `-- Run this in your Supabase SQL Editor to allow file uploads to your buckets:
CREATE POLICY "Allow public uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('product_images', 'product_videos', 'site_assets'));

CREATE POLICY "Allow public reads" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('product_images', 'product_videos', 'site_assets'));

CREATE POLICY "Allow public updates" 
ON storage.objects FOR UPDATE 
USING (bucket_id IN ('product_images', 'product_videos', 'site_assets'));

CREATE POLICY "Allow public deletes" 
ON storage.objects FOR DELETE 
USING (bucket_id IN ('product_images', 'product_videos', 'site_assets'));`

  return (
    <div className="media-uploader-container">
      <div className="media-uploader-header">
        <label className="media-uploader-label">
          {mode === 'video' ? <Video size={15} /> : <ImageIcon size={15} />}
          <span>{label}</span>
          <span className="media-bucket-badge">{bucket}</span>
        </label>
        <button
          type="button"
          className="media-toggle-manual-btn"
          onClick={() => setShowManualInput(!showManualInput)}
          title="Toggle direct URL input"
        >
          {showManualInput ? 'Hide Raw URL' : 'Edit URL directly'}
        </button>
      </div>

      {hint && <p className="media-uploader-hint">{hint}</p>}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={mode === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
        multiple={mode === 'gallery'}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Single Media Preview & Replace */}
      {mode !== 'gallery' && singleUrl ? (
        <div className="media-preview-card animate-fade-in">
          {mode === 'video' ? (
            <div className="media-video-frame">
              <video src={singleUrl} controls className="media-preview-video" />
            </div>
          ) : (
            <div className="media-image-frame">
              <img
                src={singleUrl}
                alt="Preview"
                className="media-preview-img"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
                }}
              />
            </div>
          )}

          <div className="media-preview-info">
            <div className="media-preview-url-row">
              <span className="media-url-snippet" title={singleUrl}>
                {singleUrl.split('/').pop() || singleUrl}
              </span>
              <button
                type="button"
                className="btn-icon-copy"
                onClick={() => handleCopyUrl(singleUrl)}
                title="Copy public URL"
              >
                {copiedUrl ? <Check size={14} className="text-forest" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Compression highlight */}
            {compressionStats && (
              <div className="media-compression-badge">
                <Sparkles size={13} />
                <span>
                  Lossless WebP: {formatBytes(compressionStats.originalSize)} →{' '}
                  {formatBytes(compressionStats.compressedSize)} ({compressionStats.reductionPercent}% smaller)
                </span>
              </div>
            )}

            <div className="media-preview-actions">
              <button
                type="button"
                className="btn-pill-sm-outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <RefreshCw size={13} className={uploading ? 'spin-icon' : ''} />
                <span>Replace File</span>
              </button>
              <button
                type="button"
                className="btn-pill-sm-danger"
                onClick={handleRemoveSingle}
                title="Remove file"
              >
                <X size={13} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : mode === 'gallery' && galleryUrls.length > 0 ? (
        /* Gallery Preview Grid */
        <div className="gallery-preview-container animate-fade-in">
          <div className="gallery-thumbnails-grid">
            {galleryUrls.map((imgUrl, idx) => (
              <div key={idx} className="gallery-thumb-item">
                <img src={imgUrl} alt={`Gallery ${idx + 1}`} />
                <button
                  type="button"
                  className="gallery-thumb-remove-btn"
                  onClick={() => handleRemoveGalleryItem(idx)}
                  title="Remove image"
                >
                  <X size={12} />
                </button>
                <span className="gallery-index-tag">{idx + 1}</span>
              </div>
            ))}
          </div>

          {compressionStats && (
            <div className="media-compression-badge mt-2">
              <Sparkles size={13} />
              <span>
                Optimized {compressionStats.count} images: {formatBytes(compressionStats.originalSize)} →{' '}
                {formatBytes(compressionStats.compressedSize)} ({compressionStats.reductionPercent}% smaller)
              </span>
            </div>
          )}

          <div className="gallery-add-more-strip">
            <button
              type="button"
              className="btn-pill-sm-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={14} />
              <span>+ Add More Images</span>
            </button>
            <span className="gallery-count-text">
              {galleryUrls.length} image{galleryUrls.length > 1 ? 's' : ''} in gallery
            </span>
          </div>
        </div>
      ) : (
        /* Dropzone Upload Box */
        <div
          className={`media-dropzone ${isDragging ? 'is-dragging' : ''} ${uploading ? 'is-uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          {uploading ? (
            <div className="media-uploading-state">
              <div className="media-spinner"></div>
              <div className="upload-progress-info">
                <p className="upload-status-msg">{uploadStatusText || 'Processing...'}</p>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="upload-percent-text">{uploadProgress}%</span>
              </div>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="dropzone-icon-circle">
                <Upload size={22} />
              </div>
              <div className="dropzone-text-group">
                <h4 className="dropzone-title">
                  {mode === 'video'
                    ? 'Click or Drag Video to Upload'
                    : mode === 'gallery'
                    ? 'Click or Drag Multiple Images to Upload'
                    : 'Click or Drag Image to Upload'}
                </h4>
                <p className="dropzone-sub">
                  {mode === 'video'
                    ? 'Supports .mp4, .webm (max 50MB) → saved to product_videos'
                    : 'Auto-compressed to lossless WebP for ultra-fast loading → saved to ' + bucket}
                </p>
              </div>
              <button
                type="button"
                className="btn-dropzone-action"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                Browse Files
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual direct URL input fallback */}
      {showManualInput && (
        <div className="manual-url-box animate-fade-in">
          <label className="manual-url-label">
            {mode === 'gallery'
              ? 'Raw Image URLs (one per line or separated by commas)'
              : 'Direct Media Public URL'}
          </label>
          {mode === 'gallery' ? (
            <textarea
              rows={3}
              value={typeof value === 'string' ? value : galleryUrls.join('\n')}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://...image1.webp&#10;https://...image2.webp"
              className="media-raw-input"
            />
          ) : (
            <input
              type="url"
              value={singleUrl}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://tacyfcsyswlwbdtminnz.supabase.co/storage/v1/object/public/..."
              className="media-raw-input"
            />
          )}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="media-error-strip animate-fade-in">
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
          <button
            type="button"
            className="btn-close-error"
            onClick={() => setErrorMessage('')}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Supabase RLS Helper Modal / Banner */}
      {showRlsHelp && (
        <div className="rls-helper-card animate-fade-in">
          <div className="rls-helper-header">
            <AlertCircle size={17} className="text-amber" />
            <strong>Enable Storage Policy in Supabase</strong>
            <button
              type="button"
              className="btn-close-rls"
              onClick={() => setShowRlsHelp(false)}
            >
              <X size={14} />
            </button>
          </div>
          <p className="rls-helper-desc">
            Your Supabase storage bucket <code>{bucket}</code> has Row-Level Security enabled.
            To allow uploads, run this SQL policy once in your Supabase SQL Editor:
          </p>
          <pre className="rls-sql-block">
            <code>{rlsSql}</code>
          </pre>
          <div className="rls-helper-actions">
            <button
              type="button"
              className="btn-pill-sm-primary"
              onClick={() => {
                navigator.clipboard?.writeText(rlsSql)
                onNotify?.('SQL Copied to Clipboard! 📋', 'Paste it into your Supabase SQL Editor.')
              }}
            >
              <Copy size={13} />
              <span>Copy SQL Policy</span>
            </button>
            <a
              href="https://supabase.com/dashboard/project/tacyfcsyswlwbdtminnz/sql/new"
              target="_blank"
              rel="noreferrer"
              className="btn-pill-sm-outline"
            >
              <ExternalLink size={13} />
              <span>Open Supabase SQL Editor</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
