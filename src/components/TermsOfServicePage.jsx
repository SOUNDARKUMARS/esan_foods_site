import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, AlertCircle, CheckCircle, Scale } from 'lucide-react'

export default function TermsOfServicePage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="legal-page-container">
      <div className="legal-page-header">
        <Link to="/" className="legal-back-link">
          <ArrowLeft size={16} />
          <span>Back to Store</span>
        </Link>
        <div className="legal-badge">
          <Scale size={16} />
          <span>Legal Agreement</span>
        </div>
        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-subtitle">
          Last Updated: October 2026 • Esan Foods Terms & Conditions
        </p>
      </div>

      <div className="legal-card-body">
        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing our website (<strong>Esan Foods</strong>), purchasing our natural and herbal products, or interacting with our automated customer service channels (including Instagram DMs and web chat), you agree to be bound by these Terms of Service. If you do not agree to these terms, please refrain from using our services.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Herbal Products & Dietary Disclaimer</h2>
          <p>
            Esan Foods produces and distributes 100% natural, traditional herbal foods, leaf powders, juices, and wellness preparations.
          </p>
          <div className="legal-notice-box">
            <AlertCircle size={20} className="notice-icon" />
            <div>
              <strong>Important Wellness Notice:</strong>
              <p>
                Products and claims made on this website have not been evaluated by government medical bodies for diagnosing, treating, curing, or preventing any medical ailment. Information provided is for educational and traditional culinary awareness only. Always consult a certified healthcare practitioner before starting any herbal regimen, especially if you are pregnant, nursing, or undergoing medical treatment.
              </p>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>3. Ordering, Pricing & Payments</h2>
          <ul>
            <li>All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly stated otherwise.</li>
            <li>We reserve the right to revise product prices, promotional discounts, or cancel orders arising from typographical or system errors.</li>
            <li>Payments are handled through encrypted, RBI-authorized third-party payment gateways (Razorpay, UPI, Net Banking, Credit/Debit cards). Orders are confirmed upon receipt of valid payment or confirmation of Cash on Delivery (COD) eligibility.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Shipping, Delivery & Tracking</h2>
          <ul>
            <li>We dispatch orders across India using reputed courier and logistics partners (such as Shiprocket).</li>
            <li>Estimated dispatch is within 24–48 hours of order confirmation. Delivery transit times range between 2 to 7 business days depending on delivery pincode.</li>
            <li>Real-time tracking links are provided via SMS, email, and inside your user account dashboard.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Returns, Replacements & Cancellations</h2>
          <ul>
            <li>Because our products consist of natural, consumable food items, we cannot accept returns once the security seal is opened, except in instances of transit damage, product defect, or incorrect item delivery.</li>
            <li>If you receive a damaged or incorrect package, please contact us within 48 hours of delivery with photographic evidence. Upon verification, a free replacement or full refund will be processed to your original payment method within 5–7 business days.</li>
            <li>Orders can be cancelled before dispatch directly through your account or by contacting customer support.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. User Accounts & Data Deletion</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials. You can update your profile or delete your account at any time by visiting our <Link to="/delete-account" className="legal-inline-link">Account Deletion Page</Link>.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Governing Law & Jurisdiction</h2>
          <p>
            These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising from or relating to your use of this store shall be subject to the exclusive jurisdiction of the competent courts in Tamil Nadu, India.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Contact Information</h2>
          <div className="legal-contact-box">
            <p><strong>Esan Foods Support</strong></p>
            <p>Email: <a href="mailto:support@esanfoods.com">support@esanfoods.com</a></p>
            <p>Headquarters: Tamil Nadu, India</p>
          </div>
        </section>
      </div>
    </div>
  )
}
