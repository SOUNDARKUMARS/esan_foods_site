import React, { useState } from 'react'
import { X, Star, Plus, Minus, ShoppingBag, ShieldCheck, Flame, Droplets, Check } from 'lucide-react'

export default function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1)

  if (!isOpen || !product) return null

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
        className="modal-panel product-modal-panel"
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

        <div className="product-modal-grid">
          {/* Modal Left: Product Image Stage */}
          <div className="product-modal-visual">
            <div className="product-modal-img-wrap" style={{ backgroundColor: product.bgSoft || '#f6f9f2' }}>
              <img src={product.image} alt={product.name} className="product-modal-img" />
              <div className="modal-badge-float" style={{ borderColor: product.color }}>
                {product.badge}
              </div>
            </div>

            {/* Quick Benefits */}
            <div className="modal-benefits-strip">
              <div className="modal-benefit-chip">
                <ShieldCheck size={14} />
                <span>100% Non-GMO</span>
              </div>
              <div className="modal-benefit-chip">
                <Droplets size={14} />
                <span>Zero Artificial</span>
              </div>
            </div>
          </div>

          {/* Modal Right: Product Details */}
          <div className="product-modal-info">
            <div className="product-modal-header">
              <span className="product-modal-category">{product.category}</span>
              <h2 className="product-modal-title">{product.name}</h2>
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
                <span className="reviews-num">({product.reviewsCount} reviews)</span>
              </div>
            </div>

            {/* Price & Size */}
            <div className="product-modal-price-row">
              <span className="modal-price">${product.price.toFixed(2)}</span>
              <span className="modal-volume">per {product.volume} can</span>
            </div>

            {/* Description */}
            <p className="product-modal-desc">{product.description}</p>

            {/* Tasting Notes */}
            {product.tastingNotes && (
              <div className="modal-notes-section">
                <h4 className="modal-section-title">Tasting Profile</h4>
                <div className="tasting-notes-pills">
                  {product.tastingNotes.map((note, idx) => (
                    <span key={idx} className="tasting-note-tag">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition Facts */}
            <div className="modal-nutrition-section">
              <h4 className="modal-section-title">
                <Flame size={14} /> Nutrition Facts (Per Can)
              </h4>
              <div className="nutrition-grid-chips">
                <div className="nutri-chip">
                  <span className="nutri-label">Calories</span>
                  <span className="nutri-val">{product.nutrition.calories}</span>
                </div>
                <div className="nutri-chip">
                  <span className="nutri-label">Sugar</span>
                  <span className="nutri-val">{product.nutrition.sugar}</span>
                </div>
                <div className="nutri-chip">
                  <span className="nutri-label">Total Carbs</span>
                  <span className="nutri-val">{product.nutrition.carbs}</span>
                </div>
                <div className="nutri-chip">
                  <span className="nutri-label">Vitamin C</span>
                  <span className="nutri-val">{product.nutrition.vitaminC || '80% DV'}</span>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="modal-ingredients-section">
              <h4 className="modal-section-title">Pure Ingredients</h4>
              <p className="ingredients-text">{product.ingredients.join(', ')}</p>
            </div>

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
                <span>Add to Box - ${totalPrice}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
