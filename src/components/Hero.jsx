import React from 'react'
import { Star, ArrowRight, ShieldCheck, Sparkles, Droplets } from 'lucide-react'
import { heroCans } from '../data/mockData'

export default function Hero({ onExploreClick, onShopClick }) {
  return (
    <section className="hero-section" id="home">
      <div className="hero-card">
        {/* Decorative ambient glow */}
        <div className="hero-ambient-glow" aria-hidden="true"></div>

        <div className="hero-grid">
          {/* Left Column: Text & CTAs */}
          <div className="hero-content">
            {/* Top Review Rating Badge */}
            <div className="hero-review-badge">
              <div className="reviewer-avatar-stack">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                  alt="Reviewer"
                  className="badge-avatar"
                />
              </div>
              <div className="badge-rating-info">
                <div className="badge-stars">
                  <Star size={13} className="star-filled" fill="currentColor" />
                  <span className="rating-score">4.9/5</span>
                </div>
                <span className="reviews-count">18,130 (Reviews)</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="hero-headline">
              FEEL THE <br />
              <span className="headline-highlight">REFRESHMENT</span> <br />
              IN EVERY SIP
            </h1>

            {/* Supporting description */}
            <p className="hero-subtext">
              A Perfectly Balanced Drink Made With Natural Ingredients To Hydrate,
              Energize, And Refresh You Anytime, Anywhere.
            </p>

            {/* Feature tags */}
            <div className="hero-meta-row">
              <div className="hero-meta-item">
                <span className="meta-dot"></span>
                <span className="meta-title">Healthy Juice Drink</span>
              </div>
              <div className="hero-meta-divider">|</div>
              <div className="hero-meta-item">
                <span className="meta-highlight-val">100%</span>
                <span className="meta-sub">Organic Fruit Drink</span>
              </div>
            </div>

            {/* CTA Button Group */}
            <div className="hero-actions">
              <button
                type="button"
                className="btn-pill-primary"
                onClick={onShopClick}
                id="hero-shop-now-btn"
              >
                <span>Shop Now</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="btn-pill-outline"
                onClick={onExploreClick}
                id="hero-explore-btn"
              >
                <span>Explore Flavors</span>
              </button>
            </div>

            {/* Micro Benefits Strip */}
            <div className="hero-trust-strip">
              <div className="trust-item">
                <ShieldCheck size={15} />
                <span>Non-GMO Verified</span>
              </div>
              <div className="trust-item">
                <Droplets size={15} />
                <span>Zero Artificial Sweeteners</span>
              </div>
              <div className="trust-item">
                <Sparkles size={15} />
                <span>Infinitely Recyclable Aluminum</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating 3D Cans Visual */}
          <div className="hero-visual-col">
            <div className="hero-image-wrapper">
              {/* Main Cans Photo */}
              <div className="hero-image-container">
                <img
                  src={heroCans}
                  alt="Juicera Organic Sparkling Strawberry Matcha cans floating with fresh strawberries and water droplets"
                  className="hero-main-img"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              {/* Floating Pill Badges */}
              <div className="floating-badge badge-top-right">
                <span className="badge-emoji">🍓</span>
                <div className="badge-text-group">
                  <span className="badge-bold">Real Strawberries</span>
                  <span className="badge-light">Cold-Pressed Juice</span>
                </div>
              </div>

              <div className="floating-badge badge-bottom-left">
                <span className="badge-emoji">⚡</span>
                <div className="badge-text-group">
                  <span className="badge-bold">Prebiotic Infused</span>
                  <span className="badge-light">Zero Sugar Crash</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
