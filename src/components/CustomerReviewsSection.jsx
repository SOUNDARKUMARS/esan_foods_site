import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, Star, Plus, Trash2 } from 'lucide-react'
import { REVIEWS as DEFAULT_REVIEWS } from '../data/mockData'
import { EditableText } from './Editable'

export default function CustomerReviewsSection({
  testimonials,
  isEditMode = false,
  onUpdateTestimonials,
}) {
  const reviewsList = testimonials && testimonials.length > 0 ? testimonials : DEFAULT_REVIEWS
  const [startIndex, setStartIndex] = useState(0)

  const handlePrev = () => {
    setStartIndex((prev) => (prev > 0 ? prev - 1 : reviewsList.length - 1))
  }

  const handleNext = () => {
    setStartIndex((prev) => (prev < reviewsList.length - 1 ? prev + 1 : 0))
  }

  const handleUpdateReviewField = (idx, field, value) => {
    if (!onUpdateTestimonials) return
    const updated = reviewsList.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    )
    onUpdateTestimonials(updated)
  }

  const handleAddReview = () => {
    if (!onUpdateTestimonials) return
    const newReview = {
      id: Date.now(),
      name: 'New Reviewer',
      role: 'Verified Buyer',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      quote: 'Esan Foods herbal products bring authentic natural nourishment right into my day!',
      rating: 5.0,
      productId: 'guava-juice',
    }
    onUpdateTestimonials([...reviewsList, newReview])
  }

  const handleDeleteReview = (idx) => {
    if (!onUpdateTestimonials) return
    if (reviewsList.length <= 1) return
    const updated = reviewsList.filter((_, i) => i !== idx)
    onUpdateTestimonials(updated)
  }

  return (
    <section className="reviews-section" id="reviews">
      <div className="section-container">
        {/* Section Header */}
        <div className="reviews-header text-center">
          <h2 className="section-title">WHAT OUR CUSTOMERS SAY</h2>
          <p className="section-subtitle">
            Real feedback from health-conscious families and wellness enthusiasts.
          </p>

          {isEditMode && (
            <div className="admin-add-inline-row">
              <button
                type="button"
                className="btn-add-inline-item"
                onClick={handleAddReview}
                title="Add a new customer testimonial"
              >
                <Plus size={14} />
                <span>Add Testimonial</span>
              </button>
            </div>
          )}
        </div>

        {/* Reviews Cards Slider / Carousel */}
        <div className="reviews-carousel-wrapper">
          <div className="reviews-cards-row">
            {reviewsList.map((review, idx) => (
              <div key={review.id || idx} className="review-card">
                {/* Delete button in Edit Mode */}
                {isEditMode && (
                  <button
                    type="button"
                    className="admin-delete-item-btn"
                    onClick={() => handleDeleteReview(idx)}
                    title="Delete this testimonial"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                {/* Top Row: Quote */}
                <div className="review-card-top">
                  <div className="review-quote-text">
                    "
                    <EditableText
                      value={review.quote}
                      onChange={(val) => handleUpdateReviewField(idx, 'quote', val)}
                      isEditMode={isEditMode}
                      multiline={true}
                    />
                    "
                  </div>
                  {review.canImg && (
                    <div className="review-can-thumbnail">
                      <img src={review.canImg} alt="Favorite drink" />
                    </div>
                  )}
                </div>

                {/* Bottom Row: User Avatar, Name, Role & Star Badge */}
                <div className="review-card-footer">
                  <div className="review-user-info">
                    <img
                      src={
                        review.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                      }
                      alt={review.name}
                      className="review-user-avatar"
                    />
                    <div className="review-user-meta">
                      <EditableText
                        value={review.name}
                        onChange={(val) => handleUpdateReviewField(idx, 'name', val)}
                        isEditMode={isEditMode}
                        as="h4"
                        className="review-user-name"
                      />
                      <EditableText
                        value={review.role}
                        onChange={(val) => handleUpdateReviewField(idx, 'role', val)}
                        isEditMode={isEditMode}
                        as="span"
                        className="review-user-role"
                      />
                    </div>
                  </div>

                  <div className="review-rating-pill">
                    <Star size={12} className="review-star-icon" fill="currentColor" />
                    <span>{Number(review.rating || 5).toFixed(1)}/5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Arrows */}
          <div className="reviews-nav-controls">
            <button
              type="button"
              className="carousel-arrow-btn"
              onClick={handlePrev}
              aria-label="Previous review"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              className="carousel-arrow-btn"
              onClick={handleNext}
              aria-label="Next review"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
