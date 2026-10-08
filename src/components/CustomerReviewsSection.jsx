import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, Star, Quote } from 'lucide-react'
import { REVIEWS } from '../data/mockData'

export default function CustomerReviewsSection() {
  const [startIndex, setStartIndex] = useState(0)

  // Visible items window (e.g., 3-4 cards responsive)
  const handlePrev = () => {
    setStartIndex((prev) => (prev > 0 ? prev - 1 : REVIEWS.length - 1))
  }

  const handleNext = () => {
    setStartIndex((prev) => (prev < REVIEWS.length - 1 ? prev + 1 : 0))
  }

  return (
    <section className="reviews-section" id="reviews">
      <div className="section-container">
        {/* Section Header */}
        <div className="reviews-header text-center">
          <h2 className="section-title">WHAT OUR CUSTOMERS SAY</h2>
          <p className="section-subtitle">
            Real feedback from health-conscious drink lovers and athletes worldwide.
          </p>
        </div>

        {/* Reviews Cards Slider / Carousel */}
        <div className="reviews-carousel-wrapper">
          <div className="reviews-cards-row">
            {REVIEWS.map((review, idx) => (
              <div key={review.id} className="review-card">
                {/* Top Row: Mini Product Can thumbnail */}
                <div className="review-card-top">
                  <div className="review-quote-text">
                    "{review.quote}"
                  </div>
                  <div className="review-can-thumbnail">
                    <img src={review.canImg} alt="Favorite drink" />
                  </div>
                </div>

                {/* Bottom Row: User Avatar, Name, Role & Star Badge */}
                <div className="review-card-footer">
                  <div className="review-user-info">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="review-user-avatar"
                    />
                    <div className="review-user-meta">
                      <h4 className="review-user-name">{review.name}</h4>
                      <span className="review-user-role">{review.role}</span>
                    </div>
                  </div>

                  <div className="review-rating-pill">
                    <Star size={12} className="review-star-icon" fill="currentColor" />
                    <span>{review.rating.toFixed(1)}/5</span>
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
