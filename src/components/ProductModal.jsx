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

export default function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onOpenDetail,
}) {
  const [qty, setQty] = useState(1)
  const [activeMedia, setActiveMedia] = useState({ type: 'image', url: product?.image, index: 0 })
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'nutrition' | 'ingredients'

  // Reset state when a new product is opened
  useEffect(() => {
    if (product) {
      setQty(1)
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

  const handleQty = (delta) => {
    setQty((prev) => Math.max(1, prev + delta))
  }

  const handleAdd = () => {
    onAddToCart(product, qty)
    onClose()
  }

  const totalPrice = (product.price * qty).toFixed(2)

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
            <div
              className="product-modal-stage-wrap"
              style={{ backgroundColor: product.bgSoft || '#f6f9f2' }}
            >
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
                {product.badge || '100% Organic'}
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
                  <img src={imgUrl} alt={`${product.name} preview ${idx + 1}`} />
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
                <span>Non-GMO Certified</span>
              </div>
              <div className="modal-trust-pill">
                <Droplets size={14} className="text-blue" />
                <span>Zero Sugar Crash</span>
              </div>
              <div className="modal-trust-pill">
                <Sparkles size={14} className="text-amber" />
                <span>Infinitely Recyclable</span>
              </div>
            </div>
          </div>

          {/* Modal Right: Rich Product Details & Multi-tab Breakdown */}
          <div className="product-modal-info-col">
            {/* Header info */}
            <div className="product-modal-header">
              <div className="product-category-sub-row">
                <span className="product-modal-category">{product.category}</span>
                <span className="product-modal-volume-tag">{product.volume} Can</span>
              </div>
              <h2 className="product-modal-title">{product.name}</h2>
              <p className="product-modal-tagline">{product.subtitle}</p>

              {/* Rating & Reviews */}
              <div className="product-modal-rating-row">
                <div className="stars-group">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="star-filled"
                      fill="currentColor"
                    />
                  ))}
                </div>
                <span className="rating-num">{product.rating}</span>
                <span className="reviews-num">({product.reviewsCount} customer reviews)</span>
              </div>
            </div>

            {/* Price & Savings Row */}
            <div className="product-modal-price-box">
              <div className="price-main-group">
                <span className="modal-price">${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="modal-original-price">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="modal-per-unit">/ unit</span>
              </div>
              {product.originalPrice && (
                <span className="discount-tag-pill">
                  Save ${(product.originalPrice - product.price).toFixed(2)}
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
                Overview
              </button>
              <button
                type="button"
                className={`modal-tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
                onClick={() => setActiveTab('nutrition')}
              >
                Nutrition
              </button>
              <button
                type="button"
                className={`modal-tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
                onClick={() => setActiveTab('ingredients')}
              >
                Ingredients
              </button>
            </div>

            {/* Tab 1: Overview & Tasting profile */}
            {activeTab === 'overview' && (
              <div className="modal-tab-body animate-fade-in">
                <p className="product-modal-desc">{product.description}</p>

                {product.tastingNotes && product.tastingNotes.length > 0 && (
                  <div className="modal-notes-section">
                    <h4 className="modal-section-title">
                      <Sparkles size={14} /> Tasting Profile
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
                    <span className="nutri-label">Calories</span>
                    <span className="nutri-val">{product.nutrition?.calories || '90 kcal'}</span>
                  </div>
                  <div className="nutri-chip">
                    <span className="nutri-label">Natural Sugar</span>
                    <span className="nutri-val">{product.nutrition?.sugar || '12g'}</span>
                  </div>
                  <div className="nutri-chip">
                    <span className="nutri-label">Total Carbs</span>
                    <span className="nutri-val">{product.nutrition?.carbs || '22g'}</span>
                  </div>
                  <div className="nutri-chip">
                    <span className="nutri-label">Vitamin C</span>
                    <span className="nutri-val">{product.nutrition?.vitaminC || '90% DV'}</span>
                  </div>
                  {product.nutrition?.potassium && (
                    <div className="nutri-chip">
                      <span className="nutri-label">Potassium</span>
                      <span className="nutri-val">{product.nutrition.potassium}</span>
                    </div>
                  )}
                  <div className="nutri-chip">
                    <span className="nutri-label">Organic</span>
                    <span className="nutri-val">100% Certified</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Pure Ingredients */}
            {activeTab === 'ingredients' && (
              <div className="modal-tab-body animate-fade-in">
                <div className="modal-ingredients-section">
                  <h4 className="modal-section-title">Pure Farm Ingredients</h4>
                  <ul className="ingredients-bullet-list">
                    {(product.ingredients || []).map((ing, i) => (
                      <li key={i}>
                        <Check size={14} className="ing-check" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="ingredients-disclaimer">
                    Free from high fructose corn syrup, artificial colors, synthetic binders, or chemical preservatives.
                  </p>
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
                <span>Add to Box — ${totalPrice}</span>
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
                  <span>Open Full Detailed Screen</span>
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
