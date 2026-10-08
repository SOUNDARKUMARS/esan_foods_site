import React, { useState } from 'react'
import { Plus, Minus, Check, Flame, Sparkles, Leaf } from 'lucide-react'
import { PRODUCTS, passionSpotlight } from '../data/mockData'

export default function SpotlightSection({ onAddToCart, onQuickView }) {
  // Default to tinned-passion, but user can click any flavor in the mini selector!
  const defaultProduct = PRODUCTS.find((p) => p.id === 'tinned-passion') || PRODUCTS[0]
  const [activeProduct, setActiveProduct] = useState(defaultProduct)
  const [qty, setQty] = useState(1)

  const handleSelectProduct = (prod) => {
    setActiveProduct(prod)
    setQty(1)
  }

  const handleQtyChange = (delta) => {
    setQty((prev) => Math.max(1, prev + delta))
  }

  const totalPrice = (activeProduct.price * qty).toFixed(2)

  // Use the special spotlight image for passion juice, or the product image for others
  const spotlightImg =
    activeProduct.id === 'tinned-passion' ? passionSpotlight : activeProduct.image

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
                {PRODUCTS.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    className={`flavor-thumb-btn ${activeProduct.id === prod.id ? 'active' : ''}`}
                    onClick={() => handleSelectProduct(prod)}
                    title={prod.name}
                    aria-label={`Select ${prod.name}`}
                  >
                    <img src={prod.image} alt={prod.name} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Information Column */}
            <div className="spotlight-info-col">
              <div className="spotlight-badge-tag">
                <Leaf size={14} />
                <span>Featured Masterpiece</span>
              </div>

              <h2 className="spotlight-title">{activeProduct.name.toUpperCase()}</h2>

              <div className="spotlight-attributes-row">
                <span>Refreshing</span>
                <span className="dot">•</span>
                <span>Natural</span>
                <span className="dot">•</span>
                <span>Zero Artificial Colors</span>
              </div>

              <p className="spotlight-description">
                {activeProduct.description}
              </p>

              {/* Price */}
              <div className="spotlight-price-tag">
                <span className="currency">$</span>
                <span className="amount">{activeProduct.price.toFixed(2)}</span>
                <span className="volume-label">/ {activeProduct.volume}</span>
              </div>

              {/* Nutrition Facts Pills */}
              <div className="nutrition-facts-box">
                <div className="nutrition-heading">
                  <Flame size={14} className="nutrition-icon" />
                  <span>Nutrition Facts</span>
                </div>
                <div className="nutrition-pills-row">
                  <span className="nutri-pill">
                    Calories <strong>{activeProduct.nutrition.calories}</strong>
                  </span>
                  <span className="nutri-pill">
                    Sugar <strong>{activeProduct.nutrition.sugar}</strong>
                  </span>
                  <span className="nutri-pill">
                    Vitamin C <strong>{activeProduct.nutrition.vitaminC || '100%'}</strong>
                  </span>
                </div>
              </div>

              {/* Controls Row */}
              <div className="spotlight-controls-row">
                {/* Stepper */}
                <div className="stepper-pill spotlight-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleQtyChange(-1)}
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
                    onClick={() => handleQtyChange(1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Add to Cart Pill Button */}
                <button
                  type="button"
                  className="add-to-cart-pill-btn spotlight-add-btn"
                  onClick={() => onAddToCart(activeProduct, qty)}
                >
                  <span>Add to Cart - ${totalPrice}</span>
                </button>
              </div>

              <div className="spotlight-guarantee-note">
                <Check size={14} className="check-icon" />
                <span>Cold-packed in 100% recyclable aluminum cans. Next-day delivery available.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
