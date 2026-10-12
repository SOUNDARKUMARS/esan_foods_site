import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import {
  Camera,
  Upload,
  Link,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import {
  uploadImageToSupabase,
  deleteFileFromSupabase,
  formatBytes,
  BUCKETS,
} from '../data/storageService'

// Editable Text Component with Caret Preservation & Smooth Slow Transitions
export function EditableText({
  value,
  onChange,
  isEditMode,
  as: Tag = 'span',
  className = '',
  placeholder = 'Type here...',
  multiline = false,
  ...props
}) {
  const ref = useRef(null)
  const isFocusedRef = useRef(false)
  const prevValueRef = useRef(value)
  const [isSmoothUpdating, setIsSmoothUpdating] = useState(false)

  // When value changes from an external source (e.g. Supabase DB fetch or realtime sync),
  // ease the text in gently with a smooth slow transition to avoid layout snap or jitter.
  useEffect(() => {
    if (
      !isFocusedRef.current &&
      prevValueRef.current !== undefined &&
      prevValueRef.current !== value
    ) {
      setIsSmoothUpdating(true)
      const timer = setTimeout(() => {
        setIsSmoothUpdating(false)
      }, 800)
      prevValueRef.current = value
      return () => clearTimeout(timer)
    }
    prevValueRef.current = value
  }, [value])

  // Keep DOM in sync with value prop, but NEVER overwrite innerText while the user is actively typing!
  // Overwriting innerText while focused resets the browser caret to index 0, causing backwards typing.
  useLayoutEffect(() => {
    if (ref.current && isEditMode) {
      const isCurrentlyFocused = isFocusedRef.current || document.activeElement === ref.current
      if (!isCurrentlyFocused) {
        const expected = value ?? ''
        if (ref.current.innerText !== expected) {
          ref.current.innerText = expected
        }
      }
    }
  }, [value, isEditMode])

  const smoothFadeClass = isSmoothUpdating ? 'content-smooth-fade' : ''

  if (!isEditMode) {
    return (
      <Tag className={`${className} ${smoothFadeClass}`} {...props}>
        {value}
      </Tag>
    )
  }

  const setNodeRef = (node) => {
    ref.current = node
    if (node && !isFocusedRef.current && document.activeElement !== node) {
      const expected = value ?? ''
      if (node.innerText !== expected) {
        node.innerText = expected
      }
    }
  }

  const handleFocus = () => {
    isFocusedRef.current = true
  }

  const handleBlur = (e) => {
    isFocusedRef.current = false
    const text = (e.currentTarget.innerText || '').replace(/\r?\n$/, '')
    if (text !== (value ?? '')) {
      onChange(text)
    }
  }

  const handleInput = (e) => {
    const text = (e.currentTarget.innerText || '').replace(/\r?\n$/, '')
    if (text !== (value ?? '')) {
      onChange(text)
    }
  }

  const handleKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  // Exclude `children` from restProps so React does not reconcile DOM text children during re-renders
  const { children: _ignoredChildren, ...restProps } = props

  return (
    <Tag
      ref={setNodeRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`admin-editable-field ${className} ${smoothFadeClass}`}
      title="Click to edit text (Admin Edit Mode)"
      data-placeholder={placeholder}
      {...restProps}
    />
  )
}

// Editable Image Component with Preload & Smooth Cross-Fade
export function EditableImage({
  src,
  alt = '',
  onChange,
  isEditMode,
  bucket = BUCKETS.SITE_ASSETS,
  folder = 'hero',
  className = '',
  wrapperClassName = '',
  onNotify,
  ...props
}) {
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Smooth image cross-fade when image URL updates from DB
  const [displaySrc, setDisplaySrc] = useState(src)
  const [isImageTransitioning, setIsImageTransitioning] = useState(false)

  useEffect(() => {
    if (src && src !== displaySrc) {
      setIsImageTransitioning(true)
      const preload = new Image()
      preload.src = src
      preload.onload = () => {
        setDisplaySrc(src)
        setTimeout(() => {
          setIsImageTransitioning(false)
        }, 700)
      }
      preload.onerror = () => {
        setDisplaySrc(src)
        setIsImageTransitioning(false)
      }
    }
  }, [src])

  const smoothImageClasses = `${className} editable-image-smooth ${
    isImageTransitioning ? 'editable-image-transitioning' : 'editable-image-loaded'
  }`

  if (!isEditMode) {
    return <img src={displaySrc || src} alt={alt} className={smoothImageClasses} {...props} />
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, SVG).')
      return
    }

    setErrorMessage('')
    setIsUploading(true)
    setUploadProgress(15)
    setStatusText('Optimizing image (lossless WebP)...')

    const oldSrc = src

    try {
      // 1. Lossless compression & upload to Supabase bucket
      const res = await uploadImageToSupabase(file, bucket, folder, (p) => {
        setUploadProgress(p.progress)
        setStatusText(p.message)
      })

      // 2. Delete old file from bucket if previously hosted on Supabase Storage
      if (oldSrc && oldSrc.includes('supabase.co')) {
        try {
          await deleteFileFromSupabase(oldSrc, bucket)
        } catch (delErr) {
          console.warn('Old image delete note:', delErr)
        }
      }

      // 3. Update with new URL
      onChange(res.publicUrl)
      onNotify?.(
        'Image Updated! ✨',
        res.stats?.reductionPercent > 0
          ? `Saved ${res.stats.reductionPercent}% via lossless WebP compression.`
          : 'Uploaded to Supabase Storage.'
      )
    } catch (err) {
      console.error('Image upload failed:', err)
      setErrorMessage(err.message || 'Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleOpenUrlModal = (e) => {
    e.stopPropagation()
    setUrlInput(src || '')
    setShowUrlModal(true)
  }

  const handleSaveManualUrl = (e) => {
    e.preventDefault()
    if (urlInput.trim() && urlInput.trim() !== src) {
      onChange(urlInput.trim())
    }
    setShowUrlModal(false)
  }

  return (
    <div
      className={`admin-editable-image-wrapper ${wrapperClassName} ${isUploading ? 'is-uploading' : ''} ${isDragging ? 'is-dragging' : ''}`}
      onClick={() => {
        if (!isUploading && !showUrlModal) {
          fileInputRef.current?.click()
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title="Click or drag image to replace (Admin Edit Mode)"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <img src={displaySrc || src} alt={alt} className={smoothImageClasses} {...props} />

      {/* Uploading Overlay State */}
      {isUploading ? (
        <div className="admin-editable-image-overlay" style={{ opacity: 1, pointerEvents: 'auto' }}>
          <div className="admin-upload-progress-box">
            <Loader2 size={28} className="admin-upload-spinner" />
            <span className="admin-upload-status-text">{statusText || 'Processing...'}</span>
            <div className="admin-upload-progress-bar">
              <div
                className="admin-upload-progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{uploadProgress}%</span>
          </div>
        </div>
      ) : showUrlModal ? (
        /* Manual URL Modal State */
        <div
          className="admin-editable-url-modal animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 320, marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Edit Image URL</span>
            <button
              type="button"
              onClick={() => setShowUrlModal(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSaveManualUrl}>
            <input
              type="url"
              className="admin-editable-url-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                className="admin-image-btn-secondary"
                onClick={() => setShowUrlModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="admin-image-btn-main">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Hover Overlay */
        <div className="admin-editable-image-overlay">
          <div className="admin-image-upload-card">
            <div className="admin-image-upload-actions">
              <button
                type="button"
                className="admin-image-btn-main"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <Upload size={15} />
                <span>Replace Image</span>
              </button>
              <button
                type="button"
                className="admin-image-btn-secondary"
                onClick={handleOpenUrlModal}
                title="Enter custom image URL"
              >
                <Link size={13} />
                <span>URL</span>
              </button>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              Auto-compressed to lossless WebP & uploaded to Supabase
            </span>
            {errorMessage && (
              <div className="admin-editable-error-banner">
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
                <X
                  size={12}
                  style={{ cursor: 'pointer', marginLeft: 4 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setErrorMessage('')
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
