import React, { useState, useEffect } from 'react'
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquarePlus,
  Filter,
  Sparkles,
  Send,
  X,
  Award,
} from 'lucide-react'
import {
  getReviewsForProduct,
  getRatingSummary,
  addCustomerReview,
  markReviewHelpful,
  subscribeToReviews,
} from '../data/reviewService'

const STAR_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Exceptional!',
}

export default function ProductReviewsSection({
  productId,
  productName = 'Product',
  lang = 'en',
  onReviewAdded,
}) {
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({
    average: 5.0,
    totalCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recommendedPercentage: 100,
  })

  const [starFilter, setStarFilter] = useState('all') // 'all' | 5 | 4 | 3 | 2 | 1
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Form states
  const [formRating, setFormRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [formName, setFormName] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formComment, setFormComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  // Load reviews on mount and when productId changes
  const loadData = () => {
    if (!productId) return
    const revs = getReviewsForProduct(productId)
    const sum = getRatingSummary(productId)
    setReviews(revs)
    setSummary(sum)
  }

  useEffect(() => {
    loadData()
    const unsubscribe = subscribeToReviews(() => {
      loadData()
    })
    return () => unsubscribe()
  }, [productId])

  const handleHelpfulClick = (reviewId) => {
    markReviewHelpful(reviewId)
    loadData()
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim()) {
      setFormError('Please enter your name.')
      return
    }
    if (!formComment.trim()) {
      setFormError('Please write your review feedback.')
      return
    }

    setIsSubmitting(true)
    try {
      await addCustomerReview({
        productId,
        rating: formRating,
        name: formName.trim(),
        title: formTitle.trim() || `${formRating}-Star Experience`,
        comment: formComment.trim(),
        verified: true,
      })

      setSubmitSuccess(true)
      setFormName('')
      setFormTitle('')
      setFormComment('')
      setFormRating(5)

      if (onReviewAdded) {
        onReviewAdded()
      }

      setTimeout(() => {
        setSubmitSuccess(false)
        setShowReviewForm(false)
      }, 2500)
    } catch (err) {
      setFormError('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredReviews = reviews.filter((r) => {
    if (starFilter === 'all') return true
    return Math.round(Number(r.rating)) === Number(starFilter)
  })

  return (
    <section className="product-reviews-container" id="product-reviews">
      <div className="reviews-section-header">
        <div className="reviews-header-left">
          <div className="reviews-tag-pill">
            <Award size={13} />
            <span>{lang === 'ta' ? 'உண்மையான வாடிக்கையாளர் கருத்துக்கள்' : 'Verified Customer Feedback'}</span>
          </div>
          <h3 className="reviews-main-title">
            {lang === 'ta' ? 'வாடிக்கையாளர் மதிப்பீடுகள் & விமர்சனங்கள்' : 'Ratings & Customer Reviews'}
          </h3>
          <p className="reviews-main-subtitle">
            {lang === 'ta'
              ? 'எங்கள் வாடிக்கையாளர்களிடமிருந்து நேரடியாக வரும் உண்மையான கருத்துக்கள்.'
              : 'Real, authentic feedback submitted directly by our customers. Not editable by admin.'}
          </p>
        </div>

        <button
          type="button"
          className="btn-pill-primary write-review-trigger-btn"
          onClick={() => {
            setShowReviewForm((prev) => !prev)
            setSubmitSuccess(false)
          }}
        >
          <MessageSquarePlus size={16} />
          <span>{showReviewForm ? (lang === 'ta' ? 'படிவத்தை மூடு' : 'Close Form') : (lang === 'ta' ? 'விமர்சனம் எழுதுக' : 'Write a Review')}</span>
        </button>
      </div>

      {/* Review Submission Form (Expandable) */}
      {showReviewForm && (
        <div className="review-submit-card animate-fade-in">
          <div className="review-form-header">
            <h4>{lang === 'ta' ? 'உங்கள் அனுபவத்தை பகிருங்கள்' : `Write a Review for ${productName}`}</h4>
            <button
              type="button"
              className="review-form-close-btn"
              onClick={() => setShowReviewForm(false)}
            >
              <X size={18} />
            </button>
          </div>

          {submitSuccess ? (
            <div className="review-success-banner animate-fade-in">
              <CheckCircle2 size={24} className="text-emerald-600" />
              <div>
                <strong>{lang === 'ta' ? 'நன்றி! உங்கள் விமர்சனம் பதிவிடப்பட்டது.' : 'Thank you! Your review has been published.'}</strong>
                <p>{lang === 'ta' ? 'உங்கள் கருத்து எமது தயாரிப்புப் பக்கத்தில் உடனே காட்டப்படும்.' : 'Your authentic feedback is now live on this product page.'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="review-form-body">
              {formError && (
                <div className="review-form-error">{formError}</div>
              )}

              {/* Star Rating Interactive Picker */}
              <div className="review-form-group">
                <label className="review-form-label">
                  {lang === 'ta' ? 'ஒட்டுமொத்த மதிப்பீடு:' : 'Overall Rating:'}
                </label>
                <div className="interactive-stars-picker">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = (hoverRating || formRating) >= starVal
                    return (
                      <button
                        key={starVal}
                        type="button"
                        className={`star-pick-btn ${isFilled ? 'active' : ''}`}
                        onClick={() => setFormRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={24}
                          className={isFilled ? 'star-filled' : 'star-empty'}
                          fill={isFilled ? 'currentColor' : 'none'}
                        />
                      </button>
                    )
                  })}
                  <span className="star-rating-text-hint">
                    {STAR_LABELS[hoverRating || formRating]}
                  </span>
                </div>
              </div>

              <div className="review-form-grid-2">
                <div className="review-form-group">
                  <label className="review-form-label">
                    {lang === 'ta' ? 'உங்கள் பெயர்:' : 'Your Name *:'}
                  </label>
                  <input
                    type="text"
                    className="review-input"
                    placeholder="e.g. S. Ramanathan"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="review-form-group">
                  <label className="review-form-label">
                    {lang === 'ta' ? 'தலைப்பு (விரும்பினால்):' : 'Headline / Title (optional):'}
                  </label>
                  <input
                    type="text"
                    className="review-input"
                    placeholder="e.g. Authentic traditional aroma, felt great!"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="review-form-group">
                <label className="review-form-label">
                  {lang === 'ta' ? 'உங்கள் விமர்சனம்:' : 'Your Detailed Experience *:'}
                </label>
                <textarea
                  rows={3}
                  className="review-textarea"
                  placeholder="Share details on taste, texture, packing quality, and daily wellness benefits..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  required
                />
              </div>

              <div className="review-form-footer">
                <span className="review-security-note">
                  <CheckCircle2 size={13} style={{ color: '#059669' }} />
                  {lang === 'ta' ? 'உண்மையான வாடிக்கையாளர் கருத்து' : 'Verified customer feedback — cannot be altered by store admin.'}
                </span>

                <button
                  type="submit"
                  className="btn-pill-primary submit-review-btn"
                  disabled={isSubmitting}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? (lang === 'ta' ? 'பதிவிடுகிறது...' : 'Publishing...') : (lang === 'ta' ? 'விமர்சனம் சமர்ப்பிக்க' : 'Submit Review')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Ratings Overview & Breakdown Box */}
      <div className="reviews-overview-card">
        {/* Left: Overall Score */}
        <div className="rating-score-display-col">
          <div className="big-rating-number">{summary.average.toFixed(1)}</div>
          <div className="big-rating-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={20}
                className={s <= Math.round(summary.average) ? 'star-filled' : 'star-empty'}
                fill={s <= Math.round(summary.average) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <div className="total-reviews-count-text">
            {lang === 'ta'
              ? `${summary.totalCount} வாடிக்கையாளர் விமர்சனங்கள்`
              : `Based on ${summary.totalCount} verified ${summary.totalCount === 1 ? 'review' : 'reviews'}`}
          </div>
          <div className="rating-recommend-chip">
            <Sparkles size={13} />
            <span>{summary.recommendedPercentage}% recommended</span>
          </div>
        </div>

        {/* Center: Breakdown Progress Bars */}
        <div className="rating-breakdown-bars-col">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[stars] || 0
            const pct = summary.percentages[stars] || 0
            const isFilterActive = String(starFilter) === String(stars)
            return (
              <button
                key={stars}
                type="button"
                className={`breakdown-bar-row ${isFilterActive ? 'active-filter' : ''}`}
                onClick={() => setStarFilter(isFilterActive ? 'all' : stars)}
                title={`Filter by ${stars} stars`}
              >
                <span className="star-level-label">
                  {stars} <Star size={12} fill="currentColor" className="star-filled" />
                </span>
                <div className="breakdown-bar-track">
                  <div
                    className="breakdown-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="breakdown-pct-label">{pct}%</span>
                <span className="breakdown-count-label">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Right: Filter Buttons Strip */}
        <div className="rating-quick-filter-col">
          <div className="filter-col-title">
            <Filter size={13} />
            <span>{lang === 'ta' ? 'வடிகட்டுக:' : 'Filter by stars:'}</span>
          </div>
          <div className="filter-pill-stack">
            <button
              type="button"
              className={`review-filter-btn ${starFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStarFilter('all')}
            >
              All ({summary.totalCount})
            </button>
            {[5, 4, 3, 2, 1].map((st) => (
              <button
                key={st}
                type="button"
                className={`review-filter-btn ${String(starFilter) === String(st) ? 'active' : ''}`}
                onClick={() => setStarFilter(st)}
              >
                {st} ★ ({summary.distribution[st] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Reviews Feed */}
      <div className="customer-reviews-feed">
        <div className="feed-header-bar">
          <span className="feed-count-heading">
            {starFilter === 'all'
              ? `Showing all ${reviews.length} reviews`
              : `Showing ${filteredReviews.length} reviews with ${starFilter} stars`}
          </span>
          {starFilter !== 'all' && (
            <button
              type="button"
              className="clear-filter-btn"
              onClick={() => setStarFilter('all')}
            >
              Clear Filter ✕
            </button>
          )}
        </div>

        {filteredReviews.length === 0 ? (
          <div className="no-reviews-box">
            <p>
              {starFilter === 'all'
                ? 'No customer reviews yet. Be the first to write one!'
                : `No reviews found with ${starFilter} stars.`}
            </p>
            {starFilter === 'all' && (
              <button
                type="button"
                className="btn-pill-subtle"
                onClick={() => setShowReviewForm(true)}
              >
                <MessageSquarePlus size={14} style={{ marginRight: 6 }} />
                Write First Review
              </button>
            )}
          </div>
        ) : (
          <div className="reviews-card-list">
            {filteredReviews.map((rev) => (
              <div key={rev.id} className="single-review-card animate-fade-in">
                <div className="review-card-top-row">
                  <div className="reviewer-profile-group">
                    {rev.avatar ? (
                      <img
                        src={rev.avatar}
                        alt={rev.name}
                        className="reviewer-avatar-img"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="reviewer-avatar-fallback">
                        {rev.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <strong className="reviewer-name-text">{rev.name}</strong>
                      <div className="reviewer-meta-badges">
                        {rev.verified !== false && (
                          <span className="verified-buyer-pill">
                            <CheckCircle2 size={12} />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                        {rev.date && (
                          <span className="review-date-text">{rev.date}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="review-stars-pill">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= Math.round(rev.rating) ? 'star-filled' : 'star-empty'}
                        fill={s <= Math.round(rev.rating) ? 'currentColor' : 'none'}
                      />
                    ))}
                    <span className="star-num-val">{Number(rev.rating).toFixed(1)}</span>
                  </div>
                </div>

                {rev.title && (
                  <h4 className="review-card-title">{rev.title}</h4>
                )}

                <p className="review-card-comment">{rev.comment}</p>

                <div className="review-card-footer">
                  <button
                    type="button"
                    className="helpful-vote-btn"
                    onClick={() => handleHelpfulClick(rev.id)}
                    title="Mark this review as helpful"
                  >
                    <ThumbsUp size={13} />
                    <span>Helpful ({rev.helpfulCount || 0})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
