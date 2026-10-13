import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Check, ShieldCheck, Leaf, Globe, Heart } from 'lucide-react'
import esanLogo from '../assets/esan_foods_logo.png'

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
            <span className="newsletter-badge">Join The Natural Wellness Club</span>
            <h3 className="newsletter-heading">Unlock 15% Off Your First Pack</h3>
            <p className="newsletter-sub">
              Be the first to know about seasonal herbal harvests and exclusive member discounts.
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
              <img src={esanLogo} alt="Esan Foods" className="footer-logo-img" />
              <div className="logo-text-wrap">
                <span className="brand-name">Esan Foods</span>
                <span className="brand-badge">100% Natural & Healthy</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              Pioneering 100% natural, healthy, and authentic pure herbal foods. Traditional wellness recipes crafted with care for healthy living.
            </p>
            <div className="footer-badges-row">
              <div className="eco-badge">
                <Leaf size={14} />
                <span>100% Natural</span>
              </div>
              <div className="eco-badge">
                <Globe size={14} />
                <span>Pure Herbs</span>
              </div>
            </div>
          </div>

          {/* Column 2: Flavors & Shop */}
          <div className="footer-col">
            <h4 className="footer-col-title">Shop Products</h4>
            <ul className="footer-links-list">
              <li><a href="#collections">Mudakathan Leaf Powder</a></li>
              <li><a href="#collections">Pure Coconut Water</a></li>
              <li><a href="#collections">Guava Juice Drink</a></li>
              <li><a href="#spotlight">Tinned Passion Fruit</a></li>
              <li><a href="#collections">Herbal Health Blends</a></li>
              <li><a href="#collections">All Herbal Products</a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links-list">
              <li><a href="#benefits">Our Philosophy</a></li>
              <li><a href="#spotlight">Traditional Farming</a></li>
              {/* <li><a href="#reviews">Verified Reviews</a></li> */}
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
              <li><Link to="/delete-account">Delete Account & Data</Link></li>
              <li><a href="#home">Quality Guarantee</a></li>
              <li><a href="#home">Contact Concierge</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} Esan Foods. All Rights Reserved. Pure Herbs • Healthy Living.
          </p>
          <div className="legal-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="dot">•</span>
            <Link to="/terms">Terms of Service</Link>
            <span className="dot">•</span>
            <Link to="/delete-account">Delete Account</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
