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
  ShieldCheck,
  Truck,
  Lock,
  UserCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import {
  getReviewsForProduct,
  getRatingSummary,
  addCustomerReview,
  markReviewHelpful,
  subscribeToReviews,
  checkOrderDeliveryStatus,
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
  currentUser = null,
  onOpenAuth = null,
  onReviewAdded,
}) {
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({
    average: 0,
    totalCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recommendedPercentage: 0,
  })

  const [starFilter, setStarFilter] = useState('all') // 'all' | 5 | 4 | 3 | 2 | 1
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showVerificationBox, setShowVerificationBox] = useState(false)

  // Delivery Eligibility State: Only users who ordered and received delivery can review
  const [eligibility, setEligibility] = useState({
    checked: false,
    eligible: false,
    reason: 'CHECKING',
    order: null,
    customerName: '',
    customerEmail: '',
  })
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true)

  // Guest/Manual order verification inputs
  const [manualOrderId, setManualOrderId] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [verifyingOrder, setVerifyingOrder] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState(null) // { type: 'error' | 'success' | 'info', text: '' }

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

  // Check if current user is eligible to review (order placed AND status is Delivered)
  const verifyEligibility = async () => {
    if (!productId) return
    setIsCheckingEligibility(true)
    try {
      const res = await checkOrderDeliveryStatus({
        productId,
        productName,
        currentUser,
      })
      setEligibility({
        checked: true,
        eligible: res.eligible,
        reason: res.reason,
        order: res.order || null,
        status: res.status || null,
        customerName: res.customerName || currentUser?.name || '',
        customerEmail: res.customerEmail || currentUser?.email || '',
      })
      if (res.eligible && res.customerName && !formName) {
        setFormName(res.customerName)
      }
    } catch (err) {
      console.warn('Error checking delivery status:', err)
      setEligibility({
        checked: true,
        eligible: false,
        reason: 'ERROR',
        order: null,
        customerName: '',
        customerEmail: '',
      })
    } finally {
      setIsCheckingEligibility(false)
    }
  }

  useEffect(() => {
    loadData()
    verifyEligibility()

    const unsubscribe = subscribeToReviews(() => {
      loadData()
    })
    return () => unsubscribe()
  }, [productId, currentUser?.id, currentUser?.email])

  // Handle manual order verification (for guests or direct order lookups)
  const handleManualVerify = async (e) => {
    e.preventDefault()
    setVerificationMessage(null)

    if (!manualOrderId.trim() || !manualEmail.trim()) {
      setVerificationMessage({
        type: 'error',
        text: 'Please enter both your Order ID and the Email used during checkout.',
      })
      return
    }

    setVerifyingOrder(true)
    try {
      const res = await checkOrderDeliveryStatus({
        productId,
        productName,
        currentUser: null,
        orderId: manualOrderId.trim(),
        email: manualEmail.trim(),
      })

      if (res.eligible) {
        setEligibility({
          checked: true,
          eligible: true,
          reason: 'DELIVERED',
          order: res.order,
          status: 'delivered',
          customerName: res.customerName || manualEmail.split('@')[0],
          customerEmail: manualEmail.trim(),
        })
        setFormName(res.customerName || manualEmail.split('@')[0])
        setVerificationMessage({
          type: 'success',
          text: `Order #${res.order?.id} verified as Delivered! You can now submit your review below.`,
        })
        setShowReviewForm(true)
      } else if (res.reason === 'NOT_DELIVERED') {
        setVerificationMessage({
          type: 'info',
          text: `Order #${res.order?.id} was found, but status is currently "${res.status}". Reviews are unlocked once the order is marked Delivered.`,
        })
      } else if (res.reason === 'PRODUCT_NOT_IN_ORDER') {
        setVerificationMessage({
          type: 'error',
          text: `Order #${manualOrderId.trim().toUpperCase()} was found, but it does not contain this item.`,
        })
      } else {
        setVerificationMessage({
          type: 'error',
          text: `No matching order found for "${manualOrderId.trim()}" with email "${manualEmail.trim()}". Please check your receipt.`,
        })
      }
    } catch (err) {
      setVerificationMessage({
        type: 'error',
        text: 'Failed to verify order. Please try again.',
      })
    } finally {
      setVerifyingOrder(false)
    }
  }

  const handleHelpfulClick = (reviewId) => {
    markReviewHelpful(reviewId)
    loadData()
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setFormError('')

    // Hard verification enforcement: only allowed if order was placed and delivered
    if (!eligibility.eligible) {
      setFormError('Reviews can only be submitted by verified customers who received delivery.')
      return
    }

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
        orderId: eligibility.order?.id || null,
      })

      setSubmitSuccess(true)
      setFormComment('')
      setFormTitle('')

      if (onReviewAdded) {
        onReviewAdded()
      }

      setTimeout(() => {
        setSubmitSuccess(false)
        setShowReviewForm(false)
      }, 3000)
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

  // Has user already written a review for this product?
  const userAlreadyReviewed = Boolean(
    eligibility.customerName &&
      reviews.some(
        (r) =>
          r.name &&
          r.name.toLowerCase().trim() === eligibility.customerName.toLowerCase().trim()
      )
  )

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
              ? 'வாங்கிய வாடிக்கையாளர்களிடமிருந்து மட்டுமே வரும் உண்மையான கருத்துக்கள்.'
              : 'Authentic feedback exclusively submitted by verified customers who ordered and received this product.'}
          </p>
        </div>

        {/* Action Header Button - Context-aware based on delivered order status */}
        <div className="reviews-header-actions">
          {eligibility.eligible ? (
            <button
              type="button"
              className="btn-pill-primary write-review-trigger-btn"
              onClick={() => {
                setShowReviewForm((prev) => !prev)
                setSubmitSuccess(false)
              }}
            >
              <MessageSquarePlus size={16} />
              <span>
                {showReviewForm
                  ? lang === 'ta'
                    ? 'படிவத்தை மூடு'
                    : 'Close Form'
                  : lang === 'ta'
                  ? 'விமர்சனம் எழுதுக'
                  : 'Write a Review'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-pill-subtle write-review-trigger-btn"
              onClick={() => setShowVerificationBox((prev) => !prev)}
              title="Only customers who ordered and received this product can review"
            >
              <ShieldCheck size={16} style={{ color: '#059669' }} />
              <span>{lang === 'ta' ? 'ஆர்டர் சரிபார்ப்பு' : 'Verify Order to Review'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual Order Verification Box (For guests or customers checking eligibility) */}
      {showVerificationBox && !eligibility.eligible && (
        <div className="verification-box-card animate-fade-in">
          <div className="verification-box-header">
            <div className="verification-title-group">
              <ShieldCheck size={20} className="text-emerald-600" />
              <div>
                <h4>{lang === 'ta' ? 'டெலிவரி செய்யப்பட்ட ஆர்டரைச் சரிபார்க்கவும்' : 'Verify Your Delivered Order'}</h4>
                <p>
                  {lang === 'ta'
                    ? 'இந்தத் தயாரிப்பை ஆர்டர் செய்து டெலிவரி பெற்ற வாடிக்கையாளர்கள் மட்டுமே விமர்சனம் எழுத முடியும்.'
                    : 'Customer reviews are reserved for buyers who have ordered and received this item.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="review-form-close-btn"
              onClick={() => setShowVerificationBox(false)}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleManualVerify} className="verification-form-grid">
            <div className="review-form-group">
              <label className="review-form-label">
                {lang === 'ta' ? 'ஆர்டர் எண் (Order ID):' : 'Order ID *:'}
              </label>
              <input
                type="text"
                className="review-input"
                placeholder="e.g. ORD-1024"
                value={manualOrderId}
                onChange={(e) => setManualOrderId(e.target.value)}
                required
              />
            </div>

            <div className="review-form-group">
              <label className="review-form-label">
                {lang === 'ta' ? 'மின்னஞ்சல் முகவரி (Email):' : 'Billing Email *:'}
              </label>
              <input
                type="email"
                className="review-input"
                placeholder="e.g. yourname@example.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                required
              />
            </div>

            <div className="verification-submit-row">
              <button
                type="submit"
                className="btn-pill-primary verify-submit-btn"
                disabled={verifyingOrder}
              >
                {verifyingOrder ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>{lang === 'ta' ? 'ஆர்டரை சரிபார்க்க' : 'Check Order Delivery'}</span>
                  </>
                )}
              </button>

              {!currentUser && onOpenAuth && (
                <button
                  type="button"
                  className="btn-pill-subtle"
                  onClick={onOpenAuth}
                >
                  <UserCheck size={14} />
                  <span>{lang === 'ta' ? 'கணக்கில் உள்நுழைக' : 'Or Sign In with Account'}</span>
                </button>
              )}
            </div>
          </form>

          {verificationMessage && (
            <div
              className={`verification-alert-banner ${
                verificationMessage.type === 'success'
                  ? 'alert-success'
                  : verificationMessage.type === 'info'
                  ? 'alert-info'
                  : 'alert-error'
              } animate-fade-in`}
            >
              {verificationMessage.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{verificationMessage.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Review Submission Form (Expandable only for verified delivered customers) */}
      {showReviewForm && eligibility.eligible && (
        <div className="review-submit-card animate-fade-in">
          <div className="review-form-header">
            <div>
              <h4>{lang === 'ta' ? 'உங்கள் அனுபவத்தை பகிருங்கள்' : `Write a Review for ${productName}`}</h4>
              <div className="verified-delivery-badge-bar">
                <CheckCircle2 size={14} />
                <span>
                  {lang === 'ta'
                    ? `சரிபார்க்கப்பட்ட டெலிவரி (ஆர்டர் #${eligibility.order?.id || 'VERIFIED'})`
                    : `Verified Purchase Delivered (Order #${eligibility.order?.id || 'VERIFIED'})`}
                </span>
              </div>
            </div>
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
                <strong>{lang === 'ta' ? 'நன்றி! உங்கள் விமர்சனம் பதிவிடப்பட்டது.' : 'Thank you! Your verified review has been published.'}</strong>
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
                  {lang === 'ta' ? 'சரிபார்க்கப்பட்ட வாடிக்கையாளர் கருத்து' : 'Verified customer review — tied to delivered order.'}
                </span>

                <button
                  type="submit"
                  className="btn-pill-primary submit-review-btn"
                  disabled={isSubmitting}
                >
                  <Send size={15} />
                  <span>
                    {isSubmitting
                      ? lang === 'ta'
                        ? 'பதிவிடுகிறது...'
                        : 'Publishing...'
                      : lang === 'ta'
                      ? 'விமர்சனம் சமர்ப்பிக்க'
                      : 'Submit Review'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Ratings Overview & Breakdown Box (Zero fake data) */}
      <div className="reviews-overview-card">
        {/* Left: Overall Score */}
        <div className="rating-score-display-col">
          <div className="big-rating-number">
            {summary.totalCount > 0 ? summary.average.toFixed(1) : '0.0'}
          </div>
          <div className="big-rating-stars">
            {[1, 2, 3, 4, 5].map((s) => {
              const isFilled = summary.totalCount > 0 && s <= Math.round(summary.average)
              return (
                <Star
                  key={s}
                  size={20}
                  className={isFilled ? 'star-filled' : 'star-empty'}
                  fill={isFilled ? 'currentColor' : 'none'}
                />
              )
            })}
          </div>
          <div className="total-reviews-count-text">
            {summary.totalCount === 0
              ? lang === 'ta'
                ? 'மதிப்புரைகள் இன்னும் இல்லை'
                : 'Based on 0 verified reviews'
              : lang === 'ta'
              ? `${summary.totalCount} வாடிக்கையாளர் விமர்சனங்கள்`
              : `Based on ${summary.totalCount} verified ${summary.totalCount === 1 ? 'review' : 'reviews'}`}
          </div>

          {summary.totalCount > 0 ? (
            <div className="rating-recommend-chip">
              <Sparkles size={13} />
              <span>{summary.recommendedPercentage}% recommended</span>
            </div>
          ) : (
            <div className="rating-recommend-chip empty-chip">
              <span>{lang === 'ta' ? 'மதிப்பீடு இன்னும் இல்லை' : 'No ratings yet'}</span>
            </div>
          )}
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
                  {stars} <Star size={12} fill={count > 0 ? 'currentColor' : 'none'} className={count > 0 ? 'star-filled' : 'star-empty'} />
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
            <div className="no-reviews-icon-wrap">
              <ShieldCheck size={36} className="text-emerald-600" />
            </div>
            <h4 className="no-reviews-title">
              {starFilter === 'all'
                ? lang === 'ta'
                  ? 'வாடிக்கையாளர் மதிப்புரைகள் இன்னும் இல்லை'
                  : 'No customer reviews yet'
                : `No reviews found with ${starFilter} stars.`}
            </h4>

            {starFilter === 'all' && (
              <>
                {/* 1. Case: User ordered and it got DELIVERED -> Can review */}
                {eligibility.eligible ? (
                  <div className="no-reviews-delivered-case animate-fade-in">
                    <p className="no-reviews-subtext">
                      {lang === 'ta'
                        ? `நீங்கள் இந்தத் தயாரிப்பை ஆர்டர் செய்து டெலிவரி பெற்றுள்ளீர்கள் (ஆர்டர் #${eligibility.order?.id}). முதல் விமர்சனத்தை எழுதுங்கள்!`
                        : `You have received this product from Order #${eligibility.order?.id}. Be the first verified customer to share your thoughts!`}
                    </p>
                    <button
                      type="button"
                      className="btn-pill-primary review-action-btn"
                      onClick={() => setShowReviewForm(true)}
                    >
                      <MessageSquarePlus size={16} />
                      <span>{lang === 'ta' ? 'முதல் விமர்சனம் எழுதுக' : 'Write First Review'}</span>
                    </button>
                  </div>
                ) : eligibility.reason === 'NOT_DELIVERED' ? (
                  /* 2. Case: User ordered, but order is still Processing/Shipped */
                  <div className="order-status-notice-card animate-fade-in">
                    <Truck size={20} className="text-emerald-700" />
                    <div>
                      <strong>
                        {lang === 'ta'
                          ? `உங்கள் ஆர்டர் #${eligibility.order?.id} தற்பொழுது "${eligibility.status}" நிலையில் உள்ளது.`
                          : `Your order #${eligibility.order?.id} is currently ${eligibility.status}.`}
                      </strong>
                      <p>
                        {lang === 'ta'
                          ? 'தயாரிப்பு உங்களுக்கு டெலிவரி செய்யப்பட்ட பிறகு மதிப்புரை எழுதும் வசதி திறக்கப்படும். நன்றி!'
                          : 'Customer review submission unlocks once your package is marked as Delivered. Thank you for choosing Esan Foods!'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* 3. Case: Not ordered or not logged in */
                  <div className="no-reviews-gated-case animate-fade-in">
                    <p className="no-reviews-subtext">
                      {lang === 'ta'
                        ? 'இந்தத் தயாரிப்பை ஆர்டர் செய்து டெலிவரி பெற்ற வாடிக்கையாளர்கள் மட்டுமே விமர்சனம் எழுத முடியும்.'
                        : 'Only customers who have ordered and received this product can submit a review.'}
                    </p>
                    <div className="no-reviews-actions-cluster">
                      {!currentUser && onOpenAuth && (
                        <button
                          type="button"
                          className="btn-pill-primary"
                          onClick={onOpenAuth}
                        >
                          <UserCheck size={16} />
                          <span>{lang === 'ta' ? 'உள்நுழைக' : 'Sign In to Review'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-pill-subtle"
                        onClick={() => setShowVerificationBox((prev) => !prev)}
                      >
                        <ShieldCheck size={16} />
                        <span>{lang === 'ta' ? 'ஆர்டர் எண் மூலம் சரிபார்க்க' : 'Verify by Order ID'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
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
                            <span>
                              {rev.orderId ? `Verified Buyer #${rev.orderId}` : 'Verified Buyer'}
                            </span>
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
