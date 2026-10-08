import React, { useRef } from 'react'
import { Camera, Edit3 } from 'lucide-react'

// Editable Text Component
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

  if (!isEditMode) {
    return (
      <Tag className={className} {...props}>
        {value}
      </Tag>
    )
  }

  const handleBlur = (e) => {
    const text = e.currentTarget.innerText
    if (text !== value) {
      onChange(text)
    }
  }

  const handleKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`admin-editable-field ${className}`}
      title="Click to edit text (Admin Edit Mode)"
      data-placeholder={placeholder}
      {...props}
    >
      {value}
    </Tag>
  )
}

// Editable Image Component
export function EditableImage({
  src,
  alt = '',
  onChange,
  isEditMode,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  if (!isEditMode) {
    return <img src={src} alt={alt} className={className} {...props} />
  }

  const handleClick = (e) => {
    e.stopPropagation()
    const newUrl = window.prompt('Enter new Image URL:', src || '')
    if (newUrl !== null && newUrl.trim() !== '') {
      onChange(newUrl.trim())
    }
  }

  return (
    <div
      className={`admin-editable-image-wrapper ${wrapperClassName}`}
      onClick={handleClick}
      title="Click to replace image URL (Admin Edit Mode)"
    >
      <img src={src} alt={alt} className={className} {...props} />
      <div className="admin-editable-image-overlay">
        <Camera size={16} />
        <span>Change Image</span>
      </div>
    </div>
  )
}
