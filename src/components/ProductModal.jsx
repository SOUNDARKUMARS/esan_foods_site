import React, { useState, useEffect } from 'react'
import {
  X,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  Flame,
  Droplets,
  Check,
  Play,
  Film,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'

import {
  getProductName,
  getProductSubtitle,
  getProductDescription,
  getProductCategory,
  getProductBadge,
} from '../data/tamilService'
import { getRatingSummary, subscribeToReviews } from '../data/reviewService'
import { findSingleItemOption } from '../data/productService'

export default function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onOpenDetail,
  lang = 'en',
}) {
  const [qty, setQty] = useState(1)
  const [activeMedia, setActiveMedia] = useState({ type: 'image', url: product?.image, index: 0 })
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'nutrition' | 'ingredients'
  const [selectedOptId, setSelectedOptId] = useState(null)
  const [ratingSummary, setRatingSummary] = useState(() =>
    product ? getRatingSummary(product.id) : { average: 5.0, totalCount: 0 }
  )

  useEffect(() => {
    if (product?.id) {
      setRatingSummary(getRatingSummary(product.id))
      const unsub = subscribeToReviews(() => {
        setRatingSummary(getRatingSummary(product.id))
      })
      return () => unsub()
    }
  }, [product?.id])

  const quantityOptions = product
    ? (Array.isArray(product.quantityOptions))
      ? product.quantityOptions
      : (Array.isArray(product.quantity_options))
      ? product.quantity_options
      : (Array.isArray(product.nutrition?.quantityOptions))
      ? product.nutrition.quantityOptions
      : []
    : []

  // Reset state when a new product is opened
  useEffect(() => {
    if (product) {
      setQty(1)
      const opts = Array.isArray(product.quantityOptions)
        ? product.quantityOptions
        : (Array.isArray(product.quantity_options)
        ? product.quantity_options
        : (Array.isArray(product.nutrition?.quantityOptions)
        ? product.nutrition.quantityOptions
        : []))
      const defaultOpt = findSingleItemOption(opts)
      setSelectedOptId(defaultOpt?.id || opts[0]?.id || null)
      setActiveMedia({
        type: 'image',
        url: product.image,
        index: 0,
      })
      setActiveTab('overview')
    }
  }, [product])

  if (!isOpen || !product) return null

  // Collect all available media items (primary + gallery + video)
  const gallery = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [product.image]

  const activeOption = quantityOptions.length > 0
    ? (quantityOptions.find((o) => o.id === selectedOptId) || quantityOptions[0] || null)
    : null
  const effectivePrice = Number(activeOption?.price ?? product.price ?? 0)

  const handleQty = (delta) => {
    setQty((prev) => Math.max(1, prev + delta))
  }

  const handleAdd = () => {
    onAddToCart(product, qty, activeOption || null)
    onClose()
  }

  const totalPrice = (effectivePrice * qty).toFixed(2)

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="modal-panel product-modal-panel-vast"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="product-modal-grid-vast">
          {/* Modal Left: Product Media Gallery Stage */}
          <div className="product-modal-gallery-col">
            {/* Main Stage Display (Image or Video) */}
            <div className="product-modal-stage-wrap">
              {activeMedia.type === 'video' ? (
                <div className="product-modal-video-container">
                  <video
                    src={activeMedia.url}
                    controls
                    autoPlay
                    loop
                    className="product-modal-video-player"
                  />
                  <div className="video-playing-indicator">
                    <Film size={13} />
                    <span>Live Reel Experience</span>
                  </div>
                </div>
              ) : (
                <img
                  src={activeMedia.url || product.image}
                  alt={product.name}
                  className="product-modal-main-img animate-fade-in"
                  key={activeMedia.url}
                />
              )}

              {/* Status Badge */}
              <div
                className="modal-badge-float"
                style={{ borderColor: product.color, color: product.color }}
              >
                {getProductBadge(product, lang) || (lang === 'ta' ? '100% இயற்கை' : '100% Organic')}
              </div>
            </div>

            {/* Media Selector Thumbnails Strip */}
            <div className="product-media-strip">
              {/* Photo Thumbnails */}
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`gallery-thumb-btn ${
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
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={imgUrl} alt={`${getProductName(product, lang)} preview ${idx + 1}`} />
                </button>
              ))}

              {/* Video Thumbnail (if product has a videoUrl) */}
              {product.videoUrl && (
                <button
                  type="button"
                  className={`gallery-thumb-btn video-thumb-btn ${
                    activeMedia.type === 'video' ? 'active' : ''
                  }`}
                  onClick={() =>
                    setActiveMedia({
                      type: 'video',
                      url: product.videoUrl,
                      index: -1,
                    })
                  }
                  title="Watch Product Reel Video"
                  aria-label="Watch product reel"
                >
                  <div className="video-thumb-overlay">
                    <Play size={16} fill="white" />
                  </div>
                  <span className="video-thumb-label">Video</span>
                </button>
              )}
            </div>

            {/* Quick Trust Badges Strip */}
            <div className="modal-trust-pills-row">
              <div className="modal-trust-pill">
                <ShieldCheck size={14} className="text-emerald" />
                <span>{lang === 'ta' ? 'பாரம்பரிய மூலிகை' : 'Non-GMO Certified'}</span>
              </div>
              <div className="modal-trust-pill">
                <Droplets size={14} className="text-blue" />
                <span>{lang === 'ta' ? 'சுத்தமான தயாரிப்பு' : 'Zero Sugar Crash'}</span>
              </div>
              <div className="modal-trust-pill">
                <Sparkles size={14} className="text-amber" />
                <span>{lang === 'ta' ? 'இயற்கை புத்துணர்ச்சி' : 'Infinitely Recyclable'}</span>
              </div>
            </div>
          </div>

          {/* Modal Right: Rich Product Details & Multi-tab Breakdown */}
          <div className="product-modal-info-col">
            {/* Header info */}
            <div className="product-modal-header">
              <div className="product-category-sub-row">
                <span className="product-modal-category">{getProductCategory(product, lang)}</span>
                <span className="product-modal-volume-tag">{product.volume}</span>
              </div>
              <h2 className="product-modal-title">{getProductName(product, lang)}</h2>
              <p className="product-modal-tagline">{getProductSubtitle(product, lang)}</p>

              {/* Rating & Reviews (from live customer feedback) */}
              <div
                className="product-modal-rating-row"
                style={{ cursor: onOpenDetail ? 'pointer' : 'default' }}
                onClick={() => onOpenDetail && onOpenDetail(product)}
                title={onOpenDetail ? 'Click to view customer reviews breakdown' : ''}
              >
                <div className="stars-group">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(ratingSummary.average) ? 'star-filled' : 'star-empty'}
                      fill={i < Math.round(ratingSummary.average) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="rating-num">{ratingSummary.average.toFixed(1)}</span>
                <span className="reviews-num">
                  ({ratingSummary.totalCount} {lang === 'ta' ? 'வாடிக்கையாளர் மதிப்புரைகள்' : 'customer reviews'})
                </span>
                {onOpenDetail && (
                  <span className="reviews-jump-link">
                    {lang === 'ta' ? 'விமர்சனங்கள் பார்க்க →' : 'Read & write reviews →'}
                  </span>
                )}
              </div>
            </div>

            {/* Price & Savings Row */}
            <div className="product-modal-price-box">
              <div className="price-main-group">
                <span className="modal-price">₹{product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="modal-original-price">
                    ₹{product.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="modal-per-unit">/ unit</span>
              </div>
              {product.originalPrice && (
                <span className="discount-tag-pill">
                  {lang === 'ta' ? 'சேமிப்பு' : 'Save'} ₹{(product.originalPrice - product.price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Navigation Tabs for Vast Content */}
            <div className="modal-tabs-header">
              <button
                type="button"
                className={`modal-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                {lang === 'ta' ? 'அறிமுகம்' : 'Overview'}
              </button>
              <button
                type="button"
                className={`modal-tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
                onClick={() => setActiveTab('nutrition')}
              >
                {lang === 'ta' ? 'ஊட்டச்சத்து' : 'Nutrition'}
              </button>
              <button
                type="button"
                className={`modal-tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
                onClick={() => setActiveTab('ingredients')}
              >
                {lang === 'ta' ? 'மூலிகைகள்' : 'Ingredients'}
              </button>
            </div>

            {/* Tab 1: Overview & Tasting profile */}
            {activeTab === 'overview' && (
              <div className="modal-tab-body animate-fade-in">
                <p className="product-modal-desc">
                  {getProductDescription(product, lang) || product.description}
                </p>

                {product.tastingNotes && product.tastingNotes.length > 0 && (
                  <div className="modal-notes-section">
                    <h4 className="modal-section-title">
                      <Sparkles size={14} /> {lang === 'ta' ? 'சுவை விவரம்' : 'Tasting Profile'}
                    </h4>
                    <div className="tasting-notes-pills">
                      {product.tastingNotes.map((note, idx) => (
                        <span key={idx} className="tasting-note-tag">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Nutrition Facts */}
            {activeTab === 'nutrition' && (
              <div className="modal-tab-body animate-fade-in">
                <div className="nutrition-grid-chips">
                  <div className="nutri-chip">
                    <span className="nutri-label">{lang === 'ta' ? 'கலோரிகள்' : 'Calories'}</span>
                    <span className="nutri-val">{product.nutrition?.calories || '90 kcal'}</span>
                  </div>
                  <div className="nutri-chip">
                    <span className="nutri-label">{lang === 'ta' ? 'இயற்கை சர்க்கரை' : 'Natural Sugar'}</span>
                    <span className="nutri-val">{product.nutrition?.sugar || '12g'}</span>
                  </div>
                  <div className="nutri-chip">
                    <span className="nutri-label">{lang === 'ta' ? 'கார்போஹைட்ரேட்' : 'Total Carbs'}</span>
                    <span className="nutri-val">{product.nutrition?.carbs || '22g'}</span>
                  </div>
                  <div className="nutri-chip">
                    <span className="nutri-label">{lang === 'ta' ? 'வைட்டமின் சி' : 'Vitamin C'}</span>
                    <span className="nutri-val">{product.nutrition?.vitaminC || '90% DV'}</span>
                  </div>
                  {product.nutrition?.potassium && (
                    <div className="nutri-chip">
                      <span className="nutri-label">Potassium</span>
                      <span className="nutri-val">{product.nutrition.potassium}</span>
                    </div>
                  )}
                  <div className="nutri-chip">
                    <span className="nutri-label">{lang === 'ta' ? 'இயற்கை தரம்' : 'Organic'}</span>
                    <span className="nutri-val">100% Certified</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Pure Ingredients */}
            {activeTab === 'ingredients' && (
              <div className="modal-tab-body animate-fade-in">
                <div className="modal-ingredients-section">
                  <h4 className="modal-section-title">
                    {lang === 'ta' ? 'தூய மூலிகைப் பொருட்கள்' : 'Pure Farm Ingredients'}
                  </h4>
                  <ul className="ingredients-bullet-list">
                    {(product.ingredients || []).map((ing, i) => (
                      <li key={i}>
                        <Check size={14} className="ing-check" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="ingredients-disclaimer">
                    {lang === 'ta'
                      ? 'செயற்கை நிறங்கள், கெமிக்கல்கள் மற்றும் பிரிசர்வேட்டிவ்ஸ் எதுவும் சேர்க்கப்படவில்லை.'
                      : 'Free from high fructose corn syrup, artificial colors, synthetic binders, or chemical preservatives.'}
                  </p>
                </div>
              </div>
            )}

            {/* Quantity Options Selector (if options exist) */}
            {quantityOptions.length > 0 && (
              <div className="modal-pack-selector-wrap" style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ta' ? 'அளவைத் தேர்ந்தெடுக்கவும்:' : 'Select Quantity Option:'}
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {quantityOptions.map((opt) => {
                    const isSelected = (activeOption?.id === opt.id)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOptId(opt.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #059669' : '1.5px solid #e2e8f0',
                          background: isSelected ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '2px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{opt.title}</span>
                          {opt.badge && (
                            <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '1px 5px', borderRadius: '999px', background: '#059669', color: '#fff' }}>
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
                          <strong style={{ color: '#047857' }}>₹{Number(opt.price || 0).toFixed(2)}</strong>
                          {(opt.size || opt.discountText) && (
                            <span style={{ color: '#64748b' }}>({opt.size || opt.discountText})</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add to Cart Button */}
            <div className="modal-controls-row">
              <div className="stepper-pill modal-stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => handleQty(-1)}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="stepper-value">
                  {String(qty).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => handleQty(1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                type="button"
                className="btn-pill-primary modal-add-btn"
                onClick={handleAdd}
              >
                <ShoppingBag size={16} />
                <span>
                  {lang === 'ta'
                    ? `கூடையில் சேர்க்க — ₹${totalPrice}`
                    : `Add to Box — ₹${totalPrice}`}
                </span>
              </button>
            </div>

            {/* Link to Full Detailed Screen */}
            {onOpenDetail && (
              <div className="modal-detailed-screen-link-wrap">
                <button
                  type="button"
                  className="modal-goto-detail-btn"
                  onClick={() => {
                    onClose()
                    onOpenDetail(product)
                  }}
                >
                  <span>
                    {lang === 'ta' ? 'முழு திரை விவரங்கள் திறக்க' : 'Open Full Detailed Screen'}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
