import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { FAQS } from '../data/mockData'

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  const toggleIndex = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx)
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
        </div>

        <div className="faq-list">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleIndex(index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`faq-chevron ${isOpen ? 'rotate' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="faq-answer-panel animate-fade-in">
                    <p>{item.a}</p>
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
