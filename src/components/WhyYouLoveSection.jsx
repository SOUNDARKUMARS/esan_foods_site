import React from 'react'
import { Sparkles, Zap, Droplets, Heart, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { BENEFITS as DEFAULT_BENEFITS } from '../data/mockData'
import { EditableText } from './Editable'

const iconMap = {
  Sparkles: Sparkles,
  Zap: Zap,
  Droplets: Droplets,
  Heart: Heart,
}

export default function WhyYouLoveSection({
  benefits,
  isEditMode = false,
  onUpdateBenefits,
}) {
  const benefitList = benefits && benefits.length > 0 ? benefits : DEFAULT_BENEFITS

  const handleUpdateBenefit = (idx, field, value) => {
    if (!onUpdateBenefits) return
    const updated = benefitList.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    )
    onUpdateBenefits(updated)
  }

  const handleAddBenefit = () => {
    if (!onUpdateBenefits) return
    const newBenefit = {
      id: Date.now(),
      title: 'Antioxidant Rich',
      description: 'Strengthens your natural defenses with botanical antioxidants.',
      icon: 'Sparkles',
    }
    onUpdateBenefits([...benefitList, newBenefit])
  }

  const handleDeleteBenefit = (idx) => {
    if (!onUpdateBenefits) return
    if (benefitList.length <= 1) return
    const updated = benefitList.filter((_, i) => i !== idx)
    onUpdateBenefits(updated)
  }

  return (
    <section className="benefits-section" id="benefits">
      <div className="section-container">
        <div className="benefits-header text-center">
          <h2 className="section-title">WHY YOU'LL LOVE OUR NATURAL FOODS</h2>
          <p className="section-subtitle">
            Pure botanical craftsmanship meets functional daily wellness.
          </p>

          {isEditMode && (
            <div className="admin-add-inline-row">
              <button
                type="button"
                className="btn-add-inline-item"
                onClick={handleAddBenefit}
                title="Add a new benefit card"
              >
                <Plus size={14} />
                <span>Add Benefit Feature</span>
              </button>
            </div>
          )}
        </div>

        <div className="benefits-grid">
          {benefitList.map((item, index) => {
            const Icon = iconMap[item.icon] || Sparkles
            return (
              <div key={item.id || index} className="benefit-card">
                {isEditMode && (
                  <button
                    type="button"
                    className="admin-delete-item-btn"
                    onClick={() => handleDeleteBenefit(index)}
                    title="Delete this benefit"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                <div className="benefit-icon-wrap">
                  <Icon size={20} className="benefit-icon" />
                </div>
                <h3 className="benefit-card-title">
                  <EditableText
                    value={item.title}
                    onChange={(val) => handleUpdateBenefit(index, 'title', val)}
                    isEditMode={isEditMode}
                    as="span"
                  />
                </h3>
                <p className="benefit-card-desc">
                  <EditableText
                    value={item.description}
                    onChange={(val) => handleUpdateBenefit(index, 'description', val)}
                    isEditMode={isEditMode}
                    as="span"
                    multiline={true}
                  />
                </p>
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
