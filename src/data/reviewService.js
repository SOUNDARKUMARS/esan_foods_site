import { supabase } from '../lib/supabase.js'

const STORAGE_KEY = 'esan_customer_reviews_v1'

// Rich, authentic seeded reviews for products
const INITIAL_REVIEWS = [
  // Guava Juice / Mudakathan Herbal
  {
    id: 'rev-1',
    productId: 'guava-juice',
    name: 'S. Ramanathan',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    title: 'Authentic traditional taste, feels truly pure',
    comment: 'The quality of Esan Foods is unmatched. The herbal blend is authentic, traditional, and 100% natural. After 2 weeks of daily intake I feel much lighter and energetic.',
    rating: 5,
    date: '2026-09-28',
    helpfulCount: 24,
    verified: true,
  },
  {
    id: 'rev-2',
    productId: 'guava-juice',
    name: 'Meenakshi Sundaram',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    title: 'Great herbal remedy for joint comfort',
    comment: 'My grandmother used to prepare fresh mudakathan soup back in the village. This brings back the same aroma and wholesome taste without any artificial additives.',
    rating: 5,
    date: '2026-10-02',
    helpfulCount: 18,
    verified: true,
  },
  {
    id: 'rev-3',
    productId: 'guava-juice',
    name: 'Arun Karthik',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    title: 'Very good quality packaging & fast delivery',
    comment: 'Clean glass jar packing and completely intact seal. Natural herbaceous aroma. Highly recommend to everyone looking for pure Tamil traditional herbs.',
    rating: 4,
    date: '2026-10-05',
    helpfulCount: 9,
    verified: true,
  },

  // Tender Coconut Water / Elaneer
  {
    id: 'rev-4',
    productId: 'coconut-water',
    name: 'Jason Miller',
    role: 'Fitness Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    title: 'Zero added sugar, pure natural hydration',
    comment: 'I love how pure and natural these food products are. No chemicals, no preservatives, just clean traditional health and instant electrolyte replenishment.',
    rating: 5,
    date: '2026-09-30',
    helpfulCount: 31,
    verified: true,
  },
  {
    id: 'rev-5',
    productId: 'coconut-water',
    name: 'Deepa Lakshmi',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    title: 'Crisp, sweet, and ultra refreshing',
    comment: 'Our whole family drinks this after morning yoga. Light and sweet just like drinking fresh tender coconut straight from Pollachi farm.',
    rating: 5,
    date: '2026-10-04',
    helpfulCount: 14,
    verified: true,
  },
  {
    id: 'rev-6',
    productId: 'coconut-water',
    name: 'M. Venkatesh',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    title: 'Very refreshing drink',
    comment: 'Tastes very crisp and natural. Price is fair for genuine certified quality.',
    rating: 4,
    date: '2026-10-07',
    helpfulCount: 5,
    verified: true,
  },

  // Tinned Passion
  {
    id: 'rev-7',
    productId: 'tinned-passion',
    name: 'Emily Carter',
    role: 'Marketing Manager',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    title: 'Clean natural stamina throughout the day',
    comment: 'My daily routine now includes Esan Foods herbal nutrition. Gives me clean natural stamina and vitality without coffee jitters.',
    rating: 5,
    date: '2026-09-25',
    helpfulCount: 22,
    verified: true,
  },
  {
    id: 'rev-8',
    productId: 'tinned-passion',
    name: 'Kavitha Natarajan',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    title: 'Tangy and invigorating herbal blend',
    comment: 'Very pleasing taste, not overly sweet. You can feel the real natural pulp and wellness herbs.',
    rating: 5,
    date: '2026-10-06',
    helpfulCount: 11,
    verified: true,
  },

  // Soursop Juice / Mulluseetha
  {
    id: 'rev-9',
    productId: 'soursop-juice',
    name: 'Daniel Rodriguez',
    role: 'Wellness Coach',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    title: 'Delightful surprise for my wellness clients',
    comment: 'You can really taste the premium quality. It does not feel overly sweet, just right. Soursop juice was a delightful surprise for my clients looking for rich antioxidants!',
    rating: 5,
    date: '2026-09-20',
    helpfulCount: 19,
    verified: true,
  },
  {
    id: 'rev-10',
    productId: 'soursop-juice',
    name: 'Suresh Kumar',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
    title: 'Hard-to-find fruit juice prepared cleanly',
    comment: 'Fresh mulluseetha is rarely available in cities. Finding it in pure cold-pressed form with zero preservatives made my day. Excellent quality.',
    rating: 5,
    date: '2026-10-08',
    helpfulCount: 12,
    verified: true,
  },

  // Sparkling Strawberry
  {
    id: 'rev-11',
    productId: 'sparkling-strawberry',
    name: 'Sophia Chen',
    role: 'Culinary Designer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    title: 'Our party favorite! Crisp berry notes',
    comment: 'The Sparkling Strawberry is our party favorite! Subtle bubbles, crisp berry notes, and clean natural ingredients.',
    rating: 5,
    date: '2026-09-15',
    helpfulCount: 17,
    verified: true,
  },
]

