import React, { useState } from 'react'
import {
  X,
  Mail,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Send,
  RefreshCw,
  LayoutDashboard,
} from 'lucide-react'
import {
  sendSupabaseEmailOtp,
  verifySupabaseEmailOtp,
} from '../data/authService'

export default function AuthModal({
  isOpen,
  onClose,
  user,
  onAuthSuccess,
  onLogout,
  onOpenAdminDashboard,
}) {
  // Supabase Email OTP states
  const [email, setEmail] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Feedback notifications
  const [errorMsg, setErrorMsg] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  if (!isOpen) return null

  // 1. Send Supabase OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.')
      return
    }

    setLoading(true)
    const res = await sendSupabaseEmailOtp(cleanEmail)
    setLoading(false)

    if (res.success) {
      setOtpSent(true)
      setSuccessNotice(`Verification code sent to ${cleanEmail}! Please check your inbox.`)
    } else {
      setErrorMsg(res.error || 'Failed to send OTP code.')
    }
  }

  // 2. Verify Supabase OTP and redirect according to role
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')

    const cleanToken = otpToken.trim()
    if (!cleanToken) {
      setErrorMsg('Please enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    const res = await verifySupabaseEmailOtp(email, cleanToken)
    setLoading(false)

    if (res.success) {
      const isUserAdmin = Boolean(res.isAdmin || res.user?.role === 'admin')
      if (isUserAdmin) {
        setSuccessNotice('Admin account recognized! Launching Admin Console...')
      } else {
        setSuccessNotice('Signed in successfully! Welcome to Esan Foods.')
      }

      setTimeout(() => {
        onAuthSuccess(res.user, isUserAdmin)
        onClose()
      }, 500)
    } else {
      setErrorMsg(res.error || 'Invalid or expired OTP code.')
    }
  }

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="modal-panel auth-modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Authentication"
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {user ? (
          /* Profile view for already authenticated user */
          <div className="auth-user-profile animate-fade-in">
            <div className="profile-avatar-wrap">
              <img src={user.avatar} alt={user.name} />
            </div>
            <h3 className="profile-name">{user.name}</h3>
            <p className="profile-email">{user.email}</p>

            {user.role === 'admin' ? (
              <div className="admin-status-badge-box">
                <ShieldCheck size={18} className="text-forest" />
                <span>Verified Administrator Account</span>
              </div>
            ) : (
              <div className="loyalty-points-card">
                <div className="points-icon-wrap">
                  <Sparkles size={18} />
                </div>
                <div className="points-info">
                  <span className="points-title">Clean Drink Rewards</span>
                  <span className="points-val">{user.loyaltyPoints || 50} Botanist Points</span>
                </div>
              </div>
            )}

            {user.role === 'admin' && (
              <button
                type="button"
                className="btn-pill-primary w-full flex-center-gap"
                onClick={() => {
                  onOpenAdminDashboard?.()
                  onClose()
                }}
              >
                <LayoutDashboard size={17} />
                <span>Open Admin Console</span>
              </button>
            )}

            <button
              type="button"
              className={user.role === 'admin' ? 'btn-pill-outline w-full' : 'btn-pill-primary w-full'}
              onClick={onClose}
            >
              Continue Browsing
            </button>

            <button
              type="button"
              className="btn-text-logout"
              onClick={() => {
                onLogout()
                onClose()
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Clean Single Sign-in flow */
          <div>
            <div className="auth-header">
              <div className="auth-logo-leaf">🌿</div>
              <h3 className="auth-title">Sign In to Esan Foods</h3>
              <p className="auth-sub">
                Enter your email to receive a secure 6-digit one-time passcode. No password needed.
              </p>
            </div>

            {/* Error & Success Feedback Banners */}
            {errorMsg && (
              <div className="auth-error-alert animate-fade-in">
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successNotice && (
              <div className="auth-success-alert animate-fade-in">
                <CheckCircle2 size={16} />
                <span>{successNotice}</span>
              </div>
            )}

            <div className="otp-flow-container">
              {!otpSent ? (
                /* Step 1: Input Email */
                <form onSubmit={handleSendOtp} className="auth-form">
                  <div className="auth-input-group">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-pill-primary w-full auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Sending OTP Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <Send size={15} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Input Received OTP Token */
                <form onSubmit={handleVerifyOtp} className="auth-form animate-fade-in">
                  <div className="otp-sent-info-box">
                    <span>Code sent to <strong>{email}</strong></span>
                    <button
                      type="button"
                      className="change-email-btn"
                      onClick={() => {
                        setOtpSent(false)
                        setOtpToken('')
                        setErrorMsg('')
                      }}
                    >
                      Change
                    </button>
                  </div>

                  <div className="auth-input-group">
                    <KeyRound size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP code"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      required
                      disabled={loading}
                      maxLength={8}
                      autoFocus
                      className="otp-code-input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-pill-primary w-full auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Verifying with Supabase...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <CheckCircle2 size={16} />
                      </>
                    )}
                  </button>

                  <div className="resend-otp-row">
                    <span>Didn't receive code?</span>
                    <button
                      type="button"
                      className="resend-otp-btn"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
