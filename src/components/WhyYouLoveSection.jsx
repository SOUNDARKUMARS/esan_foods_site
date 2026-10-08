import React from 'react'
import { Sparkles, Zap, Droplets, Heart, CheckCircle2 } from 'lucide-react'
import { BENEFITS } from '../data/mockData'

const iconMap = {
  Sparkles: Sparkles,
  Zap: Zap,
  Droplets: Droplets,
  Heart: Heart,
}

export default function WhyYouLoveSection() {
  return (
    <section className="benefits-section" id="benefits">
      <div className="section-container">
        <div className="benefits-header text-center">
          <h2 className="section-title">WHY YOU'LL LOVE THIS DRINK</h2>
          <p className="section-subtitle">
            Pure botanical craftsmanship meets functional daily wellness.
          </p>
        </div>

        <div className="benefits-grid">
          {BENEFITS.map((item) => {
            const Icon = iconMap[item.icon] || Sparkles
            return (
              <div key={item.id} className="benefit-card">
                <div className="benefit-icon-wrap">
                  <Icon size={20} className="benefit-icon" />
                </div>
                <h3 className="benefit-card-title">{item.title}</h3>
                <p className="benefit-card-desc">{item.description}</p>
                <div className="benefit-check-indicator">
                  <CheckCircle2 size={14} />
                  <span>Lab Tested & Certified</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
