import React, { useState } from 'react'
import { X, CheckCircle, ShieldCheck, Truck, CreditCard, ArrowRight, Sparkles } from 'lucide-react'

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  discountPercent,
  onOrderSuccess,
}) {
  const [step, setStep] = useState('form') // 'form' or 'success'
  const [formData, setFormData] = useState({
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    address: '742 Evergreen Terrace',
    city: 'San Francisco',
    zip: '94102',
    paymentMethod: 'card',
  })

  if (!isOpen) return null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const discountAmount = subtotal * (discountPercent / 100)
  const afterDiscount = subtotal - discountAmount
  const shippingCost = afterDiscount >= 50 || cartItems.length === 0 ? 0 : 4.99
  const tax = afterDiscount * 0.08
  const grandTotal = Math.max(0, afterDiscount + shippingCost + tax)

  const handleSubmit = (e) => {
    e.preventDefault()
    setStep('success')
    onOrderSuccess()
  }

  const handleFinish = () => {
    setStep('form')
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
              Thank you for choosing Juicera. Your fresh organic drinks have been scheduled for carbon-neutral express delivery.
            </p>

            <div className="order-details-card">
              <div className="order-meta-row">
                <span>Order Reference:</span>
                <strong>#JCR-{Math.floor(100000 + Math.random() * 900000)}</strong>
              </div>
              <div className="order-meta-row">
                <span>Delivery To:</span>
                <strong>{formData.address}, {formData.city}</strong>
              </div>
              <div className="order-meta-row">
                <span>Estimated Arrival:</span>
                <strong className="text-forest">Tomorrow, by 2:00 PM</strong>
              </div>
              <div className="order-meta-row total-highlight">
                <span>Total Paid:</span>
                <strong>${grandTotal.toFixed(2)}</strong>
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
              <h2 className="checkout-title">Express Secure Checkout</h2>
              <div className="security-badge">
                <ShieldCheck size={15} />
                <span>256-Bit SSL Encrypted</span>
              </div>
            </div>

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
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
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
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="form-section-group">
                <h4 className="form-section-title">
                  <CreditCard size={16} /> Payment Method
                </h4>
                <div className="payment-options-grid">
                  <label className={`payment-pill-label ${formData.paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === 'card'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'card' })}
                    />
                    <span>Credit / Debit Card</span>
                  </label>
                  <label className={`payment-pill-label ${formData.paymentMethod === 'apple' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === 'apple'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'apple' })}
                    />
                    <span>Apple Pay</span>
                  </label>
                </div>
              </div>

              {/* Order Summary Strip */}
              <div className="checkout-summary-strip">
                <div className="summary-left">
                  <span>Order Total ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items):</span>
                  <span className="summary-big-total">${grandTotal.toFixed(2)}</span>
                </div>
                <button type="submit" className="btn-pill-primary checkout-submit-btn">
                  <span>Place Order (${grandTotal.toFixed(2)})</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
