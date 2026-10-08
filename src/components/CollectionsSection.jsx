import React, { useState } from 'react'
import { Plus, Minus, Heart, Eye, ShoppingBag, Sparkles } from 'lucide-react'
import { CATEGORIES } from '../data/mockData'

export default function CollectionsSection({
  products,
  onAddToCart,
  onQuickView,
  wishlist,
  onToggleWishlist,
  selectedCategory,
  onSelectCategory,
}) {
  // Store local quantity counter for each product card
  const [quantities, setQuantities] = useState({})

  const getQty = (id) => quantities[id] || 1

  const updateQty = (id, delta) => {
    setQuantities((prev) => {
      const current = prev[id] || 1
      const next = Math.max(1, current + delta)
      return { ...prev, [id]: next }
    })
  }

  const handleAddToCart = (product) => {
    const qty = getQty(product.id)
    onAddToCart(product, qty)
  }

  return (
    <section className="collections-section" id="collections">
      <div className="section-container">
        {/* Section Header */}
        <div className="collections-header text-center">
          <div className="section-pill-tag">
            <Sparkles size={13} />
            <span>Pure Botanicals</span>
          </div>
          <h2 className="section-title">DISCOVER OUR COLLECTIONS</h2>
          <p className="section-subtitle">
            Every can is cold-pressed, naturally balanced, and sealed for instant peak freshness.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="category-filter-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="products-grid">
          {products.map((product) => {
            const qty = getQty(product.id)
            const totalPrice = (product.price * qty).toFixed(2)
            const isWishlisted = wishlist.includes(product.id)

            return (
              <div key={product.id} className="product-card">
                {/* Top Card Badges & Actions */}
                <div className="card-top-bar">
                  <span className="product-badge-pill" style={{ borderColor: product.color }}>
                    {product.badge}
                  </span>
                  <button
                    type="button"
                    className={`wishlist-heart-btn ${isWishlisted ? 'liked' : ''}`}
                    onClick={() => onToggleWishlist(product.id)}
                    aria-label={`Save ${product.name} to wishlist`}
                    title="Add to Wishlist"
                  >
                    <Heart size={16} fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : '#6b7280'} />
                  </button>
                </div>

                {/* Product Image Stage */}
                <div
                  className="product-image-stage"
                  onClick={() => onQuickView(product)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onQuickView(product)}
                  aria-label={`View details for ${product.name}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-can-img"
                    loading="lazy"
                  />
                  <div className="quick-preview-overlay">
                    <span className="quick-preview-btn">
                      <Eye size={14} /> Quick View
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="product-info-wrap">
                  <h3 className="product-card-name">{product.name}</h3>
                  <div className="product-volume-text">{product.volume}</div>

                  {/* Interactive Controls Row */}
                  <div className="product-action-controls">
                    {/* Stepper (- 01 +) */}
                    <div className="stepper-pill">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => updateQty(product.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="stepper-value">
                        {String(qty).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => updateQty(product.id, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      className="add-to-cart-pill-btn"
                      onClick={() => handleAddToCart(product)}
                      aria-label={`Add to Cart for $${totalPrice}`}
                    >
                      <span>Add to Cart - ${totalPrice}</span>
                    </button>
                  </div>

                  {/* View Details Link */}
                  <div className="view-details-wrap">
                    <button
                      type="button"
                      className="view-details-link-btn"
                      onClick={() => onQuickView(product)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
