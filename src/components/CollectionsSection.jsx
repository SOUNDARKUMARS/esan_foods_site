import React, { useState } from 'react'
import { Plus, Minus, Heart, Eye, ShoppingBag, Sparkles, Maximize2 } from 'lucide-react'
import { CATEGORIES } from '../data/mockData'

export default function CollectionsSection({
  products,
  onAddToCart,
  onQuickView,
  onOpenDetail,
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
              <div
                key={product.id}
                className="product-card clickable-product-card"
                onClick={() => (onOpenDetail ? onOpenDetail(product) : onQuickView(product))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (onOpenDetail ? onOpenDetail(product) : onQuickView(product))
                }
              >
                {/* Product Image Stage (Cover image with overlay badges) */}
                <div
                  className="product-image-stage"
                  aria-label={`View details for ${product.name}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-can-img"
                    loading="lazy"
                  />

                  {/* Overlaid Badges on Image */}
                  <div className="card-image-overlays">
                    {product.badge ? (
                      <span
                        className="product-badge-pill"
                        style={{ borderColor: product.color || '#059669' }}
                      >
                        {product.badge}
                      </span>
                    ) : (
                      <span />
                    )}

                    <div className="card-top-action-icons">
                      {/* Expand Button to Open as Modal */}
                      <button
                        type="button"
                        className="card-expand-modal-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onQuickView(product)
                        }}
                        aria-label={`Open quick view modal for ${product.name}`}
                        title="Expand as Modal"
                      >
                        <Maximize2 size={14} />
                      </button>

                      {/* Wishlist Heart Button */}
                      <button
                        type="button"
                        className={`wishlist-heart-btn ${isWishlisted ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleWishlist(product.id)
                        }}
                        aria-label={`Save ${product.name} to wishlist`}
                        title="Add to Wishlist"
                      >
                        <Heart
                          size={14}
                          fill={isWishlisted ? '#ef4444' : 'none'}
                          color={isWishlisted ? '#ef4444' : '#64748b'}
                        />
                      </button>
                    </div>
                  </div>


                </div>

                {/* Product Info */}
                <div className="product-info-wrap">
                  <div className="product-cat-vol-row">
                    <span className="product-cat-pill">{product.category}</span>
                    <span className="product-dot-sep">•</span>
                    <span className="product-vol-pill">{product.volume}</span>
                  </div>

                  <h3 className="product-card-name" title={product.name}>
                    {product.name}
                  </h3>

                  {/* Price Row */}
                  <div className="product-price-display-row">
                    <span className="product-curr-price">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="product-orig-price">
                        ${Number(product.originalPrice).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Desktop Action Controls */}
                  <div
                    className="product-action-controls desktop-only-controls"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                      <ShoppingBag size={14} />
                      <span>Add • ${totalPrice}</span>
                    </button>
                  </div>

                  {/* Mobile-Optimized 2-Column Action Bar */}
                  <div
                    className="product-mobile-action-bar mobile-only-controls"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="mobile-quick-add-btn"
                      onClick={() => handleAddToCart(product)}
                      aria-label={`Add ${product.name} to Cart`}
                    >
                      <ShoppingBag size={14} />
                      <span>Add to Bag</span>
                    </button>
                  </div>

                  {/* View Details Link */}
                  <div className="view-details-wrap">
                    <button
                      type="button"
                      className="view-details-link-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onOpenDetail) onOpenDetail(product)
                        else onQuickView(product)
                      }}
                    >
                      View Detailed Screen →
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
