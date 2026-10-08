import React, { useState } from 'react'
import { ChevronDown, HelpCircle, Plus, Trash2 } from 'lucide-react'
import { FAQS as DEFAULT_FAQS } from '../data/mockData'
import { EditableText } from './Editable'

export default function FaqSection({ faqs, isEditMode = false, onUpdateFaqs }) {
  const faqList = faqs && faqs.length > 0 ? faqs : DEFAULT_FAQS
  const [openIndex, setOpenIndex] = useState(0)

  const toggleIndex = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx)
  }

  const handleUpdateFaq = (idx, field, value) => {
    if (!onUpdateFaqs) return
    const updated = faqList.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    )
    onUpdateFaqs(updated)
  }

  const handleAddFaq = () => {
    if (!onUpdateFaqs) return
    const newFaq = {
      q: 'New Question: What makes Juicera special?',
      a: 'Juicera uses 100% certified organic fruits and pure mountain spring water with zero artificial additives.',
    }
    onUpdateFaqs([...faqList, newFaq])
    setOpenIndex(faqList.length)
  }

  const handleDeleteFaq = (idx, e) => {
    e.stopPropagation()
    if (!onUpdateFaqs) return
    if (faqList.length <= 1) return
    const updated = faqList.filter((_, i) => i !== idx)
    onUpdateFaqs(updated)
  }

  return (
    <section className="faq-section" id="faq">
      <div className="section-container">
        <div className="faq-header text-center">
          <div className="section-pill-tag">
            <HelpCircle size={13} />
            <span>Got Questions?</span>
          </div>
          <h2 className="section-title">FREQUENTLY ASKED QUESTIONS</h2>
          <p className="section-subtitle">
            Everything you need to know about our sourcing, shelf life, and recycling.
          </p>

          {isEditMode && (
            <div className="admin-add-inline-row">
              <button
                type="button"
                className="btn-add-inline-item"
                onClick={handleAddFaq}
                title="Add a new FAQ question"
              >
                <Plus size={14} />
                <span>Add FAQ Question</span>
              </button>
            </div>
          )}
        </div>

        <div className="faq-list">
          {faqList.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <div className="faq-question-row">
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleIndex(index)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-question-text">
                      <EditableText
                        value={item.q}
                        onChange={(val) => handleUpdateFaq(index, 'q', val)}
                        isEditMode={isEditMode}
                        as="span"
                      />
                    </span>
                    <ChevronDown
                      size={18}
                      className={`faq-chevron ${isOpen ? 'rotate' : ''}`}
                    />
                  </button>

                  {isEditMode && (
                    <button
                      type="button"
                      className="admin-delete-item-btn-inline"
                      onClick={(e) => handleDeleteFaq(index, e)}
                      title="Delete this FAQ question"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="faq-answer-panel animate-fade-in">
                    <EditableText
                      value={item.a}
                      onChange={(val) => handleUpdateFaq(index, 'a', val)}
                      isEditMode={isEditMode}
                      as="p"
                      multiline={true}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
