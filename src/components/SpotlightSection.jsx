import React, { useState, useEffect } from 'react'
import { Plus, Minus, Check, Flame, Sparkles, Leaf, Award, CheckCircle2 } from 'lucide-react'
import { PRODUCTS as FALLBACK_PRODUCTS, passionSpotlight } from '../data/mockData'
import {
  getProductName,
  getProductDescription,
  getProductCategory,
} from '../data/tamilService'

export default function SpotlightSection({
  products,
  featuredProductId = 'tinned-passion',
  onUpdateFeaturedProductId,
  isEditMode = false,
  onAddToCart,
  onQuickView,
  lang = 'en',
}) {
  const productList = products && products.length > 0 ? products : FALLBACK_PRODUCTS

  // Default to the admin-chosen featuredProductId
  const initialProduct =
    productList.find((p) => p.id === featuredProductId) ||
    productList.find((p) => p.isFeatured) ||
    productList[0]

  const [activeProduct, setActiveProduct] = useState(initialProduct)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (productList && productList.length > 0) {
      const match =
        productList.find((p) => p.id === featuredProductId) ||
        productList.find((p) => p.id === activeProduct?.id) ||
        productList[0]
      setActiveProduct(match)
    }
  }, [featuredProductId, products])

  if (!activeProduct) return null

  const isCurrentFeaturedMasterpiece = activeProduct.id === featuredProductId

  const handleSelectProduct = (prod) => {
    setActiveProduct(prod)
    setQty(1)
  }

  const handleMakeFeatured = () => {
    if (onUpdateFeaturedProductId) {
      onUpdateFeaturedProductId(activeProduct.id)
    }
  }

  const handleQtyChange = (delta) => {
    setQty((prev) => Math.max(1, prev + delta))
  }

  const totalPrice = (activeProduct.price * qty).toFixed(2)

  const spotlightImg =
    activeProduct.id === 'tinned-passion' && passionSpotlight
      ? passionSpotlight
      : (activeProduct.image || activeProduct.galleryImages?.[0])

  return (
    <section className="spotlight-section" id="spotlight">
      <div className="section-container">
        <div className="spotlight-card">
          <div className="spotlight-grid">
            {/* Left Visual Column */}
            <div className="spotlight-visual-col">
              <div className="spotlight-hero-img-wrap">
                <img
                  src={spotlightImg}
                  alt={activeProduct.name}
                  className="spotlight-main-img animate-fade-in"
                  key={activeProduct.id}
                />
              </div>

              {/* Thumbnail Mini Flavor Selector */}
              <div className="flavor-thumbnails-row">
                {productList.map((prod) => {
                  const isSavedFeatured = prod.id === featuredProductId
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      className={`flavor-thumb-btn ${activeProduct.id === prod.id ? 'active' : ''} ${
                        isSavedFeatured ? 'has-masterpiece-star' : ''
                      }`}
                      onClick={() => handleSelectProduct(prod)}
                      title={`${prod.name}${isSavedFeatured ? ' (Featured Masterpiece)' : ''}`}
                      aria-label={`Select ${prod.name}`}
                    >
                      <img src={prod.image || prod.galleryImages?.[0]} alt={prod.name} />
                      {isSavedFeatured && (
                        <span className="masterpiece-star-badge" title="Featured Masterpiece">★</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right Information Column */}
            <div className="spotlight-info-col">
              <div className="spotlight-header-actions-row">
                <div className="spotlight-badge-tag">
                  <Leaf size={14} />
                  <span>{lang === 'ta' ? 'சிறப்புத் தயாரிப்பு' : 'Featured Masterpiece'}</span>
                </div>

                {/* Admin Masterpiece Selector Button in Edit Mode */}
                {isEditMode && (
                  <div className="admin-masterpiece-selector-box">
                    {isCurrentFeaturedMasterpiece ? (
                      <span className="admin-masterpiece-confirmed">
                        <CheckCircle2 size={13} /> Active Masterpiece
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-set-masterpiece"
                        onClick={handleMakeFeatured}
                        title="Set this product as the storefront featured item"
                      >
                        <Award size={13} />
                        <span>Set as Masterpiece</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <h2 className="spotlight-title">{getProductName(activeProduct, lang).toUpperCase()}</h2>

              <div className="spotlight-attributes-row">
                <span>{lang === 'ta' ? 'புத்துணர்ச்சியூட்டும்' : 'Refreshing'}</span>
                <span className="dot">•</span>
                <span>{lang === 'ta' ? 'இயற்கையானது' : 'Natural'}</span>
                <span className="dot">•</span>
                <span>{lang === 'ta' ? 'செயற்கை நிறங்கள் அற்றது' : 'Zero Artificial Colors'}</span>
              </div>

              <p className="spotlight-description">
                {getProductDescription(activeProduct, lang) || activeProduct.description}
              </p>

              {/* Price */}
              <div className="spotlight-price-tag">
                <span className="currency">₹</span>
                <span className="amount">{activeProduct.price.toFixed(2)}</span>
                <span className="volume-label">/ {activeProduct.volume}</span>
              </div>

              {/* Nutrition Facts Pills */}
              <div className="nutrition-facts-box">
                <div className="nutrition-heading">
                  <Flame size={14} className="nutrition-icon" />
                  <span>{lang === 'ta' ? 'ஊட்டச்சத்து விவரங்கள்' : 'Nutrition Facts'}</span>
                </div>
                <div className="nutrition-pills-row">
                  <span className="nutri-pill">
                    Calories <strong>{activeProduct.nutrition?.calories || '90 kcal'}</strong>
                  </span>
                  <span className="nutri-pill">
                    Sugar <strong>{activeProduct.nutrition?.sugar || '12g'}</strong>
                  </span>
                  <span className="nutri-pill">
                    Vitamin C <strong>{activeProduct.nutrition?.vitaminC || '100%'}</strong>
                  </span>
                </div>
              </div>

              {/* Controls Row */}
              <div className="spotlight-actions-row">
                <div className="stepper-pill">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleQtyChange(-1)}
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
                    onClick={() => handleQtyChange(1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-pill-primary spotlight-add-btn"
                  onClick={() => onAddToCart(activeProduct, qty)}
                  id="spotlight-add-cart-btn"
                >
                  <span>
                    {lang === 'ta'
                      ? `கூடையில் சேர்க்க — ₹${totalPrice}`
                      : `Add To Box — ₹${totalPrice}`}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn-pill-outline spotlight-details-btn"
                  onClick={() => onQuickView(activeProduct)}
                >
                  <span>{lang === 'ta' ? 'விவரங்கள் பார்க்க' : 'View Details'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
