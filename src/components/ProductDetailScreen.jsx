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
import {
  getProductName,
  getProductSubtitle,
  getProductDescription,
  getProductCategory,
  getProductBadge,
  TAMIL_UI_DICTIONARY,
} from '../data/tamilService'
import { getDefaultQuantityOptions, findSingleItemOption } from '../data/productService'
import ProductReviewsSection from './ProductReviewsSection'
import { getRatingSummary, subscribeToReviews } from '../data/reviewService'
import PincodeCheck from './PincodeCheck'

export default function ProductDetailScreen({
  product,
  onBack,
  onAddToCart,
  onQuickView,
  allProducts = [],
  onSelectProduct,
  wishlist = [],
  onToggleWishlist,
  lang = 'en',
  onToggleLang,
  currentUser = null,
  onOpenAuth = null,
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
  const [selectedPack, setSelectedPack] = useState(null)
  const [activeMedia, setActiveMedia] = useState({
    type: 'image',
    url: activeProduct?.image,
    index: 0,
  })
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'nutrition' | 'ingredients'
  const [copiedLink, setCopiedLink] = useState(false)
  const [ratingSummary, setRatingSummary] = useState(() =>
    activeProduct ? getRatingSummary(activeProduct.id) : { average: 0, totalCount: 0 }
  )

  useEffect(() => {
    if (activeProduct?.id) {
      setRatingSummary(getRatingSummary(activeProduct.id))
      const unsub = subscribeToReviews(() => {
        setRatingSummary(getRatingSummary(activeProduct.id))
      })
      return () => unsub()
    }
  }, [activeProduct?.id])

  const quantityOptions = activeProduct
    ? (Array.isArray(activeProduct.quantityOptions))
      ? activeProduct.quantityOptions
      : (Array.isArray(activeProduct.quantity_options))
      ? activeProduct.quantity_options
      : (Array.isArray(activeProduct.nutrition?.quantityOptions))
      ? activeProduct.nutrition.quantityOptions
      : (activeProduct.price !== undefined ? getDefaultQuantityOptions(activeProduct.price, activeProduct.volume) : [])
    : []

  // Scroll to top on mount or product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (activeProduct) {
      setQty(1)
      const opts = Array.isArray(activeProduct.quantityOptions)
        ? activeProduct.quantityOptions
        : (Array.isArray(activeProduct.quantity_options)
        ? activeProduct.quantity_options
        : (Array.isArray(activeProduct.nutrition?.quantityOptions)
        ? activeProduct.nutrition.quantityOptions
        : (activeProduct.price !== undefined ? getDefaultQuantityOptions(activeProduct.price, activeProduct.volume) : [])))
      const defaultOpt = findSingleItemOption(opts)
      setSelectedPack(defaultOpt?.id || opts[0]?.id || null)
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

  // Current active quantity/pack option
  const currentOption = quantityOptions.length > 0
    ? (quantityOptions.find((opt) => opt.id === selectedPack) || quantityOptions[0] || null)
    : null
  const unitPrice = Number(currentOption?.price ?? activeProduct.price ?? 0)
  const totalPrice = (unitPrice * qty).toFixed(2)

  const handleQtyChange = (delta) => {
    setQty((prev) => Math.max(1, prev + delta))
  }

  const handleAdd = () => {
    onAddToCart(activeProduct, qty, currentOption || null)
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
            <span className="crumb-current">{getProductName(activeProduct, lang)}</span>
          </nav>

          <div className="detail-top-actions">
            {/* Language Switcher Pill: EN | தமிழ் */}
            <div className="detail-lang-pill-toggle">
              <button
                type="button"
                className={`detail-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => onToggleLang && onToggleLang('en')}
                title="View in English"
              >
                EN
              </button>
              <button
                type="button"
                className={`detail-lang-btn ${lang === 'ta' ? 'active' : ''}`}
                onClick={() => onToggleLang && onToggleLang('ta')}
                title="தமிழில் பார்க்கவும்"
              >
                தமிழ்
              </button>
            </div>

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
                      url: activeProduct.videoUrl,
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
              {(
                Array.isArray(activeProduct.seals) && activeProduct.seals.length === 4 && activeProduct.seals[0]?.title
                  ? activeProduct.seals
                  : [
                      { title: '100% Natural', desc: 'Pure Herbal Ingredients' },
                      { title: 'No Preservatives', desc: 'Zero Artificial Colors' },
                      { title: 'Fresh Express', desc: 'Direct Farm Shipping' },
                      { title: 'Satisfaction', desc: 'Guaranteed Quality' },
                    ]
              ).map((seal, idx) => {
                const IconComponent = idx === 0 ? Leaf : idx === 1 ? ShieldCheck : idx === 2 ? Truck : RotateCcw
                return (
                  <div key={idx} className="detail-seal-item">
                    <IconComponent size={16} className="text-emerald-500" />
                    <div>
                      <strong>{seal.title}</strong>
                      <span>{seal.desc}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Information, Pricing, Pack Selector & Actions */}
          <div className="detail-info-column">
            {/* Header info */}
            <div className="detail-header-block">
              <div className="detail-category-row">
                <span className="detail-category-pill">
                  {getProductCategory(activeProduct, lang)}
                </span>
                <span className="detail-volume-pill">{activeProduct.volume || '250ml'}</span>
                <span className="detail-stock-badge">
                  <span className="stock-dot"></span>{' '}
                  {activeProduct.stockStatus || (lang === 'ta' ? 'இருப்பில் உள்ளது • இன்றே டெலிவரி' : 'In Stock • Ships Today')}
                </span>
              </div>

              <h1 className="detail-product-title">
                {getProductName(activeProduct, lang)}
              </h1>
              <p className="detail-product-subtitle">
                {getProductSubtitle(activeProduct, lang)}
              </p>

              {/* Rating Breakdown & Jump to Reviews */}
              <div
                className="detail-ratings-row"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })
                }}
                title={lang === 'ta' ? 'விமர்சனங்கள் பகுதிக்குச் செல்ல கிளிக் செய்யவும்' : 'Click to jump to customer reviews & write your review'}
              >
                <div className="detail-stars-group">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={ratingSummary.totalCount > 0 && i < Math.round(ratingSummary.average) ? 'star-filled' : 'star-empty'}
                      fill={ratingSummary.totalCount > 0 && i < Math.round(ratingSummary.average) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                {ratingSummary.totalCount > 0 ? (
                  <>
                    <strong className="detail-score">{ratingSummary.average.toFixed(1)}</strong>
                    <span className="detail-review-count">
                      ({ratingSummary.totalCount} {lang === 'ta' ? 'வாடிக்கையாளர் மதிப்புரைகள்' : 'customer reviews'})
                    </span>
                  </>
                ) : (
                  <span className="detail-review-count" style={{ color: '#64748b' }}>
                    {lang === 'ta' ? 'விமர்சனங்கள் இன்னும் இல்லை' : 'No reviews yet'}
                  </span>
                )}
                <span className="detail-review-jump-hint" style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginLeft: '6px' }}>
                  {lang === 'ta' ? 'விமர்சனங்கள் பகுதிக்குச் செல்ல →' : 'Customer reviews →'}
                </span>
              </div>
            </div>

            {/* Price Row */}
            <div className="detail-price-card">
              <div className="detail-price-main">
                <span className="detail-curr-price">₹{unitPrice.toFixed(2)}</span>
                {activeProduct.originalPrice && (
                  <span className="detail-orig-price">
                    ₹{Number(activeProduct.originalPrice).toFixed(2)}
                  </span>
                )}
                <span className="detail-per-unit">/ unit</span>
              </div>
              {currentOption?.discountText && (
                <span className="detail-bulk-save-badge">
                  {currentOption.discountText}
                </span>
              )}
            </div>

            {/* Pack Size Selection */}
            {quantityOptions.length > 0 && (
              <div className="detail-pack-selector-section">
                <span className="detail-section-label">
                  {lang === 'ta' ? 'அளவைத் தேர்ந்தெடுக்கவும்:' : 'Select Quantity Option:'}
                </span>
                <div className="detail-pack-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                  {quantityOptions.map((opt) => {
                    const isSelected = (currentOption?.id === opt.id)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`detail-pack-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedPack(opt.id)}
                      >
                        {opt.badge && (
                          <span className={`pack-badge ${opt.badge.toLowerCase().includes('value') ? 'bulk' : ''}`}>
                            {opt.badge}
                          </span>
                        )}
                        <div className="pack-card-left">
                          <span className="pack-title">{opt.title}</span>
                          {(opt.size || opt.discountText) && (
                            <span className="pack-desc">{opt.size || opt.discountText}</span>
                          )}
                        </div>
                        <div className="pack-card-right">
                          <strong className="pack-price">₹{Number(opt.price || 0).toFixed(2)}</strong>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

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
                <span>
                  {lang === 'ta'
                    ? `கூடையில் சேர்க்க — ₹${totalPrice}`
                    : `Add to Bag — ₹${totalPrice}`}
                </span>
              </button>
            </div>

            {/* Fast Features Highlights */}
            <div className="detail-key-highlights">
              {(
                Array.isArray(activeProduct.highlights) && activeProduct.highlights.length > 0
                  ? activeProduct.highlights
                  : [
                      'Cold-Extracted Purity',
                      'Zero Synthetic Additives',
                      'Traditional Wellness Heritage',
                    ]
              ).map((hl, idx) => (
                <div key={idx} className="highlight-pill">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>

            {/* Delivery Serviceability Check */}
            <PincodeCheck
              weight={Number(activeProduct?.weight) > 0 ? Number(activeProduct.weight) : 0.5}
              className="mt-4 mb-2"
            />

            {/* Informational Tabs (Overview, Nutrition, Ingredients, Reviews) */}
            <div className="detail-tabs-wrapper">
              <div className="detail-tabs-header">
                <button
                  type="button"
                  className={`detail-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  {lang === 'ta' ? 'அறிமுகம் & சுவை' : 'Overview & Taste'}
                </button>
                <button
                  type="button"
                  className={`detail-tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
                  onClick={() => setActiveTab('nutrition')}
                >
                  {lang === 'ta' ? 'ஊட்டச்சத்து விவரங்கள்' : 'Nutrition Facts'}
                </button>
                <button
                  type="button"
                  className={`detail-tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ingredients')}
                >
                  {lang === 'ta' ? 'மூலிகைப் பொருட்கள்' : 'Pure Ingredients'}
                </button>
                <button
                  type="button"
                  className={`detail-tab-btn ${activeTab === 'how-to-use' ? 'active' : ''}`}
                  onClick={() => setActiveTab('how-to-use')}
                >
                  {lang === 'ta' ? 'பயன்படுத்தும் முறை' : 'How to Use'}
                </button>
              </div>

              <div className="detail-tab-body">
                {activeTab === 'overview' && (
                  <div className="detail-tab-content animate-fade-in">
                    <p className="detail-long-desc">
                      {getProductDescription(activeProduct, lang) ||
                        activeProduct.description ||
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
                          {activeProduct.nutrition?.calories || activeProduct.calories || '90 kcal'}
                        </strong>
                      </div>
                      <div className="nutri-stat-card">
                        <span className="stat-label">Natural Sugars</span>
                        <strong className="stat-val">
                          {activeProduct.nutrition?.sugar || activeProduct.sugar || '10g'}
                        </strong>
                      </div>
                      <div className="nutri-stat-card">
                        <span className="stat-label">Carbohydrates</span>
                        <strong className="stat-val">
                          {activeProduct.nutrition?.carbs || activeProduct.carbs || '20g'}
                        </strong>
                      </div>
                      <div className="nutri-stat-card">
                        <span className="stat-label">Vitamin C</span>
                        <strong className="stat-val">
                          {activeProduct.nutrition?.vitaminC || activeProduct.vitaminC || '100% DV'}
                        </strong>
                      </div>
                      <div className="nutri-stat-card">
                        <span className="stat-label">Organic Certified</span>
                        <strong className="stat-val">
                          {activeProduct.nutrition?.organic || activeProduct.organic || '100%'}
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
                          <h4 className="step-title">
                            {activeProduct.howToUse?.prepTitle || activeProduct.prepTitle || '1. Prep'}
                          </h4>
                          <p className="step-desc">
                            {activeProduct.howToUse?.prepStep || activeProduct.prepStep || 'Mix 1-2 scoops of the herbal blend with warm water.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="how-to-step" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
                        <div className="step-icon-wrapper">
                          <Zap size={24} className="text-emerald-600" />
                        </div>
                        <div className="step-content">
                          <h4 className="step-title">
                            {activeProduct.howToUse?.blendTitle || activeProduct.blendTitle || '2. Blend'}
                          </h4>
                          <p className="step-desc">
                            {activeProduct.howToUse?.blendStep || activeProduct.blendStep || 'Stir thoroughly until completely dissolved for a smooth texture.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="how-to-step" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
                        <div className="step-icon-wrapper">
                          <Sparkles size={24} className="text-emerald-600" />
                        </div>
                        <div className="step-content">
                          <h4 className="step-title">
                            {activeProduct.howToUse?.enjoyTitle || activeProduct.enjoyTitle || '3. Enjoy'}
                          </h4>
                          <p className="step-desc">
                            {activeProduct.howToUse?.enjoyStep || activeProduct.enjoyStep || 'Consume daily for optimal natural nourishment and vitality.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Ratings Breakdown & Reviews Section */}
        <ProductReviewsSection
          productId={activeProduct.id}
          productName={getProductName(activeProduct, lang)}
          lang={lang}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onReviewAdded={() => {
            setRatingSummary(getRatingSummary(activeProduct.id))
          }}
        />

        {/* You May Also Like / Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="detail-related-section">
            <div className="section-header-compact">
              <h3 className="section-title-compact">
                {lang === 'ta' ? 'உங்களுக்குப் பிடித்த பிற தயாரிப்புகள்' : 'You May Also Love'}
              </h3>
              <p className="section-sub-compact">
                {lang === 'ta'
                  ? 'இயற்கையான பாரம்பரிய மூலிகைக் கலவைகள்'
                  : 'Handcrafted complementary herbal wellness blends'}
              </p>
            </div>

            <div className="detail-related-grid">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="related-product-card"
                  onClick={() => handleSelectRelated(rel)}
                >
                  <div className="related-img-box">
                    <img src={rel.image} alt={getProductName(rel, lang)} />
                    <button
                      type="button"
                      className="related-expand-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        onQuickView(rel)
                      }}
                      title={lang === 'ta' ? 'விரைவு முன்னோட்டம்' : 'Quick View Preview'}
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                  <div className="related-info-box">
                    <span className="related-cat">{getProductCategory(rel, lang)}</span>
                    <h4 className="related-name">{getProductName(rel, lang)}</h4>
                    <div className="related-price-row">
                      <strong>₹{Number(rel.price).toFixed(2)}</strong>
                      <span className="related-action-link">
                        {lang === 'ta' ? 'விவரங்கள் பார்க்க →' : 'View Details →'}
                      </span>
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
          <img src={activeProduct.image} alt={getProductName(activeProduct, lang)} className="sticky-thumb" />
          <div className="sticky-meta">
            <span className="sticky-title">{getProductName(activeProduct, lang)}</span>
            <strong className="sticky-price">₹{totalPrice}</strong>
          </div>
        </div>
        <button
          type="button"
          className="btn-pill-primary sticky-add-btn"
          onClick={handleAdd}
        >
          <ShoppingBag size={16} />
          <span>{lang === 'ta' ? 'கூடையில் சேர்க்க' : 'Add to Bag'}</span>
        </button>
      </div>
    </div>
  )
}
