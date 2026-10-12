import { supabase } from '../lib/supabase.js'
import { fetchUserOrders } from './orderService.js'
import { getAdminOrders } from './adminData.js'

const STORAGE_KEY = 'esan_customer_reviews_v1'

// No hardcoded seed reviews - all reviews must come from verified customers who received delivery
const INITIAL_REVIEWS = []

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
 * Load all reviews from localStorage (cleans out any stale mock seed reviews)
 */
export function getAllReviews() {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          // Filter out legacy mock seed reviews (rev-1 through rev-11)
          const realReviews = parsed.filter(
            (r) => !r.id || !/^rev-([1-9]|1[0-1])$/.test(String(r.id))
          )
          memoryReviewsCache = realReviews
          localStorage.setItem(STORAGE_KEY, JSON.stringify(realReviews))
          return realReviews
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    } catch (_) {}
  }
  if (!memoryReviewsCache) {
    memoryReviewsCache = []
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
 * Calculate the comprehensive rating breakdown for a product.
 * Returns true calculated statistics, zero when no reviews exist (no hardcoded fallback).
 */
export function getRatingSummary(productId) {
  const reviews = getReviewsForProduct(productId)

  if (reviews.length === 0) {
    return {
      average: 0,
      totalCount: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recommendedPercentage: 0,
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
 * Helper to test if an order line item matches a target productId or productName
 */
function orderMatchesProduct(order, productId, productName = '') {
  if (!order || !order.items || !Array.isArray(order.items)) return false
  const targetId = String(productId || '').toLowerCase().trim()
  const targetName = String(productName || '').toLowerCase().trim()

  return order.items.some((item) => {
    const itemId = String(item.productId || item.product_id || item.id || '').toLowerCase().trim()
    if (targetId && itemId === targetId) return true

    const itemName = String(item.name || item.product_name || '').toLowerCase().trim()
    if (targetName && (itemName.includes(targetName) || targetName.includes(itemName))) return true
    if (targetId && itemName.includes(targetId)) return true

    return false
  })
}

/**
 * Verification check: Only users who ordered this product AND whose order is marked 'Delivered'
 * are allowed to write a review.
 * Supports:
 * 1. Logged in user (currentUser)
 * 2. Manual verification via Order ID + Customer Email (for guests or direct lookup)
 */
export async function checkOrderDeliveryStatus({
  productId,
  productName = '',
  currentUser = null,
  orderId = null,
  email = null,
}) {
  if (!productId) {
    return { eligible: false, reason: 'NO_PRODUCT' }
  }

  let candidateOrders = []

  // 1. If currentUser is logged in, fetch their orders from Supabase & local storage
  if (currentUser) {
    try {
      const userOrders = await fetchUserOrders(
        currentUser.supabaseId || currentUser.id,
        currentUser.email
      )
      if (Array.isArray(userOrders)) {
        candidateOrders.push(...userOrders)
      }
    } catch (_) {}

    // Also check local admin orders
    try {
      const localOrders = getAdminOrders()
      if (Array.isArray(localOrders)) {
        const userMatches = localOrders.filter(
          (o) =>
            (currentUser.id && o.userId === currentUser.id) ||
            (currentUser.email &&
              String(o.customer?.email || '').toLowerCase() ===
                String(currentUser.email).toLowerCase())
        )
        userMatches.forEach((mo) => {
          if (!candidateOrders.some((co) => co.id === mo.id)) {
            candidateOrders.push(mo)
          }
        })
      }
    } catch (_) {}
  }

  // 2. If manual orderId and email are provided (guest verification or order number lookup)
  if (orderId && email) {
    const searchId = String(orderId).trim().toUpperCase()
    const searchEmail = String(email).trim().toLowerCase()

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', searchId)
        .ilike('customer_email', searchEmail)
        .single()

      if (!error && data) {
        // Transform Supabase structure
        const transformed = {
          id: data.id,
          status: data.status,
          customer: {
            name: data.customer_name || 'Guest Shopper',
            email: data.customer_email || searchEmail,
          },
          items: Array.isArray(data.order_items)
            ? data.order_items.map((i) => ({
                id: i.id,
                productId: i.product_id,
                name: i.product_name,
              }))
            : [],
        }
        if (!candidateOrders.some((co) => co.id === transformed.id)) {
          candidateOrders.push(transformed)
        }
      }
    } catch (_) {}

    // Also check local orders for matching orderId and email
    try {
      const localOrders = getAdminOrders()
      const match = localOrders.find(
        (o) =>
          String(o.id || '').trim().toUpperCase() === searchId &&
          String(o.customer?.email || '').trim().toLowerCase() === searchEmail
      )
      if (match && !candidateOrders.some((co) => co.id === match.id)) {
        candidateOrders.push(match)
      }
    } catch (_) {}
  }

  if (candidateOrders.length === 0) {
    if (!currentUser && !orderId) {
      return { eligible: false, reason: 'NOT_LOGGED_IN' }
    }
    if (orderId) {
      return { eligible: false, reason: 'ORDER_NOT_FOUND' }
    }
    return { eligible: false, reason: 'NOT_PURCHASED' }
  }

  // 3. Filter orders that contain this specific product
  const relevantOrders = candidateOrders.filter((ord) =>
    orderMatchesProduct(ord, productId, productName)
  )

  if (relevantOrders.length === 0) {
    return {
      eligible: false,
      reason: orderId ? 'PRODUCT_NOT_IN_ORDER' : 'NOT_PURCHASED',
    }
  }

  // 4. Check if any order is marked 'Delivered'
  const deliveredOrder = relevantOrders.find(
    (o) => String(o.status || '').toLowerCase() === 'delivered'
  )

  if (deliveredOrder) {
    return {
      eligible: true,
      reason: 'DELIVERED',
      order: deliveredOrder,
      customerName: deliveredOrder.customer?.name || currentUser?.name || '',
      customerEmail: deliveredOrder.customer?.email || currentUser?.email || '',
    }
  }

  // Order exists with this product, but not delivered yet
  const latestOrder = relevantOrders[0]
  return {
    eligible: false,
    reason: 'NOT_DELIVERED',
    order: latestOrder,
    status: latestOrder.status || 'Processing',
  }
}

/**
 * Add a new customer review (only for verified delivered purchases)
 */
export async function addCustomerReview({
  productId,
  rating,
  name,
  title,
  comment,
  verified = true,
  orderId = null,
}) {
  if (!productId) throw new Error('Product ID is required')
  const numRating = Math.min(5, Math.max(1, Number(rating) || 5))
  const reviewerName = (name && name.trim()) || 'Verified Buyer'
  const reviewComment = (comment && comment.trim()) || ''
  const reviewTitle = (title && title.trim()) || 'Verified Customer Review'

  const newReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    productId: String(productId).trim(),
    name: reviewerName,
    role: 'Verified Buyer',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reviewerName)}&backgroundColor=059669,10b981`,
    title: reviewTitle,
    comment: reviewComment,
    rating: numRating,
    date: new Date().toISOString().split('T')[0],
    helpfulCount: 0,
    verified: Boolean(verified),
    orderId: orderId || null,
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
