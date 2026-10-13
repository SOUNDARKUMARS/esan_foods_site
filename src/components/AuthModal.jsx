import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  ArrowRight,
  RefreshCw,
  LayoutDashboard,
  LogIn,
  Key,
  Package,
  Clock,
  Truck,
  ShoppingBag,
  Copy,
  Check,
  MapPin,
  CreditCard,
  RotateCcw,
  FileText,
  Calendar,
  Phone,
  Edit3,
  Loader2,
} from 'lucide-react'
import {
  signInWithEmailPassword,
  registerWithEmailPassword,
  verifySignupOtp,
  resendSignupOtp,
  sendSupabaseEmailOtp,
  verifySupabaseEmailOtp,
  updateUserPhone,
} from '../data/authService'
import { normalizeIndianPhone, isValidIndianPhone } from '../services/shiprocket'
import { fetchUserOrders } from '../data/orderService'
import { supabase } from '../lib/supabase'
import OrderTracking from './OrderTracking'

export default function AuthModal({
  isOpen,
  onClose,
  user,
  onAuthSuccess,
  onLogout,
  onOpenAdminDashboard,
  onAddToCart = null,
}) {
  // Tabs: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('signin')

  // Sign In state (Direct Password login, no OTP)
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [useOtpSignIn, setUseOtpSignIn] = useState(false) // optional OTP fallback for sign-in

  // Sign Up state (Name, Email, Phone, Password, then OTP verification)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPhoneError, setRegPhoneError] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [signupOtpSent, setSignupOtpSent] = useState(false)
  const [signupOtpToken, setSignupOtpToken] = useState('')

  // Account Profile Phone Editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')
  const [profilePhoneError, setProfilePhoneError] = useState('')
  const [profilePhoneSaving, setProfilePhoneSaving] = useState(false)
  const [profilePhoneSuccess, setProfilePhoneSuccess] = useState('')

  // Passwordless OTP Fallback state (for sign-in)
  const [fallbackOtpSent, setFallbackOtpSent] = useState(false)
  const [fallbackOtpToken, setFallbackOtpToken] = useState('')

  // General loading & feedback
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  // Authenticated user tab & orders state
  const [userTab, setUserTab] = useState('profile') // 'profile' | 'orders'
  const [userOrders, setUserOrders] = useState([])
  const [userOrdersLoading, setUserOrdersLoading] = useState(false)
  const [copiedOrderId, setCopiedOrderId] = useState(null)

  const handleCopyId = (id, e) => {
    e?.stopPropagation()
    navigator.clipboard?.writeText(id)
    setCopiedOrderId(id)
    setTimeout(() => setCopiedOrderId(null), 2000)
  }

  const handleReorder = (ord, e) => {
    e?.stopPropagation()
    if (onAddToCart && Array.isArray(ord.items)) {
      ord.items.forEach((it) => {
        onAddToCart(
          {
            id: it.productId || it.id || 'drink-' + Math.random(),
            name: it.name,
            price: Number(it.price) || 0,
            image: it.image || '/src/assets/guava_can.jpg',
            volume: it.volume || '330ml',
          },
          Number(it.qty) || 1
        )
      })
      onClose()
    }
  }

  const handleDownloadInvoice = (ord, e) => {
    e?.stopPropagation()
    const invoiceWindow = window.open('', '_blank')
    if (!invoiceWindow) return
    const itemsHtml = (ord.items || [])
      .map(
        (it) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${it.name}</strong> <span style="color:#64748b;">(${it.volume || '330ml'})</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${it.qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(it.price).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${((Number(it.price) || 0) * (Number(it.qty) || 1)).toFixed(2)}</td>
      </tr>`
      )
      .join('')

    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${ord.id} - Esan Foods</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 36px; color: #1b2d18; max-width: 680px; margin: 0 auto; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 18px; }
          .logo { font-size: 24px; font-weight: 800; color: #059669; }
          .meta { margin: 24px 0; display: flex; justify-content: space-between; font-size: 13px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13.5px; }
          th { background: #f0fdf4; padding: 10px; text-align: left; font-weight: 700; border-bottom: 1px solid #bbf7d0; }
          .total-box { margin-top: 16px; text-align: right; font-size: 13.5px; }
          .grand-total { font-size: 18px; font-weight: 800; color: #059669; margin-top: 8px; border-top: 1px solid #bbf7d0; padding-top: 6px; }
          .footer { margin-top: 36px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #eee; padding-top: 16px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">🌿 Esan Foods</div>
            <div style="font-size: 13px; color: #64748b;">Authentic Herbal Goodness</div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 20px; color: #0f172a;">TAX INVOICE</h2>
            <div style="font-size: 13px; font-weight: 700; color: #059669;">#${ord.id}</div>
          </div>
        </div>
        <div class="meta">
          <div>
            <strong style="color: #0f172a;">Billed & Delivered To:</strong><br>
            ${ord.customer?.name || user?.name || 'Valued Customer'}<br>
            ${ord.customer?.email || user?.email || ''}<br>
            ${ord.shippingAddress || 'Express Delivery'}${ord.shippingCity ? `, ${ord.shippingCity}` : ''} ${ord.shippingZip || ''}
          </div>
          <div style="text-align: right;">
            <strong>Order Placed:</strong> ${ord.date}<br>
            <strong>Payment Method:</strong> ${ord.paymentMethod || 'Credit Card'}<br>
            <strong>Payment Status:</strong> <span style="color: #059669; font-weight: 700;">Paid</span><br>
            <strong>Status:</strong> ${ord.status}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="total-box">
          <div>Subtotal: ₹${Number(ord.subtotal).toFixed(2)}</div>
          ${Number(ord.discountAmount) > 0 ? `<div style="color: #059669;">Promo Discount (${ord.discountCode || 'FRESH'}): -₹${Number(ord.discountAmount).toFixed(2)}</div>` : ''}
          <div>Carbon-Neutral Shipping: ${Number(ord.shippingCost) === 0 ? '<strong style="color:#059669;">FREE</strong>' : '₹' + Number(ord.shippingCost).toFixed(2)}</div>
          <div>Estimated Tax (8%): ₹${Number(ord.taxAmount).toFixed(2)}</div>
          <div class="grand-total">Total Amount: ₹${Number(ord.total).toFixed(2)}</div>
        </div>
        <div class="footer">
          Thank you for choosing Esan Foods! Stay refreshed and energized naturally.
        </div>
        <div class="no-print" style="margin-top: 24px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; background: #059669; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
            Print / Save Receipt
          </button>
        </div>
      </body>
      </html>
    `)
    invoiceWindow.document.close()
  }

  // Fetch real-time orders from Supabase for this logged-in user
  useEffect(() => {
    if (!isOpen || !user) return

    let isMounted = true
    async function loadOrders() {
      setUserOrdersLoading(true)
      try {
        const ords = await fetchUserOrders(user.supabaseId || user.id, user.email)
        if (isMounted) setUserOrders(ords)
      } catch (err) {
        console.error('Failed to load user orders:', err)
      } finally {
        if (isMounted) setUserOrdersLoading(false)
      }
    }

    loadOrders()

    const ordersChannel = supabase
      .channel('user:orders:modal:' + (user.supabaseId || user.id || 'me'))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async () => {
          const fresh = await fetchUserOrders(user.supabaseId || user.id, user.email)
          if (isMounted) setUserOrders(fresh)
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(ordersChannel)
    }
  }, [isOpen, user])

  if (!isOpen) return null

  // Reset errors and intermediate states when switching tabs
  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setErrorMsg('')
    setSuccessNotice('')
    setUseOtpSignIn(false)
    setFallbackOtpSent(false)
    setFallbackOtpToken('')
  }

  // -------------------------------------------------------------
  // 1. SIGN IN WITH EMAIL & PASSWORD (NO OTP NEEDED)
  // -------------------------------------------------------------
  const handlePasswordSignIn = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')

    const cleanEmail = signInEmail.trim()
    const cleanPassword = signInPassword.trim()

    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.')
      return
    }
    if (!cleanPassword) {
      setErrorMsg('Please enter your password.')
      return
    }

    setLoading(true)
    const res = await signInWithEmailPassword(cleanEmail, cleanPassword)
    setLoading(false)

    if (res.success) {
      const isUserAdmin = Boolean(res.isAdmin || res.user?.role === 'admin')
      if (isUserAdmin) {
        setSuccessNotice('Admin credentials recognized! Launching Admin Console...')
      } else {
        setSuccessNotice('Signed in successfully! Welcome back to Esan Foods.')
      }

      setTimeout(() => {
        onAuthSuccess(res.user, isUserAdmin)
        onClose()
      }, 500)
    } else {
      if (res.unconfirmed) {
        // Switch to OTP verification for this unconfirmed email
        setRegEmail(cleanEmail)
        setActiveTab('signup')
        setSignupOtpSent(true)
        setErrorMsg('Please verify the 6-digit OTP sent to your email to activate your account.')
      } else {
        setErrorMsg(res.error || 'Invalid email or password.')
      }
    }
  }

  // -------------------------------------------------------------
  // PROFILE PHONE EDITING
  // -------------------------------------------------------------
  const handleSaveProfilePhone = async (e) => {
    e.preventDefault()
    setProfilePhoneError('')
    setProfilePhoneSuccess('')

    const clean = normalizeIndianPhone(profilePhone)
    if (!clean) {
      setProfilePhoneError('Mobile phone number is required.')
      return
    }
    if (!isValidIndianPhone(clean)) {
      setProfilePhoneError('Please enter a valid 10-digit Indian mobile number (starts with 6-9).')
      return
    }

    setProfilePhoneSaving(true)
    const res = await updateUserPhone(clean)
    setProfilePhoneSaving(false)

    if (res.success && res.user) {
      setProfilePhoneSuccess('Mobile number updated successfully.')
      setIsEditingPhone(false)
      onAuthSuccess?.(res.user, res.user.role === 'admin')
      setTimeout(() => setProfilePhoneSuccess(''), 3500)
    } else {
      setProfilePhoneError(res.error || 'Failed to update mobile number.')
    }
  }

  // -------------------------------------------------------------
  // 2. SIGN UP WITH NAME, EMAIL, PHONE & PASSWORD (TRIGGER OTP)
  // -------------------------------------------------------------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')
    setRegPhoneError('')

    const cleanName = regName.trim()
    const cleanEmail = regEmail.trim()
    const cleanPhone = normalizeIndianPhone(regPhone)
    const cleanPassword = regPassword.trim()
    const cleanConfirm = regConfirmPassword.trim()

    if (!cleanEmail) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (!cleanPhone) {
      setRegPhoneError('Mobile number is required to register.')
      setErrorMsg('Mobile number is required to create an account.')
      return
    }
    if (!isValidIndianPhone(cleanPhone)) {
      setRegPhoneError('Please enter a valid 10-digit Indian mobile number (starts with 6-9).')
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.')
      return
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }
    if (cleanPassword !== cleanConfirm) {
      setErrorMsg('Passwords do not match. Please re-check.')
      return
    }

    setLoading(true)
    const res = await registerWithEmailPassword(cleanName, cleanEmail, cleanPassword, cleanPhone)
    setLoading(false)

    if (res.success) {
      if (res.needsOtp) {
        setSignupOtpSent(true)
        setSuccessNotice('')
      } else {
        // Direct signup without OTP confirmation (if Supabase config didn't enforce it)
        setSuccessNotice('Account registered successfully! Welcome to Esan Foods.')
        setTimeout(() => {
          onAuthSuccess(res.user, res.isAdmin)
          onClose()
        }, 500)
      }
    } else {
      setErrorMsg(res.error || 'Registration failed.')
    }
  }

  // -------------------------------------------------------------
  // 3. VERIFY SIGNUP OTP (ONE TIME ON REGISTRATION)
  // -------------------------------------------------------------
  const handleVerifySignupOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')

    const cleanToken = signupOtpToken.trim()
    if (!cleanToken) {
      setErrorMsg('Please enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    const res = await verifySignupOtp(regEmail, cleanToken)
    setLoading(false)

    if (res.success) {
      const isUserAdmin = Boolean(res.isAdmin || res.user?.role === 'admin')
      setSuccessNotice('Account verified and registered! You can now log in anytime using your password.')

      setTimeout(() => {
        onAuthSuccess(res.user, isUserAdmin)
        onClose()
      }, 700)
    } else {
      setErrorMsg(res.error || 'Invalid or expired OTP code.')
    }
  }

  // Resend Signup OTP
  const handleResendSignupOtp = async () => {
    setErrorMsg('')
    setResending(true)
    const res = await resendSignupOtp(regEmail)
    setResending(false)

    if (res.success) {
      setSuccessNotice(`A fresh verification code was sent to ${regEmail}.`)
    } else {
      setErrorMsg(res.error || 'Failed to resend code.')
    }
  }

  // -------------------------------------------------------------
  // 4. OPTIONAL OTP SIGN-IN FALLBACK (FOR FORGOT PASSWORD / PASSWORDLESS)
  // -------------------------------------------------------------
  const handleSendFallbackOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')

    const cleanEmail = signInEmail.trim()
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.')
      return
    }

    setLoading(true)
    const res = await sendSupabaseEmailOtp(cleanEmail)
    setLoading(false)

    if (res.success) {
      setFallbackOtpSent(true)
      setSuccessNotice('')
    } else {
      setErrorMsg(res.error || 'Failed to send OTP code.')
    }
  }

  const handleVerifyFallbackOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessNotice('')

    const cleanToken = fallbackOtpToken.trim()
    if (!cleanToken) {
      setErrorMsg('Please enter the 6-digit OTP code.')
      return
    }

    setLoading(true)
    const res = await verifySupabaseEmailOtp(signInEmail, cleanToken)
    setLoading(false)

    if (res.success) {
      const isUserAdmin = Boolean(res.isAdmin || res.user?.role === 'admin')
      setSuccessNotice('Signed in successfully!')
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
        className={`modal-panel auth-modal-panel ${user && userTab === 'orders' ? 'orders-active-modal' : ''}`}
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
          /* Profile & Orders view for already authenticated user */
          <div className="auth-user-profile animate-fade-in">
            {/* Top Navigation Tabs: Profile vs Orders */}
            <div className="auth-nav-tabs-bar">
              <button
                type="button"
                className={`auth-nav-tab-btn ${userTab === 'profile' ? 'active' : ''}`}
                onClick={() => setUserTab('profile')}
              >
                <User size={15} />
                <span>My Profile</span>
              </button>
              <button
                type="button"
                className={`auth-nav-tab-btn ${userTab === 'orders' ? 'active' : ''}`}
                onClick={() => setUserTab('orders')}
              >
                <Package size={15} />
                <span>My Orders</span>
                {userOrders.length > 0 && (
                  <span className="auth-tab-count-badge">{userOrders.length}</span>
                )}
              </button>
            </div>

            {userTab === 'profile' ? (
              /* TAB 1: Profile View */
              <div className="animate-fade-in">
                <div className="profile-avatar-wrap">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <User size={34} />
                    </div>
                  )}
                </div>
                <h3 className="profile-name">{user.name}</h3>
                <p className="profile-email">{user.email}</p>

                {/* Account Mobile Phone Section */}
                <div
                  className="profile-phone-card"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    margin: '12px 0 16px',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: isEditingPhone ? '8px' : '0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={15} style={{ color: '#059669', flexShrink: 0 }} />
                      <div>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Mobile Number
                        </span>
                        {!isEditingPhone && (
                          <span
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              color: user.phone ? '#0f172a' : '#94a3b8',
                            }}
                          >
                            {user.phone ? `+91 ${user.phone}` : 'Not provided yet'}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isEditingPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPhone(true)
                          setProfilePhone(user.phone || '')
                          setProfilePhoneError('')
                          setProfilePhoneSuccess('')
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#059669',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        <Edit3 size={13} />
                        <span>{user.phone ? 'Edit' : 'Add Phone'}</span>
                      </button>
                    )}
                  </div>

                  {isEditingPhone && (
                    <form onSubmit={handleSaveProfilePhone} style={{ marginTop: '6px' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="Enter 10-digit mobile number"
                          value={profilePhone}
                          onChange={(e) => {
                            setProfilePhone(e.target.value)
                            if (profilePhoneError && isValidIndianPhone(e.target.value)) {
                              setProfilePhoneError('')
                            }
                          }}
                          disabled={profilePhoneSaving}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '0.86rem',
                            border: profilePhoneError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                            borderRadius: '8px',
                            background: '#ffffff',
                            color: '#0f172a',
                            outline: 'none',
                          }}
                          autoFocus
                        />
                      </div>
                      {profilePhoneError && (
                        <p
                          style={{
                            color: '#b91c1c',
                            fontSize: '0.74rem',
                            marginTop: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {profilePhoneError}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          type="submit"
                          disabled={profilePhoneSaving}
                          className="btn-pill-primary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          {profilePhoneSaving ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Save Number</span>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={profilePhoneSaving}
                          onClick={() => {
                            setIsEditingPhone(false)
                            setProfilePhoneError('')
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '9999px',
                            color: '#475569',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {profilePhoneSuccess && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#059669',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        marginTop: '6px',
                      }}
                    >
                      <CheckCircle2 size={13} />
                      <span>{profilePhoneSuccess}</span>
                    </div>
                  )}
                </div>

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
                      <span className="points-title">Organic Food Rewards</span>
                      <span className="points-val">{user.loyaltyPoints || 50} Wellness Points</span>
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

                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <Link
                    to="/delete-account"
                    onClick={onClose}
                    style={{ fontSize: '0.76rem', color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.target.style.color = '#dc2626')}
                    onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
                  >
                    Data Privacy & Delete Account
                  </Link>
                </div>
              </div>
            ) : (
              /* TAB 2: User Live Orders View */
              <div className="user-orders-view animate-fade-in">
                {userOrdersLoading ? (
                  <div style={{ textAlign: 'center', padding: '36px 10px' }}>
                    <div className="media-spinner" style={{ margin: '0 auto 12px' }}></div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      Retrieving your orders from database...
                    </p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="user-orders-empty">
                    <div className="empty-orders-icon-wrap">
                      <ShoppingBag size={28} />
                    </div>
                    <h4 className="empty-orders-title">No Orders Placed Yet</h4>
                    <p className="empty-orders-sub">
                      You haven't ordered any of our authentic herbal juices yet. Discover our fresh cold-pressed bottled goodness!
                    </p>
                    <button
                      type="button"
                      className="btn-pill-primary"
                      onClick={() => {
                        onClose()
                        document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      <span>Explore Collections</span>
                    </button>
                  </div>
                ) : (
                  userOrders.map((ord) => {
                    const stepIdx = ord.status === 'Delivered' ? 4 : ord.status === 'Shipped' ? 3 : ord.status === 'Processing' ? 2 : 1
                    return (
                      <div key={ord.id} className="user-order-card">
                        {/* Order Header: ID, Date, Status */}
                        <div className="user-order-header">
                          <div className="order-header-left">
                            <div className="order-code-row">
                              <span className="order-code-badge">#{ord.id}</span>
                              <button
                                type="button"
                                className="order-copy-id-btn"
                                onClick={(e) => handleCopyId(ord.id, e)}
                                title="Copy Order ID"
                              >
                                {copiedOrderId === ord.id ? (
                                  <>
                                    <Check size={11} className="text-emerald-600" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="order-date-row">
                              <Calendar size={12} className="text-muted" />
                              <span>{ord.date}</span>
                            </div>
                          </div>

                          <div className="order-header-right">
                            <span className={`status-badge-chip status-${ord.status.toLowerCase()}`}>
                              {ord.status === 'Processing' && <Clock size={12} />}
                              {ord.status === 'Shipped' && <Truck size={12} />}
                              {ord.status === 'Delivered' && <CheckCircle2 size={12} />}
                              {ord.status === 'Cancelled' && <X size={12} />}
                              <span>{ord.status}</span>
                            </span>
                            <span className="order-arrival-est">
                              {ord.status === 'Delivered'
                                ? 'Delivered'
                                : ord.status === 'Cancelled'
                                ? 'Cancelled'
                                : ord.status === 'Shipped'
                                ? 'On The Way'
                                : 'Est. Delivery: Tomorrow, 2 PM'}
                            </span>
                          </div>
                        </div>

                        {/* Order Fulfillment Stepper */}
                        {ord.status !== 'Cancelled' && (
                          <div className="order-timeline-stepper">
                            <div className="stepper-track-bar">
                              <div
                                className="stepper-fill-bar"
                                style={{
                                  width:
                                    stepIdx === 4
                                      ? '100%'
                                      : stepIdx === 3
                                      ? '66%'
                                      : stepIdx === 2
                                      ? '33%'
                                      : '10%',
                                }}
                              ></div>
                            </div>
                            <div className="stepper-nodes-row">
                              <div className={`stepper-node ${stepIdx >= 1 ? 'completed' : ''}`}>
                                <div className="node-circle">
                                  {stepIdx > 1 ? <Check size={10} /> : <span className="node-dot" />}
                                </div>
                                <span className="node-label">Placed</span>
                              </div>
                              <div className={`stepper-node ${stepIdx >= 2 ? 'completed' : ''}`}>
                                <div className="node-circle">
                                  {stepIdx > 2 ? <Check size={10} /> : <span className="node-dot" />}
                                </div>
                                <span className="node-label">Confirmed</span>
                              </div>
                              <div className={`stepper-node ${stepIdx >= 3 ? 'completed' : ''}`}>
                                <div className="node-circle">
                                  {stepIdx > 3 ? <Check size={10} /> : <span className="node-dot" />}
                                </div>
                                <span className="node-label">In Transit</span>
                              </div>
                              <div className={`stepper-node ${stepIdx >= 4 ? 'completed' : ''}`}>
                                <div className="node-circle">
                                  {stepIdx >= 4 ? <Check size={10} /> : <span className="node-dot" />}
                                </div>
                                <span className="node-label">Delivered</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Items In This Order */}
                        <div className="user-order-items-snippet">
                          <div className="order-items-header">
                            <span>Items in this order ({ord.items ? ord.items.reduce((s, i) => s + (Number(i.qty) || 1), 0) : 0})</span>
                          </div>
                          {ord.items && ord.items.map((it, idx) => {
                            const itemImg = it.image || (it.productId === 'coconut-water' ? '/src/assets/coconut_can.jpg' : '/src/assets/guava_can.jpg')
                            const itemUnitPrice = Number(it.price) || 0
                            const itemQty = Number(it.qty) || 1
                            return (
                              <div key={idx} className="user-order-item-card">
                                <div className="order-item-thumb-box">
                                  <img
                                    src={itemImg}
                                    alt={it.name}
                                    onError={(e) => {
                                      e.target.onerror = null
                                      e.target.src = '/src/assets/guava_can.jpg'
                                    }}
                                  />
                                </div>
                                <div className="order-item-info">
                                  <h5 className="order-item-title">{it.name}</h5>
                                  <div className="order-item-meta-pills">
                                    <span className="order-item-volume-pill">{it.volume || '330ml Can'}</span>
                                    <span className="order-item-qty-pill">Qty: {itemQty}</span>
                                    <span className="order-item-unit-cost">₹{itemUnitPrice.toFixed(2)} each</span>
                                  </div>
                                </div>
                                <div className="order-item-price-col">
                                  <strong className="order-item-line-total">
                                    ₹{(itemUnitPrice * itemQty).toFixed(2)}
                                  </strong>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Delivery Destination & Payment Breakdown */}
                        <div className="user-order-details-grid">
                          <div className="order-info-column">
                            <div className="order-info-title">
                              <MapPin size={13} className="text-forest" />
                              <span>Delivery Destination</span>
                            </div>
                            <div className="order-address-box">
                              <strong>{ord.customer?.name || user?.name || 'Valued Customer'}</strong>
                              <p>{ord.shippingAddress || 'Express Delivery'}{ord.shippingCity ? `, ${ord.shippingCity}` : ''} {ord.shippingZip || ''}</p>
                              <span className="order-shipping-tag">🌿 Carbon-Neutral Express Shipping</span>
                            </div>
                          </div>

                          <div className="order-info-column">
                            <div className="order-info-title">
                              <CreditCard size={13} className="text-forest" />
                              <span>Payment & Total Breakdown</span>
                            </div>
                            <div className="order-breakdown-box">
                              <div className="breakdown-line">
                                <span>Payment Method</span>
                                <span className="payment-chip-pill">
                                  <Check size={10} className="text-emerald-600" />
                                  {ord.paymentMethod || 'Credit Card'} (Paid)
                                </span>
                              </div>
                              <div className="breakdown-line">
                                <span>Subtotal</span>
                                <span>₹{Number(ord.subtotal).toFixed(2)}</span>
                              </div>
                              {Number(ord.discountAmount) > 0 && (
                                <div className="breakdown-line discount-text">
                                  <span>Discount {ord.discountCode ? `(${ord.discountCode})` : ''}</span>
                                  <span>-₹{Number(ord.discountAmount).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="breakdown-line">
                                <span>Shipping</span>
                                <span>{Number(ord.shippingCost) === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${Number(ord.shippingCost).toFixed(2)}`}</span>
                              </div>
                              <div className="breakdown-line">
                                <span>Estimated Tax (8%)</span>
                                <span>₹{Number(ord.taxAmount).toFixed(2)}</span>
                              </div>
                              <div className="breakdown-line grand-total-line">
                                <span>Total Paid</span>
                                <strong className="total-highlight-val">₹{Number(ord.total).toFixed(2)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Shipment Tracking View */}
                        <OrderTracking
                          awb={ord.awbCode || ord.awb_code}
                          orderId={ord.id}
                          shippingStatus={ord.shippingStatus || ord.shipping_status}
                          className="mt-3 mb-1"
                        />

                        {/* Order Actions: Buy Again, Invoice */}
                        <div className="user-order-footer-actions">
                          <button
                            type="button"
                            className="order-action-btn secondary"
                            onClick={(e) => handleDownloadInvoice(ord, e)}
                            title="Print or view invoice"
                          >
                            <FileText size={13} />
                            <span>Invoice / Receipt</span>
                          </button>

                          <button
                            type="button"
                            className="order-action-btn primary"
                            onClick={(e) => handleReorder(ord, e)}
                            title="Add items from this order to cart"
                          >
                            <RotateCcw size={13} />
                            <span>Buy Again</span>
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        ) : (
          /* Authentication Screen */
          <div>
            <div className="auth-header">
              <div className="auth-logo-leaf">🌿</div>
              <h3 className="auth-title">
                {activeTab === 'signin'
                  ? useOtpSignIn
                    ? 'OTP Sign In'
                    : 'Sign In to Esan Foods'
                  : signupOtpSent
                    ? 'Verify Your Email'
                    : 'Create Your Account'}
              </h3>
              <p className="auth-sub">
                {activeTab === 'signin'
                  ? useOtpSignIn
                    ? 'Enter your email to receive a temporary sign-in code.'
                    : 'Sign in to your account with your email & password.'
                  : signupOtpSent
                    ? 'Enter the 6-digit verification code to activate your account.'
                    : 'Create your account to order and track shipments.'}
              </p>
            </div>

            {/* Tabs switcher: Sign In vs Create Account */}
            {!signupOtpSent && !useOtpSignIn && (
              <div className="auth-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'signin'}
                  className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
                  onClick={() => handleTabSwitch('signin')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'signup'}
                  className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                  onClick={() => handleTabSwitch('signup')}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error & Success Feedback Banners */}
            {errorMsg && (
              <div className="auth-error-alert animate-fade-in" role="alert">
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successNotice && (
              <div className="auth-success-alert animate-fade-in" role="status">
                <CheckCircle2 size={16} />
                <span>{successNotice}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 1: SIGN IN FLOW (DIRECT PASSWORD - NO OTP)             */}
            {/* ========================================================= */}
            {activeTab === 'signin' && !useOtpSignIn && (
              <form onSubmit={handlePasswordSignIn} className="auth-form animate-fade-in">
                <div className="auth-input-group">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    id="signin-email"
                    name="email"
                    autoComplete="username"
                    placeholder="Enter your email address"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="auth-input-group">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    id="signin-password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-pw-btn"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="auth-options-row">
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => {
                      setUseOtpSignIn(true)
                      setErrorMsg('')
                      setSuccessNotice('')
                    }}
                  >
                    Forgot password or use OTP?
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn-pill-primary w-full auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <LogIn size={15} />
                    </>
                  )}
                </button>

                <div className="auth-switch-prompt">
                  Don't have an account?
                  <button type="button" onClick={() => handleTabSwitch('signup')}>
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {/* Optional Fallback: Sign in with OTP (if user forgot password) */}
            {activeTab === 'signin' && useOtpSignIn && (
              <div className="animate-fade-in">
                {!fallbackOtpSent ? (
                  <form onSubmit={handleSendFallbackOtp} className="auth-form">
                    <div className="auth-input-group">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
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
                          <span>Send Sign-In Code</span>
                          <Key size={15} />
                        </>
                      )}
                    </button>

                    <div className="auth-switch-prompt">
                      <button
                        type="button"
                        onClick={() => {
                          setUseOtpSignIn(false)
                          setErrorMsg('')
                        }}
                      >
                        ← Back to Password Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyFallbackOtp} className="auth-form">
                    <div className="otp-sent-info-box">
                      <span>Code sent to <strong>{signInEmail}</strong></span>
                      <button
                        type="button"
                        className="change-email-btn"
                        onClick={() => {
                          setFallbackOtpSent(false)
                          setFallbackOtpToken('')
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
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter 6-digit OTP code"
                        value={fallbackOtpToken}
                        onChange={(e) => setFallbackOtpToken(e.target.value)}
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
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Sign In</span>
                          <CheckCircle2 size={16} />
                        </>
                      )}
                    </button>

                    <div className="auth-switch-prompt">
                      <button
                        type="button"
                        onClick={() => {
                          setUseOtpSignIn(false)
                          setFallbackOtpSent(false)
                          setErrorMsg('')
                        }}
                      >
                        ← Back to Password Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: SIGN UP FLOW (NAME, EMAIL, PASSWORD -> OTP VERIFY) */}
            {/* ========================================================= */}
            {activeTab === 'signup' && (
              <div className="animate-fade-in">
                {!signupOtpSent ? (
                  /* Step 1: Registration Form with Name, Email & Password */
                  <form onSubmit={handleRegisterSubmit} className="auth-form">
                    <div className="auth-input-group">
                      <User size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        id="signup-name"
                        name="name"
                        autoComplete="name"
                        placeholder="Full Name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        disabled={loading}
                        autoFocus
                      />
                    </div>

                    <div className="auth-input-group">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        id="signup-email"
                        name="email"
                        autoComplete="email"
                        placeholder="Email Address"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="auth-input-group">
                      <Phone size={16} className="auth-input-icon" />
                      <input
                        type="tel"
                        id="signup-phone"
                        name="phone"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="Mobile Number (10-Digit Indian Mobile) *"
                        value={regPhone}
                        onChange={(e) => {
                          setRegPhone(e.target.value)
                          if (regPhoneError && isValidIndianPhone(e.target.value)) {
                            setRegPhoneError('')
                          }
                        }}
                        required
                        disabled={loading}
                      />
                    </div>
                    {regPhoneError && (
                      <p
                        style={{
                          color: '#b91c1c',
                          fontSize: '0.75rem',
                          marginTop: '-6px',
                          marginBottom: '8px',
                          paddingLeft: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {regPhoneError}
                      </p>
                    )}

                    <div className="auth-input-group">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        id="signup-password"
                        name="password"
                        autoComplete="new-password"
                        placeholder="Create Password (min. 6 characters)"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-pw-btn"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="auth-input-group">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        id="signup-confirm-password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        placeholder="Confirm Password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>

                    <p className="auth-password-hint">
                      At least 6 characters. You will use this password to sign in.
                    </p>

                    <button
                      type="submit"
                      className="btn-pill-primary w-full auth-submit-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Register & Verify with OTP</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>

                    <div className="auth-switch-prompt">
                      Already have an account?
                      <button type="button" onClick={() => handleTabSwitch('signin')}>
                        Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Input Received OTP Token for Registration */
                  <form onSubmit={handleVerifySignupOtp} className="auth-form animate-fade-in">
                    <div className="otp-sent-info-box">
                      <span>Code sent to <strong>{regEmail}</strong></span>
                      <button
                        type="button"
                        className="change-email-btn"
                        onClick={() => {
                          setSignupOtpSent(false)
                          setSignupOtpToken('')
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
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter 6-digit verification code"
                        value={signupOtpToken}
                        onChange={(e) => setSignupOtpToken(e.target.value)}
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
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Complete Registration</span>
                          <CheckCircle2 size={16} />
                        </>
                      )}
                    </button>

                    <div className="resend-otp-row">
                      <span>Didn't receive code?</span>
                      <button
                        type="button"
                        className="resend-otp-btn"
                        onClick={handleResendSignupOtp}
                        disabled={resending || loading}
                      >
                        {resending ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>


                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
