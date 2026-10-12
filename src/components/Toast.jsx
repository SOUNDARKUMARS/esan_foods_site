import React from 'react'
import { CheckCircle2, ShoppingBag, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  if (!toast) return null

  const isClickable = typeof toast.onClick === 'function'

  const handleCardClick = () => {
    if (isClickable) {
      toast.onClick()
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      toast.onClick()
      onClose()
    }
  }

  return (
    <div className="toast-floating-container animate-fade-in" role="status" aria-live="polite">
      <div
        className={`toast-card ${isClickable ? 'toast-card-clickable' : ''}`}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        title={isClickable ? (toast.actionText ? `Click to ${toast.actionText.toLowerCase()}` : 'Click to open cart') : undefined}
      >
        <div className="toast-icon-wrap">
          <CheckCircle2 size={18} className="toast-check-icon" />
        </div>
        <div className="toast-message-wrap">
          <div className="toast-title-row">
            <span className="toast-title">{toast.title}</span>
            {toast.actionText && (
              <span className="toast-action-pill">
                <ShoppingBag size={12} />
                <span>{toast.actionText}</span>
              </span>
            )}
          </div>
          {toast.message && <span className="toast-sub">{toast.message}</span>}
        </div>
        <button
          type="button"
          className="toast-close-btn"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Dismiss toast"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

