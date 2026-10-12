import {
  X,
  CheckCircle,
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
  Sparkles,
  QrCode,
  Zap,
  AlertCircle,
  Lock,
  Loader2,
  Clock,
} from 'lucide-react'
import { startRazorpayCheckout } from '../data/razorpayService'
import { checkServiceability } from '../services/shiprocket'

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  discountPercent,
  onOrderSuccess,
  currentUser = null,
}) {
  const [step, setStep] = useState('form') // 'form' or 'success'
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: 'Main Road, Anna Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    zip: '600040',
    paymentMethod: 'razorpay', // Default to Razorpay
  })

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [confirmedPaymentDetails, setConfirmedPaymentDetails] = useState(null)

  // Shiprocket serviceability state
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingServiceable, setShippingServiceable] = useState(null)
  const [shippingRate, setShippingRate] = useState(null)
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState(null)
  const [estimatedDeliveryEtd, setEstimatedDeliveryEtd] = useState(null)
  const [activeCourierName, setActiveCourierName] = useState(null)
  const [shippingCheckError, setShippingCheckError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser?.name || prev.name || '',
        email: currentUser?.email || prev.email || '',
        phone: currentUser?.phone || prev.phone || '',
      }))
      setPaymentError('')
      setIsProcessingPayment(false)
    }
  }, [isOpen, currentUser])

  const totalWeight = cartItems.reduce((sum, item) => {
    const prod = item.product || item
    const itemWeight = Number(prod.weight) > 0 ? Number(prod.weight) : 0.5
    return sum + itemWeight * Number(item.quantity || item.qty || 1)
  }, 0)

  // Verify serviceability whenever pincode, payment method, or weight changes
  useEffect(() => {
    let isCancelled = false
    const cleanZip = String(formData.zip || '').trim()

    if (cleanZip.length !== 6) {
      setShippingServiceable(null)
      setShippingRate(null)
      setEstimatedDeliveryDays(null)
      setEstimatedDeliveryEtd(null)
      setActiveCourierName(null)
      setShippingCheckError('')
      return
    }

    async function verifyZip() {
      setShippingLoading(true)
      setShippingCheckError('')

      try {
        const codFlag = formData.paymentMethod === 'cod' ? 1 : 0
        const couriers = await checkServiceability(cleanZip, totalWeight || 0.5, codFlag)
        if (isCancelled) return

        const courierList = Array.isArray(couriers) ? couriers : couriers?.data || []
        if (courierList.length > 0) {
          const sortedByRate = [...courierList].sort(
            (a, b) => Number(a.rate || 0) - Number(b.rate || 0)
          )
          const sortedBySpeed = [...courierList].sort(
            (a, b) => Number(a.days || 999) - Number(b.days || 999)
          )
          setShippingServiceable(true)
          setShippingRate(Number(sortedByRate[0].rate || 0))
          setActiveCourierName(sortedByRate[0].name || sortedByRate[0].courier_name || '')
          setEstimatedDeliveryDays(sortedBySpeed[0].days ?? null)
          setEstimatedDeliveryEtd(sortedBySpeed[0].etd || null)
        } else {
          setShippingServiceable(false)
          setShippingRate(null)
          setActiveCourierName(null)
          setEstimatedDeliveryDays(null)
          setEstimatedDeliveryEtd(null)
        }
      } catch (err) {
        if (isCancelled) return
        setShippingServiceable(false)
        setShippingCheckError(err.message || 'Serviceability verification failed.')
      } finally {
        if (!isCancelled) setShippingLoading(false)
      }
    }

    const timer = setTimeout(verifyZip, 350)
    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [formData.zip, formData.paymentMethod, totalWeight])

  if (!isOpen) return null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || item.price || 0) * (item.quantity || item.qty || 1),
    0
  )
  const discountAmount = subtotal * (discountPercent / 100)
  const afterDiscount = subtotal - discountAmount
  const calculatedShipping = shippingRate !== null ? shippingRate : 0
  const isFreeShipping = afterDiscount >= 50 || cartItems.length === 0
  const shippingCost = isFreeShipping ? 0 : calculatedShipping
  const tax = afterDiscount * 0.08
  const grandTotal = Math.max(0, afterDiscount + shippingCost + tax)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setPaymentError('')

    // Block order placement when the pincode is not serviceable
    if (shippingServiceable === false) {
      setPaymentError(
        `Shipping is not available to pincode ${formData.zip}. Please enter a serviceable destination pincode.`
      )
      return
    }

    if (!formData.zip || formData.zip.length !== 6) {
      setPaymentError('Please provide a valid 6-digit postal code.')
      return
    }

    // 1. If Razorpay selected: open official Razorpay Checkout popup
    if (formData.paymentMethod === 'razorpay') {
      setIsProcessingPayment(true)

      await startRazorpayCheckout({
        amount: grandTotal,
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: `${formData.address}, ${formData.city} ${formData.zip}`,
        },
        orderRef: `ESN-${Date.now()}`,
        onSuccess: (paymentResult) => {
          setIsProcessingPayment(false)
          setConfirmedPaymentDetails(paymentResult)
          setStep('success')

          onOrderSuccess({
            formData,
            cartItems,
            subtotal,
            discountAmount,
            shippingCost,
            tax,
            grandTotal,
            paymentDetails: paymentResult,
            shippingEstimatedDays: estimatedDeliveryDays,
            shippingCourier: activeCourierName,
          })
        },
        onFailure: (err) => {
          setIsProcessingPayment(false)
          setPaymentError(
            err.message ||
              'Razorpay payment was not completed. You can try again or select another payment option.'
          )
        },
        onDismiss: () => {
          setIsProcessingPayment(false)
        },
      })
      return
    }

    // 2. Direct flow for COD or offline fallback
    setStep('success')
    onOrderSuccess({
      formData,
      cartItems,
      subtotal,
      discountAmount,
      shippingCost,
      tax,
      grandTotal,
      paymentDetails: {
        method: formData.paymentMethod,
        paymentId: `OFFLINE-${Date.now()}`,
        verified: false,
      },
      shippingEstimatedDays: estimatedDeliveryDays,
      shippingCourier: activeCourierName,
    })
  }

  const handleFinish = () => {
    setStep('form')
    setConfirmedPaymentDetails(null)
    onClose()
  }

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="modal-panel checkout-modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Secure Checkout"
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {step === 'success' ? (
          <div className="checkout-success-view animate-fade-in">
            <div className="success-icon-bubble">
              <CheckCircle size={48} className="success-check-icon" />
            </div>
            <h2 className="success-title">Order Confirmed!</h2>
            <p className="success-subtitle">
              Thank you {formData.name ? `${formData.name}` : ''} for choosing Esan Foods. Your authentic pure herbal foods have been scheduled for express delivery.
            </p>

            <div className="order-details-card">
              <div className="order-meta-row">
                <span>Order Reference:</span>
                <strong>#ESN-{Math.floor(100000 + Math.random() * 900000)}</strong>
              </div>

              {confirmedPaymentDetails?.paymentId && (
                <div className="order-meta-row">
                  <span>Razorpay Payment ID:</span>
                  <strong className="text-forest" style={{ fontFamily: 'monospace' }}>
                    {confirmedPaymentDetails.paymentId}
                  </strong>
                </div>
              )}

              <div className="order-meta-row">
                <span>Payment Mode:</span>
                <strong className="text-forest">
                  {formData.paymentMethod === 'razorpay'
                    ? 'Razorpay (Paid Online)'
                    : formData.paymentMethod === 'cod'
                    ? 'Cash on Delivery (Pending)'
                    : 'Online Payment'}
                </strong>
              </div>

              <div className="order-meta-row">
                <span>Customer:</span>
                <strong>
                  {formData.name || 'Verified Customer'} ({formData.email})
                </strong>
              </div>

              <div className="order-meta-row">
                <span>Delivery To:</span>
                <strong>
                  {formData.address}, {formData.city} {formData.zip}
                </strong>
              </div>

              <div className="order-meta-row">
                <span>Estimated Arrival:</span>
                <strong className="text-forest">Tomorrow, by 2:00 PM</strong>
              </div>

              <div className="order-meta-row total-highlight">
                <span>Total Paid:</span>
                <strong>₹{grandTotal.toFixed(2)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="btn-pill-primary w-full"
              onClick={handleFinish}
            >
              <span>Back To Store</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div>
            <div className="checkout-header">
              <div>
                <h2 className="checkout-title">Express Secure Checkout</h2>
                <p className="checkout-subtitle" style={{ fontSize: '0.84rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  Fast & safe payments powered by Razorpay India
                </p>
              </div>
              <div className="security-badge">
                <ShieldCheck size={15} />
                <span>256-Bit SSL Encrypted</span>
              </div>
            </div>

            {paymentError && (
              <div
                className="checkout-error-banner animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#b91c1c',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="checkout-form-grid">
              {/* Shipping Address Section */}
              <div className="form-section-group">
                <h4 className="form-section-title">
                  <Truck size={16} /> Shipping Destination
                </h4>
                <div className="form-row">
                  <div className="form-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Soundarkumar Saravanan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. soundar@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Road, Anna Nagar"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>City</label>
                    <input
                      type="text"
                      placeholder="e.g. Chennai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="e.g. 600040"
                      value={formData.zip}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          zip: e.target.value.replace(/\D/g, '').slice(0, 6),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Serviceability Feedback Indicator */}
                {shippingLoading && (
                  <div className="mt-2 flex items-center gap-2 p-2.5 bg-slate-100 rounded-lg text-xs text-slate-700">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
                    <span>Verifying courier availability for pincode {formData.zip}...</span>
                  </div>
                )}

                {!shippingLoading && shippingServiceable === true && (
                  <div className="mt-2 p-3 bg-white border border-emerald-700/40 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-800 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Serviceable via {activeCourierName || 'Shiprocket'}</span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {isFreeShipping ? 'FREE Shipping' : `Shipping: ₹${shippingCost.toFixed(2)}`}
                      </span>
                    </div>
                    {(estimatedDeliveryDays !== null || estimatedDeliveryEtd) && (
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] pt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Estimated Delivery:{' '}
                          {estimatedDeliveryDays !== null
                            ? `${estimatedDeliveryDays} ${estimatedDeliveryDays === 1 ? 'day' : 'days'}`
                            : estimatedDeliveryEtd}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!shippingLoading && shippingServiceable === false && (
                  <div className="mt-2 p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Delivery not available to pincode {formData.zip}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5">
                      Order placement is blocked until a serviceable destination pincode is entered.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="form-section-group">
                <h4 className="form-section-title">
                  <CreditCard size={16} /> Select Payment Gateway
                </h4>

                <div className="payment-options-grid" style={{ gridTemplateColumns: '1fr' }}>
                  {/* Razorpay Featured Pill */}
                  <label
                    className={`payment-pill-label ${
                      formData.paymentMethod === 'razorpay' ? 'selected' : ''
                    }`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      border:
                        formData.paymentMethod === 'razorpay'
                          ? '2px solid #059669'
                          : '1px solid #cbd5e1',
                      background:
                        formData.paymentMethod === 'razorpay'
                          ? 'rgba(16, 185, 129, 0.06)'
                          : '#ffffff',
                      borderRadius: '14px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={formData.paymentMethod === 'razorpay'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'razorpay' })}
                        style={{ accentColor: '#059669', width: '18px', height: '18px' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.98rem', color: '#1e293b' }}>
                            Razorpay Quick Checkout
                          </strong>
                          <span
                            style={{
                              background: '#10b981',
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              letterSpacing: '0.04em',
                            }}
                          >
                            RECOMMENDED
                          </span>
                        </div>
                        <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                          Google Pay, PhonePe, Paytm, UPI QR, Credit/Debit Cards, NetBanking
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={18} style={{ color: '#059669' }} />
                    </div>
                  </label>

                  {/* Cash on Delivery Alternative */}
                  <label
                    className={`payment-pill-label ${
                      formData.paymentMethod === 'cod' ? 'selected' : ''
                    }`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      border:
                        formData.paymentMethod === 'cod'
                          ? '2px solid #059669'
                          : '1px solid #e2e8f0',
                      background:
                        formData.paymentMethod === 'cod'
                          ? 'rgba(16, 185, 129, 0.06)'
                          : '#ffffff',
                      borderRadius: '14px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                        style={{ accentColor: '#059669', width: '18px', height: '18px' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: '#334155' }}>
                          Cash on Delivery (COD)
                        </strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                          Pay with cash or UPI when your order is delivered to your door
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Summary Strip */}
              <div className="checkout-summary-strip">
                <div className="summary-left">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">
                      Total ({cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} items)
                      {shippingServiceable && (
                        <span> • {isFreeShipping ? 'Free shipping' : `Shipping ₹${shippingCost.toFixed(2)}`}</span>
                      )}
                    </span>
                    <span className="summary-big-total">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-pill-primary checkout-submit-btn"
                  disabled={
                    isProcessingPayment ||
                    shippingLoading ||
                    shippingServiceable === false ||
                    !formData.zip ||
                    formData.zip.length !== 6
                  }
                  style={{ minWidth: '220px' }}
                >
                  {isProcessingPayment ? (
                    <span>Opening Razorpay...</span>
                  ) : shippingLoading ? (
                    <span>Checking Serviceability...</span>
                  ) : shippingServiceable === false ? (
                    <span>Pincode Not Serviceable</span>
                  ) : formData.paymentMethod === 'razorpay' ? (
                    <>
                      <Lock size={15} style={{ marginRight: '4px' }} />
                      <span>Pay ₹{grandTotal.toFixed(2)} with Razorpay</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <span>Place Order (₹{grandTotal.toFixed(2)})</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
