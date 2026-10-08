import React, { useState } from 'react'
import {
  X,
  Lock,
  Mail,
  User,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Send,
  RefreshCw,
} from 'lucide-react'
import {
  checkAdminCredentials,
  sendSupabaseEmailOtp,
  verifySupabaseEmailOtp,
} from '../data/authService'

export default function AuthModal({
  isOpen,
  onClose,
  user,
  onAuthSuccess,
  onLogout,
}) {
  // Mode: 'otp' (Customer Supabase Email OTP) or 'admin' (Admin password auth)
  const [authMode, setAuthMode] = useState('otp') // 'otp' | 'admin'

  // Supabase Email OTP states
  const [email, setEmail] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Admin states
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  // Notifications & Errors
  const [errorMsg, setErrorMsg] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  if (!isOpen) return null

  // Fast fill admin credentials for testing
  const handleFillAdmin = () => {
    setAuthMode('admin')
    setAdminEmail('admin@123')
    setAdminPassword('1212')
    setErrorMsg('')
  }

  // 1. Send Supabase OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')

    if (!email) {
      setErrorMsg('Please enter your email address.')
      return
    }

    // If user typed admin@123 in the OTP field, smoothly switch to Admin mode
    if (email.trim().toLowerCase() === 'admin@123') {
      setAuthMode('admin')
      setAdminEmail('admin@123')
      setAdminPassword('1212')
      setErrorMsg('Detected admin credentials. Switched to Administrator Login.')
      return
    }

    setLoading(true)
    const res = await sendSupabaseEmailOtp(email)
    setLoading(false)

    if (res.success) {
      setOtpSent(true)
      setSuccessNotice(`Verification code sent to ${email}! Please check your inbox.`)
    } else {
      setErrorMsg(res.error || 'Failed to send OTP code.')
    }
  }

  // 2. Verify Supabase OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')

    if (!otpToken) {
      setErrorMsg('Please enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    const res = await verifySupabaseEmailOtp(email, otpToken)
    setLoading(false)

    if (res.success) {
      setSuccessNotice('Email verified successfully! Signing you in...')
      setTimeout(() => {
        onAuthSuccess(res.user, false)
        onClose()
      }, 600)
    } else {
      setErrorMsg(res.error || 'Invalid or expired OTP code.')
    }
  }

  // 3. Admin direct login check
  const handleAdminSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')

    const check = checkAdminCredentials(adminEmail, adminPassword)
    if (check.success && check.isAdmin) {
      setSuccessNotice('Admin Verified! Launching Executive Dashboard...')
      setTimeout(() => {
        onAuthSuccess(check.user, true)
        onClose()
      }, 600)
    } else {
      setErrorMsg('Invalid admin credentials. Use admin@123 with password 1212.')
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
          <div className="auth-user-profile animate-fade-in">
            <div className="profile-avatar-wrap">
              <img src={user.avatar} alt={user.name} />
            </div>
            <h3 className="profile-name">Signed in as {user.name}</h3>
            <p className="profile-email">{user.email}</p>

            {user.role === 'admin' ? (
              <div className="admin-status-badge-box">
                <ShieldCheck size={18} className="text-forest" />
                <span>Verified Administrator Session</span>
              </div>
            ) : (
              <div className="loyalty-points-card">
                <div className="points-icon-wrap">
                  <Sparkles size={18} />
                </div>
                <div className="points-info">
                  <span className="points-title">Clean Drink Rewards</span>
                  <span className="points-val">{user.loyaltyPoints || 340} Botanist Points</span>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn-pill-primary w-full"
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
          <div>
            <div className="auth-header">
              <div className="auth-logo-leaf">🌿</div>
              <h3 className="auth-title">
                {authMode === 'otp' ? 'Sign In with Email OTP' : 'Administrator Portal'}
              </h3>
              <p className="auth-sub">
                {authMode === 'otp'
                  ? 'Passwordless sign in powered by Supabase. We will email you a secure 6-digit code.'
                  : 'Restricted console access for authorized system managers.'}
              </p>
            </div>

            {/* Auth Mode Toggle Pills */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authMode === 'otp' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('otp')
                  setErrorMsg('')
                  setSuccessNotice('')
                }}
              >
                <Mail size={14} />
                <span>Email OTP</span>
              </button>
              <button
                type="button"
                className={`auth-tab ${authMode === 'admin' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('admin')
                  setErrorMsg('')
                  setSuccessNotice('')
                }}
              >
                <ShieldCheck size={14} />
                <span>Admin Login</span>
              </button>
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

            {/* MODE 1: SUPABASE EMAIL OTP */}
            {authMode === 'otp' && (
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
            )}

            {/* MODE 2: ADMIN LOGIN (admin@123 / 1212) */}
            {authMode === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="auth-form animate-fade-in">
                <div className="auth-input-group">
                  <User size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    placeholder="Admin Username (admin@123)"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="auth-input-group">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type="password"
                    placeholder="Admin Password (1212)"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-pill-primary w-full auth-submit-btn">
                  <span>Sign In as Administrator</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Quick helper buttons for testing */}
            <div className="auth-divider">
              <span>Quick Test Shortcuts</span>
            </div>

            <div className="auth-quick-actions">
              <button
                type="button"
                className="quick-admin-login-btn"
                onClick={handleFillAdmin}
                title="Fill admin@123 / 1212"
              >
                <ShieldCheck size={15} />
                <span>Auto-fill Admin (admin@123 / 1212)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
