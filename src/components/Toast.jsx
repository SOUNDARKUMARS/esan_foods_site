import React from 'react'
import { CheckCircle2, Sparkles, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  if (!toast) return null

  return (
    <div className="toast-floating-container animate-fade-in" role="status" aria-live="polite">
      <div className="toast-card">
        <div className="toast-icon-wrap">
          <CheckCircle2 size={18} className="toast-check-icon" />
        </div>
        <div className="toast-message-wrap">
          <span className="toast-title">{toast.title}</span>
          {toast.message && <span className="toast-sub">{toast.message}</span>}
        </div>
        <button
          type="button"
          className="toast-close-btn"
          onClick={onClose}
          aria-label="Dismiss toast"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
