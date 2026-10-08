import React, { useState } from 'react'
import { Send, Check, ShieldCheck, Leaf, Globe, Heart } from 'lucide-react'

export default function Footer({ onSubscribeSuccess }) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email && email.includes('@')) {
      setSubscribed(true)
      if (onSubscribeSuccess) onSubscribeSuccess(email)
      setTimeout(() => {
        setEmail('')
      }, 2000)
    }
  }

  return (
    <footer className="site-footer">
      <div className="section-container">
        {/* Newsletter Banner */}
        <div className="footer-newsletter-card">
          <div className="newsletter-text">
            <span className="newsletter-badge">Join The Clean Drink Club</span>
            <h3 className="newsletter-heading">Unlock 15% Off Your First Pack</h3>
            <p className="newsletter-sub">
              Be the first to know about seasonal micro-harvest flavors and exclusive member discounts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="newsletter-form">
            {subscribed ? (
              <div className="newsletter-success-box animate-fade-in">
                <Check size={18} />
                <span>You're in! Check your inbox for code <strong>FRESH15</strong>.</span>
              </div>
            ) : (
              <div className="newsletter-input-group">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="newsletter-submit-btn">
                  <span>Subscribe</span>
                  <Send size={15} />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer Navigation Columns */}
        <div className="footer-nav-grid">
          {/* Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <span className="logo-leaf">🌿</span>
              <span className="brand-name">Juicera</span>
            </div>
            <p className="footer-brand-desc">
              Pioneering cold-pressed organic canned refreshments. Hand-tapped botanicals, real superfruits, and sparkling hydration crafted for mind and body.
            </p>
            <div className="footer-badges-row">
              <div className="eco-badge">
                <Leaf size={14} />
                <span>100% Organic</span>
              </div>
              <div className="eco-badge">
                <Globe size={14} />
                <span>Zero Plastic</span>
              </div>
            </div>
          </div>

          {/* Column 2: Flavors & Shop */}
          <div className="footer-col">
            <h4 className="footer-col-title">Shop Flavors</h4>
            <ul className="footer-links-list">
              <li><a href="#collections">Guava Juice Drink</a></li>
              <li><a href="#collections">Pure Coconut Water</a></li>
              <li><a href="#collections">Soursop Guanábana</a></li>
              <li><a href="#spotlight">Tinned Passion Fruit</a></li>
              <li><a href="#collections">Sparkling Strawberry</a></li>
              <li><a href="#collections">Golden Alphonso Mango</a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links-list">
              <li><a href="#benefits">Our Philosophy</a></li>
              <li><a href="#spotlight">Sustainable Aluminum</a></li>
              <li><a href="#reviews">Verified Reviews</a></li>
              <li><a href="#faq">Frequently Asked Questions</a></li>
              <li><a href="#home">Wholesale Inquiries</a></li>
              <li><a href="#home">Careers</a></li>
            </ul>
          </div>

          {/* Column 4: Customer Care */}
          <div className="footer-col">
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links-list">
              <li><a href="#home">Track Your Order</a></li>
              <li><a href="#home">Shipping & Returns</a></li>
              <li><a href="#home">Store Locator</a></li>
              <li><a href="#home">Quality Guarantee</a></li>
              <li><a href="#home">Contact Concierge</a></li>
              <li><a href="#home">Accessibility</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} Juicera Beverages Inc. All Rights Reserved. Crafted with care for wellness seekers.
          </p>
          <div className="legal-links">
            <a href="#home">Privacy Policy</a>
            <span className="dot">•</span>
            <a href="#home">Terms of Service</a>
            <span className="dot">•</span>
            <a href="#home">Cookie Preferences</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
