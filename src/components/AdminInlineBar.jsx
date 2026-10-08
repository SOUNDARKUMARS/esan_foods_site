import React from 'react'
import {
  Sparkles,
  Save,
  Eye,
  Edit3,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

export default function AdminInlineBar({
  isEditMode,
  onToggleMode,
  hasChanges,
  onSave,
  onDiscard,
  isSaving,
}) {
  return (
    <div className="admin-inline-dock animate-fade-in" role="toolbar" aria-label="Admin Site Editor">
      <div className="admin-dock-pill">
        {/* Brand / Role indicator */}
        <div className="admin-dock-badge">
          <ShieldCheck size={15} className="admin-badge-icon" />
          <span className="admin-badge-text">Admin CMS</span>
        </div>

        <div className="dock-divider"></div>

        {/* Mode Toggle Button: Edit Mode ON vs Preview */}
        <button
          type="button"
          className={`dock-mode-toggle-btn ${isEditMode ? 'mode-edit' : 'mode-preview'}`}
          onClick={onToggleMode}
          title={isEditMode ? 'Switch to clean visitor preview' : 'Switch to editable mode'}
        >
          {isEditMode ? (
            <>
              <Edit3 size={15} />
              <span>Edit Mode ON</span>
              <span className="live-indicator-dot"></span>
            </>
          ) : (
            <>
              <Eye size={15} />
              <span>Preview Mode</span>
            </>
          )}
        </button>

        {/* Unsaved Changes & Actions */}
        {hasChanges && (
          <>
            <div className="dock-divider"></div>

            <div className="dock-unsaved-tag">
              <span className="pulse-dot"></span>
              <span>Unsaved Edits</span>
            </div>

            <button
              type="button"
              className="dock-discard-btn"
              onClick={onDiscard}
              disabled={isSaving}
              title="Revert back to last saved state"
            >
              <RotateCcw size={14} />
              <span>Discard</span>
            </button>

            <button
              type="button"
              className="dock-save-btn glow-effect"
              onClick={onSave}
              disabled={isSaving}
              title="Save all changes to Supabase database"
            >
              {isSaving ? (
                <>
                  <div className="dock-spinner"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save to Database</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
