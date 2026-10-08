import { supabase } from '../lib/supabase'
import { REVIEWS, FAQS, BENEFITS } from './mockData'

export const DEFAULT_SITE_CONTENT = {
  hero: {
    badgeReviewScore: '4.9/5',
    badgeReviewCount: '18,130 (Reviews)',
    headlineLine1: 'FEEL THE',
    headlineHighlight: 'REFRESHMENT',
    headlineLine2: 'IN EVERY SIP',
    subtext:
      'A Perfectly Balanced Drink Made With Natural Ingredients To Hydrate, Energize, And Refresh You Anytime, Anywhere.',
    metaPill1: 'Healthy Juice Drink',
    metaPill2Val: '100%',
    metaPill2Sub: 'Organic Fruit Drink',
    trustItem1: 'Non-GMO Verified',
    trustItem2: 'Zero Artificial Sweeteners',
    trustItem3: 'Infinitely Recyclable Aluminum',
    badgeTopRightEmoji: '🌿',
    badgeTopRightBold: '100% Natural',
    badgeTopRightLight: 'Pure Herbal Leaf',
    badgeBottomLeftEmoji: '🍃',
    badgeBottomLeftBold: 'Traditional Recipe',
    badgeBottomLeftLight: 'No Preservatives',
    heroImage: '', // empty defaults to local hero_cans.jpg
  },
  featuredProductId: 'tinned-passion',
  testimonials: REVIEWS,
  faqs: FAQS,
  whyLove: BENEFITS,
}

// Convert database row to frontend model
function formatContentFromDb(row) {
  if (!row) return DEFAULT_SITE_CONTENT
  return {
    hero: {
      ...DEFAULT_SITE_CONTENT.hero,
      ...(row.hero || {}),
    },
    featuredProductId: row.featured_product_id || DEFAULT_SITE_CONTENT.featuredProductId,
    testimonials: Array.isArray(row.testimonials) && row.testimonials.length > 0
      ? row.testimonials
      : DEFAULT_SITE_CONTENT.testimonials,
    faqs: Array.isArray(row.faqs) && row.faqs.length > 0
      ? row.faqs
      : DEFAULT_SITE_CONTENT.faqs,
    whyLove: Array.isArray(row.why_love) && row.why_love.length > 0
      ? row.why_love
      : DEFAULT_SITE_CONTENT.whyLove,
  }
}

// 1. Fetch site content from Supabase
export async function fetchSiteContent() {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('id', 'main')
      .maybeSingle()

    if (error) {
      console.warn('site_content fetch note:', error.message)
      return DEFAULT_SITE_CONTENT
    }

    if (data) {
      return formatContentFromDb(data)
    }

    return DEFAULT_SITE_CONTENT
  } catch (err) {
    console.warn('Unable to load site_content from database, using defaults:', err)
    return DEFAULT_SITE_CONTENT
  }
}

// 2. Save site content to Supabase
export async function saveSiteContent(content) {
  const payload = {
    id: 'main',
    hero: content.hero || DEFAULT_SITE_CONTENT.hero,
    featured_product_id: content.featuredProductId || 'tinned-passion',
    testimonials: content.testimonials || DEFAULT_SITE_CONTENT.testimonials,
    faqs: content.faqs || DEFAULT_SITE_CONTENT.faqs,
    why_love: content.whyLove || DEFAULT_SITE_CONTENT.whyLove,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('site_content')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('Failed to save site_content to Supabase:', error)
    throw error
  }

  return formatContentFromDb(data)
}
