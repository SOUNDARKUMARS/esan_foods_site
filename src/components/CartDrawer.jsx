import React, { useState } from 'react'
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles, Tag, Check } from 'lucide-react'

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
  discountCode,
  discountPercent,
  onApplyDiscount,
}) {
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState('')

  if (!isOpen) return null

  // Calculate pricing
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const discountAmount = subtotal * (discountPercent / 100)
  const afterDiscount = subtotal - discountAmount
  const freeShippingThreshold = 50.0
  const isFreeShipping = afterDiscount >= freeShippingThreshold || cartItems.length === 0
  const shippingCost = cartItems.length === 0 ? 0 : isFreeShipping ? 0 : 4.99
  const tax = afterDiscount * 0.08
  const grandTotal = Math.max(0, afterDiscount + shippingCost + tax)

  const progressPercent = Math.min(100, (afterDiscount / freeShippingThreshold) * 100)
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - afterDiscount).toFixed(2)

  const handleApplyPromo = (e) => {
    e.preventDefault()
    const code = promoInput.trim().toUpperCase()
    if (code === 'REFRESH10' || code === 'FRESH15' || code === 'SUMMER20') {
      const percent = code === 'SUMMER20' ? 20 : code === 'FRESH15' ? 15 : 10
      onApplyDiscount(code, percent)
      setPromoError('')
      setPromoInput('')
    } else {
      setPromoError('Invalid coupon code. Try FRESH15 or REFRESH10')
    }
  }

  return (
    <div className="cart-drawer-overlay animate-fade-in" onClick={onClose}>
      <div
        className="cart-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Your Shopping Cart"
      >
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-title-wrap">
            <ShoppingBag size={20} className="cart-title-icon" />
            <h3 className="cart-drawer-title">Your Fresh Box</h3>
            <span className="cart-count-pill">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)} items
            </span>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={onClose}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Meter */}
        <div className="cart-shipping-meter">
          <div className="meter-text">
            {isFreeShipping && cartItems.length > 0 ? (
              <span className="free-shipping-unlocked">
                🎉 You've unlocked <strong>FREE Carbon-Neutral Shipping</strong>!
              </span>
            ) : (
              <span>
                Add <strong>${amountToFreeShipping}</strong> more for <strong>FREE Shipping</strong>
              </span>
            )}
          </div>
          <div className="meter-track">
            <div
              className="meter-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="cart-items-scroll">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-icon-wrap">
                <ShoppingBag size={48} />
              </div>
              <h4>Your box is currently empty</h4>
              <p>Add some fresh cold-pressed goodness to recharge your day!</p>
              <button
                type="button"
                className="btn-pill-primary"
                onClick={onClose}
              >
                <span>Browse Flavors</span>
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.product.id} className="cart-item-row">
                  <div className="cart-item-thumb">
                    <img src={item.product.image} alt={item.product.name} />
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-meta">
                      <h4 className="cart-item-name">{item.product.name}</h4>
                      <span className="cart-item-volume">{item.product.volume}</span>
                    </div>
                    <div className="cart-item-pricing">
                      <span className="cart-item-price">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <span className="cart-unit-price">
                        (${item.product.price.toFixed(2)} each)
                      </span>
                    </div>

                    {/* Stepper & Delete */}
                    <div className="cart-item-controls">
                      <div className="stepper-pill cart-stepper">
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => onUpdateQty(item.product.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="stepper-value">
                          {String(item.quantity).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => onUpdateQty(item.product.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove-btn"
                        onClick={() => onRemoveItem(item.product.id)}
                        aria-label={`Remove ${item.product.name} from cart`}
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Calculations and Checkout */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="cart-promo-form">
              <div className="cart-promo-input-wrap">
                <Tag size={15} className="promo-icon" />
                <input
                  type="text"
                  placeholder="Promo code (try FRESH15)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button type="submit" className="promo-apply-btn">
                  Apply
                </button>
              </div>
              {promoError && <p className="promo-error-msg">{promoError}</p>}
              {discountCode && (
                <div className="applied-code-badge">
                  <Check size={13} />
                  <span>Coupon {discountCode} ({discountPercent}% OFF) applied!</span>
                </div>
              )}
            </form>

            {/* Calculations Breakdown */}
            <div className="cart-calculations-table">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="calc-row discount-row">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="calc-row">
                <span>Carbon-Neutral Shipping</span>
                <span>{shippingCost === 0 ? <strong className="free-text">FREE</strong> : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="calc-row">
                <span>Estimated Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="calc-row total-row">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              type="button"
              className="btn-pill-primary cart-checkout-btn"
              onClick={onCheckout}
              id="cart-checkout-btn"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