// Subscribers listener set
const listeners = new Set()

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch (err) {
      console.error('Error notifying review listener:', err)
    }
  })
}

let memoryReviewsCache = null

/**
 * Load all reviews from localStorage (or fallback to INITIAL_REVIEWS)
 */
export function getAllReviews() {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryReviewsCache = parsed
          return parsed
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REVIEWS))
    } catch (_) {}
  }
  if (!memoryReviewsCache) {
    memoryReviewsCache = [...INITIAL_REVIEWS]
  }
  return memoryReviewsCache
}

/**
 * Save all reviews to localStorage
 */
function saveReviews(reviews) {
  memoryReviewsCache = reviews
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
    } catch (_) {}
  }
  notifyListeners()
}

/**
 * Get reviews specifically for a given productId
 */
export function getReviewsForProduct(productId) {
  if (!productId) return []
  const all = getAllReviews()
  const prodIdStr = String(productId).toLowerCase().trim()
  return all
    .filter((r) => String(r.productId).toLowerCase().trim() === prodIdStr)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
}

/**
 * Calculate the comprehensive rating breakdown for a product
 */
export function getRatingSummary(productId) {
  const reviews = getReviewsForProduct(productId)
  
  if (reviews.length === 0) {
    return {
      average: 5.0,
      totalCount: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recommendedPercentage: 100,
    }
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let sum = 0
  let recommendedCount = 0

  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)))
    distribution[star] = (distribution[star] || 0) + 1
    sum += Number(r.rating) || 5
    if (star >= 4) {
      recommendedCount += 1
    }
  })

  const total = reviews.length
  const average = Number((sum / total).toFixed(1))
  const percentages = {
    5: Math.round((distribution[5] / total) * 100),
    4: Math.round((distribution[4] / total) * 100),
    3: Math.round((distribution[3] / total) * 100),
    2: Math.round((distribution[2] / total) * 100),
    1: Math.round((distribution[1] / total) * 100),
  }
  const recommendedPercentage = Math.round((recommendedCount / total) * 100)

  return {
    average,
    totalCount: total,
    distribution,
    percentages,
    recommendedPercentage,
  }
}

/**
 * Add a new customer review (from user side)
 * Non-editable by admin; strictly created from user feedback
 */
export async function addCustomerReview({
  productId,
  rating,
  name,
  title,
  comment,
  verified = true,
}) {
  if (!productId) throw new Error('Product ID is required')
  const numRating = Math.min(5, Math.max(1, Number(rating) || 5))
  const reviewerName = (name && name.trim()) || 'Happy Customer'
  const reviewComment = (comment && comment.trim()) || ''
  const reviewTitle = (title && title.trim()) || 'Verified Customer Review'

  const newReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    productId: String(productId).trim(),
    name: reviewerName,
    role: verified ? 'Verified Buyer' : 'Customer',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reviewerName)}&backgroundColor=059669,10b981`,
    title: reviewTitle,
    comment: reviewComment,
    rating: numRating,
    date: new Date().toISOString().split('T')[0],
    helpfulCount: 0,
    verified: Boolean(verified),
  }

  const all = getAllReviews()
  all.unshift(newReview)
  saveReviews(all)

  // Recalculate summary and sync to Supabase products table if exists
  const summary = getRatingSummary(productId)
  try {
    await supabase
      .from('products')
      .update({
        rating: summary.average,
        reviews_count: summary.totalCount,
      })
      .eq('id', productId)
  } catch (err) {
    console.warn('Could not sync rating to Supabase product row:', err)
  }

  return newReview
}

/**
 * Increment helpful votes for a review
 */
export function markReviewHelpful(reviewId) {
  const all = getAllReviews()
  const idx = all.findIndex((r) => r.id === reviewId)
  if (idx !== -1) {
    all[idx].helpfulCount = (all[idx].helpfulCount || 0) + 1
    saveReviews(all)
    return all[idx].helpfulCount
  }
  return 0
}

/**
 * Subscribe to review changes (real-time store updates across UI)
 */
export function subscribeToReviews(callback) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}
