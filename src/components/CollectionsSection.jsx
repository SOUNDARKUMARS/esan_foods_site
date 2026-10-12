import React, { useState } from 'react'
import { Plus, Minus, Heart, Eye, ShoppingBag, Sparkles, Maximize2 } from 'lucide-react'
import { CATEGORIES } from '../data/mockData'
import {
  getProductName,
  getProductCategory,
  getProductBadge,
} from '../data/tamilService'

export default function CollectionsSection({
  products,
  onAddToCart,
  onQuickView,
  onOpenDetail,
  wishlist,
  onToggleWishlist,
  selectedCategory,
  onSelectCategory,
  lang = 'en',
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

  const availableCategories = React.useMemo(() => {
    const list = ['All Products']
    const seen = new Set()
    products.forEach((p) => {
      if (p.category && !seen.has(p.category.trim())) {
        seen.add(p.category.trim())
        list.push(p.category.trim())
      }
    })
    return list
  }, [products])

  return (
    <section className="collections-section" id="collections">
      <div className="section-container">
        {/* Section Header */}
        <div className="collections-header text-center">
          <div className="section-pill-tag">
            <Sparkles size={13} />
            <span>{lang === 'ta' ? 'தூய இயற்கை மூலிகைகள்' : 'Pure Botanicals'}</span>
          </div>
          <h2 className="section-title">
            {lang === 'ta' ? 'எங்கள் தயாரிப்புகள்' : 'DISCOVER OUR COLLECTIONS'}
          </h2>
          <p className="section-subtitle">
            {lang === 'ta'
              ? 'ஒவ்வொரு தயாரிப்பும் பாரம்பரிய இயற்கை முறையில் தயாரிக்கப்பட்டு, ஊட்டச்சத்தோடு அடைக்கப்பட்டுள்ளது.'
              : 'Every product is traditionally prepared with 100% natural herbs and packed for peak nutrition.'}
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="category-filter-bar">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {getProductCategory(cat, lang)}
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
                  aria-label={`View details for ${getProductName(product, lang)}`}
                >
                  <img
                    src={product.image}
                    alt={getProductName(product, lang)}
                    className="product-can-img"
                    loading="lazy"
                  />

                  {/* Overlaid Badges on Image */}
                  <div className="card-image-overlays">
                    {getProductBadge(product, lang) ? (
                      <span
                        className="product-badge-pill"
                        style={{ borderColor: product.color || '#059669' }}
                      >
                        {getProductBadge(product, lang)}
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
                        aria-label={`Open quick view modal for ${getProductName(product, lang)}`}
                        title={lang === 'ta' ? 'மாதிரியாக விரி' : 'Expand as Modal'}
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
                        aria-label={`Save ${getProductName(product, lang)} to wishlist`}
                        title={lang === 'ta' ? 'விருப்பப்பட்டியலில் சேர்' : 'Add to Wishlist'}
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
                    <span className="product-cat-pill">{getProductCategory(product.category, lang)}</span>
                    <span className="product-dot-sep">•</span>
                    <span className="product-vol-pill">{product.volume}</span>
                  </div>

                  <h3 className="product-card-name" title={getProductName(product, lang)}>
                    {getProductName(product, lang)}
                  </h3>

                  {/* Price Row */}
                  <div className="product-price-display-row">
                    <span className="product-curr-price">
                      ₹{Number(product.price).toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="product-orig-price">
                        ₹{Number(product.originalPrice).toFixed(2)}
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
                      aria-label={`Add to Cart for ₹${totalPrice}`}
                    >
                      <ShoppingBag size={14} />
                      <span>{lang === 'ta' ? 'சேர்' : 'Add'} • ₹{totalPrice}</span>
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
                      aria-label={`Add ${getProductName(product, lang)} to Cart`}
                    >
                      <ShoppingBag size={14} />
                      <span>{lang === 'ta' ? 'கூடையில் சேர்க்க' : 'Add to Bag'}</span>
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
                      {lang === 'ta' ? 'முழு விவரங்கள் பார்க்க →' : 'View Detailed Screen →'}
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
