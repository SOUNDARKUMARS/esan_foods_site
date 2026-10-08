import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  Droplets,
  Sparkles,
  Check,
  Play,
  Film,
  Heart,
  Share2,
  Maximize2,
  Leaf,
  CheckCircle2,
  Truck,
  RotateCcw,
  Zap,
} from 'lucide-react'

export default function ProductDetailScreen({
  product,
  onBack,
  onAddToCart,
  onQuickView,
  allProducts = [],
  onSelectProduct,
  wishlist = [],
  onToggleWishlist,
}) {
  const { productId } = useParams()
  const navigate = useNavigate()

  // Resolve product either from props or from URL parameter endpoint /product/:productId
  const activeProduct =
    product ||
    allProducts.find(
      (p) =>
        String(p.id).toLowerCase() === String(productId || '').toLowerCase()
    )

  const [qty, setQty] = useState(1)
  const [selectedPack, setSelectedPack] = useState('single') // 'single' | 'pack6' | 'pack12'
  const [activeMedia, setActiveMedia] = useState({
    type: 'image',
    url: activeProduct?.image,
    index: 0,
  })
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'nutrition' | 'ingredients'
  const [copiedLink, setCopiedLink] = useState(false)

  // Scroll to top on mount or product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (activeProduct) {
      setQty(1)
      setSelectedPack('single')
      setActiveMedia({
        type: 'image',
        url: activeProduct.image,
        index: 0,
      })
      setActiveTab('overview')
    }
  }, [activeProduct?.id])

  if (!activeProduct) {
    return (
      <div className="product-detail-screen">
        <div className="section-container detail-page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '12px' }}>
            Product Not Found
          </h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            The requested product endpoint could not be found or has moved.
          </p>
          <button
            type="button"
            className="btn-pill-primary"
            onClick={() => {
              if (onBack) onBack()
              else navigate('/')
            }}
          >
            ← Return to Store
          </button>
        </div>
      </div>
    )
  }

  const isWishlisted = wishlist.includes(activeProduct.id)

  const gallery =
    Array.isArray(activeProduct.galleryImages) && activeProduct.galleryImages.length > 0
      ? activeProduct.galleryImages
      : activeProduct.image
      ? [activeProduct.image]
      : []

  // Pack multiplier calculation
  const packMultiplier = selectedPack === 'pack12' ? 12 : selectedPack === 'pack6' ? 6 : 1
  const packDiscount = selectedPack === 'pack12' ? 0.85 : selectedPack === 'pack6' ? 0.9 : 1
  const unitPrice = Number(activeProduct.price) || 0
  const packUnitPrice = (unitPrice * packDiscount).toFixed(2)
  const totalPrice = (unitPrice * packDiscount * packMultiplier * qty).toFixed(2)

  const handleQtyChange = (delta) => {
    setQty((prev) => Math.max(1, prev + delta))
  }

  const handleAdd = () => {
    // Add items with appropriate pack quantity
    onAddToCart(activeProduct, qty * packMultiplier)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/#collections')
    }
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/product/${activeProduct.id}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const handleSelectRelated = (rel) => {
    if (onSelectProduct) {
      onSelectProduct(rel)
    }
    navigate(`/product/${rel.id}`)
  }

  const relatedProducts = allProducts.filter((p) => p.id !== activeProduct.id).slice(0, 4)

  return (
    <div className="product-detail-screen animate-fade-in">
      <div className="section-container detail-page-container">
        {/* Top Navigation & Breadcrumbs Bar */}
        <div className="detail-top-nav-bar">
          <button
            type="button"
            className="detail-back-btn"
            onClick={handleBack}
            aria-label="Back to collections"
          >
            <ArrowLeft size={18} />
            <span className="back-btn-text">Back to Collections</span>
            <span className="back-btn-short">Back</span>
          </button>

          <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
            <span onClick={handleBack} className="crumb-link">Home</span>
            <span className="crumb-sep">/</span>
            <span onClick={handleBack} className="crumb-link">Shop</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{activeProduct.name}</span>
          </nav>

          <div className="detail-top-actions">
            <button
              type="button"
              className="detail-icon-action-btn"
              onClick={handleShare}
              title={copiedLink ? 'Link Copied!' : 'Share Product'}
            >
              <Share2 size={16} />
              {copiedLink && <span className="copied-tooltip">Copied!</span>}
            </button>
            <button
              type="button"
              className={`detail-icon-action-btn ${isWishlisted ? 'liked' : ''}`}
              onClick={() => onToggleWishlist(activeProduct.id)}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart
                size={16}
                fill={isWishlisted ? '#ef4444' : 'none'}
                color={isWishlisted ? '#ef4444' : '#64748b'}
              />
            </button>
          </div>
        </div>

        {/* Main Product Showcase Grid */}
        <div className="detail-main-grid">
          {/* Left Column: Master Visual Gallery */}
          <div className="detail-gallery-column">
            <div className="detail-master-stage">
              {activeMedia.type === 'video' ? (
                <div className="detail-video-stage">
                  <video
                    src={activeMedia.url}
                    controls
                    autoPlay
                    loop
                    className="detail-video-player"
                  />
                  <div className="detail-reel-badge">
                    <Film size={14} />
                    <span>Product Story Reel</span>
                  </div>
                </div>
              ) : (
                <div className="detail-image-stage">
                  <img
                    src={activeMedia.url || activeProduct.image}
                    alt={activeProduct.name}
                    className="detail-master-img"
                  />
                </div>
              )}

              {/* Badges on master stage */}
              <div className="detail-stage-badges">
                {activeProduct.badge && (
                  <span
                    className="detail-stage-badge-pill"
                    style={{ borderColor: activeProduct.color || '#059669' }}
                  >
                    {activeProduct.badge}
                  </span>
                )}
                <button
                  type="button"
                  className="detail-quick-expand-btn"
                  onClick={() => onQuickView(activeProduct)}
                  title="Expand quick view preview"
                >
                  <Maximize2 size={15} />
                  <span>Quick View</span>
                </button>
              </div>
            </div>

            {/* Thumbnail Navigation Strip */}
            <div className="detail-thumbs-strip">
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`detail-thumb-btn ${
                    activeMedia.type === 'image' && activeMedia.index === idx ? 'active' : ''
                  }`}
                  onClick={() =>
                    setActiveMedia({
                      type: 'image',
                      url: imgUrl,
                      index: idx,
                    })
                  }
                  title={`View image ${idx + 1}`}
                >
                  <img src={imgUrl} alt={`${activeProduct.name} preview ${idx + 1}`} />
                </button>
              ))}

              {activeProduct.videoUrl && (
                <button
                  type="button"
                  className={`detail-thumb-btn video-thumb-btn ${
                    activeMedia.type === 'video' ? 'active' : ''
                  }`}
                  onClick={() =>
                    setActiveMedia({
                      type: 'video',
                      url: product.videoUrl,
                      index: -1,
                    })
                  }
                  title="Watch Video Reel"
                >
                  <div className="video-thumb-icon">
                    <Play size={16} fill="white" />
                  </div>
                  <span>Reel</span>
                </button>
              )}
            </div>

            {/* Quality Seals Strip */}
            <div className="detail-seals-grid">
              <div className="detail-seal-item">
                <Leaf size={16} className="text-emerald-500" />
                <div>
                  <strong>100% Natural</strong>
                  <span>Pure Herbal Ingredients</span>
                </div>
              </div>
              <div className="detail-seal-item">
                <ShieldCheck size={16} className="text-emerald-500" />
                <div>
                  <strong>No Preservatives</strong>
                  <span>Zero Artificial Colors</span>
                </div>
              </div>
              <div className="detail-seal-item">
                <Truck size={16} className="text-emerald-500" />
                <div>
                  <strong>Fresh Express</strong>
                  <span>Direct Farm Shipping</span>
                </div>
              </div>
              <div className="detail-seal-item">
                <RotateCcw size={16} className="text-emerald-500" />
                <div>
                  <strong>Satisfaction</strong>
                  <span>Guaranteed Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Pricing, Pack Selector & Actions */}
          <div className="detail-info-column">
            {/* Header info */}
            <div className="detail-header-block">
              <div className="detail-category-row">
                <span className="detail-category-pill">{activeProduct.category}</span>
                <span className="detail-volume-pill">{activeProduct.volume}</span>
                <span className="detail-stock-badge">
                  <span className="stock-dot"></span> In Stock • Ships Today
                </span>
              </div>

              <h1 className="detail-product-title">{activeProduct.name}</h1>
              {activeProduct.subtitle && (
                <p className="detail-product-subtitle">{activeProduct.subtitle}</p>
              )}

              {/* Rating Breakdown */}
              <div className="detail-ratings-row">
                <div className="detail-stars-group">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="star-filled"
                      fill="currentColor"
                    />
                  ))}
                </div>
                <strong className="detail-score">{activeProduct.rating || '4.9'}</strong>
                <span className="detail-review-count">
                  ({activeProduct.reviewsCount || 428} verified customer reviews)
                </span>
              </div>
            </div>

            {/* Price Row */}
            <div className="detail-price-card">
              <div className="detail-price-main">
                <span className="detail-curr-price">${packUnitPrice}</span>
                {activeProduct.originalPrice && (
                  <span className="detail-orig-price">
                    ${Number(activeProduct.originalPrice).toFixed(2)}
                  </span>
                )}
                <span className="detail-per-unit">/ unit</span>
              </div>
              {selectedPack !== 'single' && (
                <span className="detail-bulk-save-badge">
                  {selectedPack === 'pack12' ? 'Save 15% (Bulk Value)' : 'Save 10% (Best Seller)'}
                </span>
              )}
            </div>

            {/* Pack Size Selection */}
            <div className="detail-pack-selector-section">
              <span className="detail-section-label">Select Quantity Option:</span>
              <div className="detail-pack-grid">
                <button
                  type="button"
                  className={`detail-pack-card ${selectedPack === 'single' ? 'active' : ''}`}
                  onClick={() => setSelectedPack('single')}
                >
                  <div className="pack-card-left">
                    <span className="pack-title">Single Item</span>
                    <span className="pack-desc">{activeProduct.volume}</span>
                  </div>
                  <div className="pack-card-right">
                    <strong className="pack-price">${unitPrice.toFixed(2)}</strong>
                  </div>
                </button>

                <button
                  type="button"
                  className={`detail-pack-card ${selectedPack === 'pack6' ? 'active' : ''}`}
                  onClick={() => setSelectedPack('pack6')}
                >
                  <div className="pack-card-left">
                    <div className="pack-title-row">
                      <span className="pack-title">Pack of 6</span>
                      <span className="pack-badge">Popular</span>
                    </div>
                    <span className="pack-desc">Save 10%</span>
                  </div>
                  <div className="pack-card-right">
                    <strong className="pack-price">${(unitPrice * 0.9 * 6).toFixed(2)}</strong>
                  </div>
                </button>

                <button
                  type="button"
                  className={`detail-pack-card ${selectedPack === 'pack12' ? 'active' : ''}`}
                  onClick={() => setSelectedPack('pack12')}
                >
                  <div className="pack-card-left">
                    <div className="pack-title-row">
                      <span className="pack-title">Pack of 12</span>
                      <span className="pack-badge bulk">Best Value</span>
                    </div>
                    <span className="pack-desc">Save 15%</span>
                  </div>
                  <div className="pack-card-right">
                    <strong className="pack-price">${(unitPrice * 0.85 * 12).toFixed(2)}</strong>
                  </div>
                </button>
              </div>
            </div>

            {/* Stepper & Add to Bag CTA */}
            <div className="detail-action-group">
              <div className="stepper-pill detail-stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => handleQtyChange(-1)}
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="stepper-value">
                  {String(qty).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => handleQtyChange(1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                className="btn-pill-primary detail-add-btn"
                onClick={handleAdd}
              >
                <ShoppingBag size={18} />
                <span>Add to Bag — ${totalPrice}</span>
              </button>
            </div>

            {/* Fast Features Highlights */}
            <div className="detail-key-highlights">
              <div className="highlight-pill">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Cold-Extracted Purity</span>
              </div>
              <div className="highlight-pill">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Zero Synthetic Additives</span>
              </div>
              <div className="highlight-pill">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Traditional Wellness Heritage</span>
              </div>
            </div>

            {/* Informational Tabs (Overview, Nutrition, Ingredients, Reviews) */}
            <div className="detail-tabs-wrapper">
              <div className="detail-tabs-header">
                <button
                  type="button"
                  className={`detail-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview & Taste
                </button>
                <button
                  type="button"
                  className={`detail-tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
                  onClick={() => setActiveTab('nutrition')}
                >
                  Nutrition Facts
                </button>
                <button
                  type="button"
                  className={`detail-tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ingredients')}
                >
                  Pure Ingredients
                </button>
                <button
                  type="button"
                  className={`detail-tab-btn ${activeTab === 'how-to-use' ? 'active' : ''}`}
                  onClick={() => setActiveTab('how-to-use')}
                >
                  How to Use
                </button>
              </div>

              <div className="detail-tab-body">
                {activeTab === 'overview' && (
                  <div className="detail-tab-content animate-fade-in">
                    <p className="detail-long-desc">
                      {activeProduct.description ||
                        'Crafted with pride using 100% natural and authentic traditional recipes. Our wholesome herbal preparations retain full botanical vitality, offering gentle natural nourishment and unmatched authentic taste.'}
                    </p>

                    {activeProduct.tastingNotes && activeProduct.tastingNotes.length > 0 && (
                      <div className="detail-notes-block">
                        <h4 className="detail-block-title">
                          <Sparkles size={14} /> Tasting Notes & Sensory Profile
                        </h4>
                        <div className="tasting-notes-pills">
                          {activeProduct.tastingNotes.map((note, idx) => (
                            <span key={idx} className="tasting-note-tag">
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'nutrition' && (
                  <div className="detail-tab-content animate-fade-in">
                    <div className="detail-nutri-grid">
                      <div className="nutri-stat-card">
                        <span className="stat-label">Calories</span>
                        <strong className="stat-val">
                          {activeProduct.nutrition?.calories || '90 kcal'}
                        </strong>
                      </div>
                      <div className="nutri-stat-card">
                        <span className="stat-label">Natural Sugars</span>
                        <strong className="stat-val">
                          {activeProduct.nutrition?.sugar || '10g'}
                        </strong>
                      </div>
                      <div className="nutri-stat-card">
                        <span className="stat-label">Carbohydrates</span>
                        <strong className="stat-val">
                          {activeProduct.nutrition?.carbs || '20g'}
                        </strong>
                      </div>
                      <div className="nutri-stat-card">
                        <span className="stat-label">Vitamin C</span>
                        <strong className="stat-val">
                          {activeProduct.nutrition?.vitaminC || '100% DV'}
                        </strong>
                      </div>
                      <div className="nutri-stat-card">
                        <span className="stat-label">Organic Certified</span>
                        <strong className="stat-val">
                          {activeProduct.nutrition?.organic || '100%'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ingredients' && (
                  <div className="detail-tab-content animate-fade-in">
                    <ul className="detail-ingredients-list">
                      {(activeProduct.ingredients || [
                        'Farm-fresh Organic Mudakathan Leaves',
                        'Traditional Sun-Dried Botanical Roots',
                        'Clean Cold-Processed Natural Extract',
                      ]).map((item, idx) => (
                        <li key={idx}>
                          <Check size={15} className="text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="detail-disclaimer-note">
                      Produced under strict quality and hygiene standards. Free of preservatives, artificial fillers, artificial flavoring, or synthetic colors.
                    </p>
                  </div>
                )}

                {activeTab === 'how-to-use' && (
                  <div className="detail-tab-content animate-fade-in">
                    <div className="how-to-use-grid">
                      <div className="how-to-step" style={{ animation: 'slideUp 0.5s ease-out 0.1s both' }}>
                        <div className="step-icon-wrapper">
                          <Droplets size={24} className="text-emerald-600" />
                        </div>
                        <div className="step-content">
                          <h4 className="step-title">1. Prep</h4>
                          <p className="step-desc">Mix 1-2 scoops of the herbal blend with warm water.</p>
                        </div>
                      </div>
                      
                      <div className="how-to-step" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
                        <div className="step-icon-wrapper">
                          <Zap size={24} className="text-emerald-600" />
                        </div>
                        <div className="step-content">
                          <h4 className="step-title">2. Blend</h4>
                          <p className="step-desc">Stir thoroughly until completely dissolved for a smooth texture.</p>
                        </div>
                      </div>
                      
                      <div className="how-to-step" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
                        <div className="step-icon-wrapper">
                          <Sparkles size={24} className="text-emerald-600" />
                        </div>
                        <div className="step-content">
                          <h4 className="step-title">3. Enjoy</h4>
                          <p className="step-desc">Consume daily for optimal natural nourishment and vitality.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like / Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="detail-related-section">
            <div className="section-header-compact">
              <h3 className="section-title-compact">You May Also Love</h3>
              <p className="section-sub-compact">Handcrafted complementary herbal wellness blends</p>
            </div>

            <div className="detail-related-grid">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="related-product-card"
                  onClick={() => handleSelectRelated(rel)}
                >
                  <div className="related-img-box">
                    <img src={rel.image} alt={rel.name} />
                    <button
                      type="button"
                      className="related-expand-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        onQuickView(rel)
                      }}
                      title="Quick View Preview"
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                  <div className="related-info-box">
                    <span className="related-cat">{rel.category}</span>
                    <h4 className="related-name">{rel.name}</h4>
                    <div className="related-price-row">
                      <strong>${Number(rel.price).toFixed(2)}</strong>
                      <span className="related-action-link">View Details →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Floating Action Bar */}
      <div className="detail-mobile-sticky-bar">
        <div className="sticky-bar-left">
          <img src={activeProduct.image} alt={activeProduct.name} className="sticky-thumb" />
          <div className="sticky-meta">
            <span className="sticky-title">{activeProduct.name}</span>
            <strong className="sticky-price">${totalPrice}</strong>
          </div>
        </div>
        <button
          type="button"
          className="btn-pill-primary sticky-add-btn"
          onClick={handleAdd}
        >
          <ShoppingBag size={16} />
          <span>Add to Bag</span>
        </button>
      </div>
    </div>
  )
}
