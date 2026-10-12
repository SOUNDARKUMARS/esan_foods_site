import { ArrowRight, Truck, Sparkles } from 'lucide-react'
import { citrusBanner } from '../data/mockData'
import { EditableText, EditableImage } from './Editable'
import { BUCKETS } from '../data/storageService'

export default function CtaBanner({
  ctaContent = {},
  isEditMode = false,
  onUpdateCta,
  onOrderNow,
}) {
  const content = {
    tagline: 'Eat Pure, Live Healthy.',
    headline: 'Ready To Nourish Your Health?',
    subheadline:
      'Experience Traditional Wellness, Clean Natural Ingredients, And Pure Nutrition.',
    buttonText: 'Order Now',
    shippingNotice: 'Free Express Shipping On Orders Over ₹50',
    backgroundImage: '',
    ...ctaContent,
  }

  const updateField = (key, value) => {
    if (onUpdateCta) {
      onUpdateCta({
        ...content,
        [key]: value,
      })
    }
  }

  const bgImageSrc = content.backgroundImage || citrusBanner

  return (
    <section className="cta-banner-section">
      <div className="section-container">
        <div className="cta-banner-card">
          {/* Background image overlay with Admin Live Editing */}
          <div className="cta-banner-bg-wrap">
            {isEditMode ? (
              <EditableImage
                src={bgImageSrc}
                alt="CTA background banner"
                className="cta-banner-bg-img"
                wrapperClassName="cta-banner-editable-bg"
                isEditMode={isEditMode}
                bucket={BUCKETS.SITE_ASSETS}
                folder="banner"
                onChange={(newUrl) => updateField('backgroundImage', newUrl)}
              />
            ) : (
              <img
                src={bgImageSrc}
                alt="Sparkling citrus lime refreshment banner"
                className="cta-banner-bg-img"
                loading="lazy"
              />
            )}
            <div className="cta-banner-gradient-overlay"></div>
          </div>

          {/* Banner Content */}
          <div className="cta-banner-content">
            <div className="cta-tagline">
              <Sparkles size={14} />
              <EditableText
                value={content.tagline}
                onChange={(val) => updateField('tagline', val)}
                isEditMode={isEditMode}
                as="span"
                placeholder="Tagline..."
              />
            </div>

            <h2 className="cta-headline">
              <EditableText
                value={content.headline}
                onChange={(val) => updateField('headline', val)}
                isEditMode={isEditMode}
                as="span"
                placeholder="Headline..."
              />
            </h2>

            <p className="cta-subheadline">
              <EditableText
                value={content.subheadline}
                onChange={(val) => updateField('subheadline', val)}
                isEditMode={isEditMode}
                as="span"
                multiline={true}
                placeholder="Subheadline description..."
              />
            </p>

            <div className="cta-action-row">
              <button
                type="button"
                className="btn-pill-primary cta-order-btn"
                onClick={onOrderNow}
                id="cta-order-now-btn"
              >
                <EditableText
                  value={content.buttonText}
                  onChange={(val) => updateField('buttonText', val)}
                  isEditMode={isEditMode}
                  as="span"
                  placeholder="Button label..."
                />
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="cta-shipping-notice">
              <Truck size={14} />
              <EditableText
                value={content.shippingNotice}
                onChange={(val) => updateField('shippingNotice', val)}
                isEditMode={isEditMode}
                as="span"
                placeholder="Shipping notice..."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
