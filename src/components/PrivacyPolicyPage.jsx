import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, Eye, Bell, ArrowLeft, Mail, FileText } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
          <ShieldCheck size={16} />
          <span>Privacy & Data Protection</span>
        </div>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-subtitle">
          Last Updated: October 2026 • Esan Foods Official Policy
        </p>
      </div>

      <div className="legal-card-body">
        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to <strong>Esan Foods</strong> ("we", "our", or "us"). We are committed to safeguarding your personal privacy and maintaining strict confidentiality regarding the information you share with us across our website, mobile interfaces, social messaging channels (including Instagram Direct Messaging and Meta Platform integrations), and customer support services.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <p>We only collect information necessary to fulfill orders, provide customer care, and improve your shopping experience:</p>
          <ul>
            <li><strong>Account & Contact Data:</strong> Name, email address, mobile phone number, delivery address, city, state, and postal code.</li>
            <li><strong>Order & Transaction Records:</strong> Purchased products, quantities, billing records, delivery tracking updates, and payment transaction references (we do not store your raw credit/debit card numbers or CVV; payments are processed securely through RBI-compliant gateways like Razorpay).</li>
            <li><strong>Social Media & Messaging Interactions:</strong> If you connect with our AI concierge or customer support via Instagram DM, Facebook Messenger, or website live chat, we collect your interaction history, user handle, and communication preferences to fulfill inquiries.</li>
            <li><strong>Technical & Browsing Data:</strong> Device browser, IP address, operating system, and anonymous cookie identifiers for session management and site performance.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>Your data is processed strictly for legitimate business operations:</p>
          <ul>
            <li>Processing, packing, and dispatching your herbal and organic food orders.</li>
            <li>Sending SMS, WhatsApp, or email notifications regarding tracking, order status, and delivery schedules.</li>
            <li>Providing instant automated customer assistance and conversational support.</li>
            <li>Complying with statutory accounting, tax, and consumer protection laws in India.</li>
            <li>Preventing fraudulent orders and maintaining account security.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Data Sharing & Third-Party Processors</h2>
          <p>
            We strictly <strong>never sell, rent, or trade your personal data</strong> to third-party advertisers. We only share essential operational data with trusted infrastructure providers under strict data privacy agreements:
          </p>
          <ul>
            <li><strong>Payment Gateways:</strong> Razorpay (PCI-DSS compliant payment processing).</li>
            <li><strong>Logistics Partners:</strong> Courier and shipping aggregators (e.g., Shiprocket) strictly for parcel delivery.</li>
            <li><strong>Cloud & Database Hosting:</strong> Supabase with encrypted Row Level Security (RLS).</li>
            <li><strong>Meta / Instagram APIs:</strong> To process authorized customer queries initiated via social channels.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Data Retention & Your Rights</h2>
          <p>
            You have full control over your data. In accordance with the Digital Personal Data Protection (DPDP) regulations and global privacy standards:
          </p>
          <ul>
            <li>You can review, update, or edit your mobile number and profile details at any time through your account.</li>
            <li>You have the right to request full deletion of your account and personal records at any time.</li>
            <li>To delete your account or erase your data, visit our dedicated <Link to="/delete-account" className="legal-inline-link">Delete Account & Data Deletion Portal</Link>.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or how your personal information is handled, please contact our Data Protection Concierge:
          </p>
          <div className="legal-contact-box">
            <p><strong>Esan Foods Privacy Office</strong></p>
            <p>Email: <a href="mailto:support@esanfoods.com">support@esanfoods.com</a> / <a href="mailto:privacy@esanfoods.com">privacy@esanfoods.com</a></p>
            <p>Location: Tamil Nadu, India</p>
          </div>
        </section>
      </div>
    </div>
  )
}
