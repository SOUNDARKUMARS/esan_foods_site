import React from 'react'
import { ArrowRight, Truck, Sparkles } from 'lucide-react'
import { citrusBanner } from '../data/mockData'

export default function CtaBanner({ onOrderNow }) {
  return (
    <section className="cta-banner-section">
      <div className="section-container">
        <div className="cta-banner-card">
          {/* Background image overlay */}
          <div className="cta-banner-bg-wrap">
            <img
              src={citrusBanner}
              alt="Sparkling citrus lime refreshment banner"
              className="cta-banner-bg-img"
              loading="lazy"
            />
            <div className="cta-banner-gradient-overlay"></div>
          </div>

          {/* Banner Content */}
          <div className="cta-banner-content">
            <div className="cta-tagline">
              <Sparkles size={14} />
              <span>Drink Fresh, Live Better.</span>
            </div>

            <h2 className="cta-headline">
              Ready To Refresh Your Day?
            </h2>

            <p className="cta-subheadline">
              Experience Bold Flavor, Clean Ingredients, And Pure Refreshment.
            </p>

            <div className="cta-action-row">
              <button
                type="button"
                className="btn-pill-primary cta-order-btn"
                onClick={onOrderNow}
                id="cta-order-now-btn"
              >
                <span>Order Now</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="cta-shipping-notice">
              <Truck size={14} />
              <span>Free Express Shipping On Orders Over $50</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
