import React from 'react'
import { Star, ArrowRight, ShieldCheck, Sparkles, Droplets } from 'lucide-react'
import { heroCans } from '../data/mockData'
import { EditableText, EditableImage } from './Editable'

export default function Hero({
  heroContent = {},
  isEditMode = false,
  onUpdateHero,
  onExploreClick,
  onShopClick,
}) {
  const heroImgSrc = heroContent.heroImage || heroCans

  const updateField = (key, value) => {
    if (onUpdateHero) {
      onUpdateHero({ ...heroContent, [key]: value })
    }
  }

  return (
    <section className="hero-section" id="home">
      <div className="hero-card">
        {/* Decorative ambient glow */}
        <div className="hero-ambient-glow" aria-hidden="true"></div>

        <div className="hero-grid">
          {/* Left Column: Text & CTAs */}
          <div className="hero-content">
            {/* Main Headline with Top Row containing line 1 + Rating Badge on opposite right */}
            <h1 className="hero-headline">
              <div className="hero-headline-top-bar">
                <span className="hero-headline-first-line">
                  <EditableText
                    value={heroContent.headlineLine1 || 'FEEL THE'}
                    onChange={(val) => updateField('headlineLine1', val)}
                    isEditMode={isEditMode}
                    as="span"
                  />
                </span>

                {/* Rating Badge in the right corner, opposite to the first line */}
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
                      <EditableText
                        value={heroContent.badgeReviewScore || '4.9/5'}
                        onChange={(val) => updateField('badgeReviewScore', val)}
                        isEditMode={isEditMode}
                        as="span"
                        className="rating-score"
                      />
                    </div>
                    <EditableText
                      value={heroContent.badgeReviewCount || '18,130 (Reviews)'}
                      onChange={(val) => updateField('badgeReviewCount', val)}
                      isEditMode={isEditMode}
                      as="span"
                      className="reviews-count"
                    />
                  </div>
                </div>
              </div>

              <span className="headline-highlight-row">
                <EditableText
                  value={heroContent.headlineHighlight || 'REFRESHMENT'}
                  onChange={(val) => updateField('headlineHighlight', val)}
                  isEditMode={isEditMode}
                  as="span"
                  className="headline-highlight"
                />
              </span>
              <br />
              <span className="headline-bottom-row">
                <EditableText
                  value={heroContent.headlineLine2 || 'IN EVERY SIP'}
                  onChange={(val) => updateField('headlineLine2', val)}
                  isEditMode={isEditMode}
                  as="span"
                />
              </span>
            </h1>

            {/* Supporting description */}
            <EditableText
              value={
                heroContent.subtext ||
                'A Perfectly Balanced Drink Made With Natural Ingredients To Hydrate, Energize, And Refresh You Anytime, Anywhere.'
              }
              onChange={(val) => updateField('subtext', val)}
              isEditMode={isEditMode}
              as="p"
              className="hero-subtext"
              multiline={true}
            />

            {/* Feature tags */}
            <div className="hero-meta-row">
              <div className="hero-meta-item">
                <span className="meta-dot"></span>
                <EditableText
                  value={heroContent.metaPill1 || 'Healthy Juice Drink'}
                  onChange={(val) => updateField('metaPill1', val)}
                  isEditMode={isEditMode}
                  as="span"
                  className="meta-title"
                />
              </div>
              <div className="hero-meta-divider">|</div>
              <div className="hero-meta-item">
                <EditableText
                  value={heroContent.metaPill2Val || '100%'}
                  onChange={(val) => updateField('metaPill2Val', val)}
                  isEditMode={isEditMode}
                  as="span"
                  className="meta-highlight-val"
                />
                <EditableText
                  value={heroContent.metaPill2Sub || 'Organic Fruit Drink'}
                  onChange={(val) => updateField('metaPill2Sub', val)}
                  isEditMode={isEditMode}
                  as="span"
                  className="meta-sub"
                />
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
                <EditableText
                  value={heroContent.trustItem1 || 'Non-GMO Verified'}
                  onChange={(val) => updateField('trustItem1', val)}
                  isEditMode={isEditMode}
                  as="span"
                />
              </div>
              <div className="trust-item">
                <Droplets size={15} />
                <EditableText
                  value={heroContent.trustItem2 || 'Zero Artificial Sweeteners'}
                  onChange={(val) => updateField('trustItem2', val)}
                  isEditMode={isEditMode}
                  as="span"
                />
              </div>
              <div className="trust-item">
                <Sparkles size={15} />
                <EditableText
                  value={heroContent.trustItem3 || 'Infinitely Recyclable Aluminum'}
                  onChange={(val) => updateField('trustItem3', val)}
                  isEditMode={isEditMode}
                  as="span"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Floating 3D Cans Visual */}
          <div className="hero-visual-col">
            <div className="hero-image-wrapper">
              {/* Main Product Photo */}
              <div className="hero-image-container">
                <EditableImage
                  src={heroImgSrc}
                  alt="Esan Foods Mudakathan Leaf Powder"
                  onChange={(newUrl) => updateField('heroImage', newUrl)}
                  isEditMode={isEditMode}
                  className="hero-main-img"
                  wrapperClassName="hero-editable-img-box"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              {/* Floating Pill Badges */}
              <div className="floating-badge badge-top-right">
                <span className="badge-emoji">
                  {heroContent.badgeTopRightEmoji && heroContent.badgeTopRightEmoji !== '🍓' ? heroContent.badgeTopRightEmoji : '🌿'}
                </span>
                <div className="badge-text-group">
                  <EditableText
                    value={
                      (!heroContent.badgeTopRightBold || heroContent.badgeTopRightBold === 'Real Strawberries')
                        ? '100% Pure Herbs'
                        : heroContent.badgeTopRightBold
                    }
                    onChange={(val) => updateField('badgeTopRightBold', val)}
                    isEditMode={isEditMode}
                    as="span"
                    className="badge-bold"
                  />
                  <EditableText
                    value={
                      (!heroContent.badgeTopRightLight || heroContent.badgeTopRightLight === 'Cold-Pressed Juice')
                        ? 'Natural & Healthy'
                        : heroContent.badgeTopRightLight
                    }
                    onChange={(val) => updateField('badgeTopRightLight', val)}
                    isEditMode={isEditMode}
                    as="span"
                    className="badge-light"
                  />
                </div>
              </div>

              <div className="floating-badge badge-bottom-left">
                <span className="badge-emoji">
                  {heroContent.badgeBottomLeftEmoji && heroContent.badgeBottomLeftEmoji !== '⚡' ? heroContent.badgeBottomLeftEmoji : '🍃'}
                </span>
                <div className="badge-text-group">
                  <EditableText
                    value={
                      (!heroContent.badgeBottomLeftBold || heroContent.badgeBottomLeftBold === 'Prebiotic Infused')
                        ? 'Traditional Recipe'
                        : heroContent.badgeBottomLeftBold
                    }
                    onChange={(val) => updateField('badgeBottomLeftBold', val)}
                    isEditMode={isEditMode}
                    as="span"
                    className="badge-bold"
                  />
                  <EditableText
                    value={
                      (!heroContent.badgeBottomLeftLight || heroContent.badgeBottomLeftLight === 'Zero Sugar Crash')
                        ? 'No Added Preservatives'
                        : heroContent.badgeBottomLeftLight
                    }
                    onChange={(val) => updateField('badgeBottomLeftLight', val)}
                    isEditMode={isEditMode}
                    as="span"
                    className="badge-light"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
