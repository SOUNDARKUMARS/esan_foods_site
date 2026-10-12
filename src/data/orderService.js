/**
 * orderService.js
 * Supabase-backed order service for Esan Foods.
 * Replaces localStorage-based adminData.js for order management.
 */
import { supabase } from '../lib/supabase.js'

/**
 * Fetch all orders with their associated order items from Supabase.
 * Returns orders sorted by created_at descending (newest first).
 */
export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchOrders error:', error)
    throw error
  }

  // Transform to the shape that AdminDashboard and UI expect
  return (data || []).map(transformOrderFromDB)
}

/**
 * Fetch orders for a specific user by user_id or email.
 */
export async function fetchUserOrders(userId, email = null) {
  let query = supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  if (userId && email) {
    query = query.or(`user_id.eq.${userId},customer_email.eq.${email}`)
  } else if (userId) {
    query = query.eq('user_id', userId)
  } else if (email) {
    query = query.eq('customer_email', email)
  } else {
    return []
  }

  const { data, error } = await query

  if (error) {
    console.error('fetchUserOrders error:', error)
    throw error
  }

  return (data || []).map(transformOrderFromDB)
}

/**
 * Create a new order with line items in Supabase.
 * @param {Object} orderData - The order payload
 * @param {string} orderData.userId - Supabase auth user ID (nullable for guests)
 * @param {string} orderData.customerName
 * @param {string} orderData.customerEmail
 * @param {string} orderData.customerAvatar
 * @param {Array} orderData.items - Cart items [{product, quantity}]
 * @param {number} orderData.subtotal
 * @param {number} orderData.discountAmount
 * @param {string} orderData.discountCode
 * @param {number} orderData.shippingCost
 * @param {number} orderData.taxAmount
 * @param {number} orderData.total
 * @param {string} orderData.paymentMethod
 * @param {string} orderData.shippingAddress
 * @param {string} orderData.shippingCity
 * @param {string} orderData.shippingZip
 */
export async function createOrder(orderData) {
  // Generate a human-readable order ID
  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000)

  // 1. Insert the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      user_id: orderData.userId || null,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone || null,
      customer_avatar: orderData.customerAvatar || null,
      status: 'Processing',
      subtotal: orderData.subtotal,
      discount_amount: orderData.discountAmount || 0,
      discount_code: orderData.discountCode || null,
      shipping_cost: orderData.shippingCost || 0,
      tax_amount: orderData.taxAmount || 0,
      total: orderData.total,
      payment_method: orderData.paymentMethod || 'Credit Card',
      payment_status: 'Paid',
      shipping_address: orderData.shippingAddress || '',
      shipping_city: orderData.shippingCity || null,
      shipping_state: orderData.shippingState || null,
      shipping_zip: orderData.shippingZip || null,
      notes: orderData.notes || null,
    })
    .select()
    .single()

  if (orderError) {
    console.error('createOrder error:', orderError)
    throw orderError
  }

  // 2. Insert order items
  if (orderData.items && orderData.items.length > 0) {
    const orderItems = orderData.items.map((cartItem) => {
      const prod = cartItem.product || cartItem
      const unitPrice = Number(cartItem.price ?? prod.price ?? cartItem.unit_price ?? 0)
      const qty = Number(cartItem.quantity || cartItem.qty || 1)
      const optionTitle = cartItem.selectedOption?.title
      const prodName = prod.name || cartItem.product_name || 'Herbal Food Product'
      const lineName = optionTitle ? `${prodName} - ${optionTitle}` : prodName
      const lineVolume = cartItem.selectedOption?.size || prod.volume || cartItem.volume || '250g'

      return {
        order_id: orderId,
        product_id: prod.id || null,
        product_name: lineName,
        product_image: prod.image || cartItem.product_image || null,
        volume: lineVolume,
        unit_price: unitPrice,
        quantity: qty,
        total_price: unitPrice * qty,
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('createOrder items error:', itemsError)
      // Order was created but items failed - still return the order
    }
  }

  // 3. Return the full order with items
  return transformOrderFromDB({
    ...order,
    order_items: orderData.items.map((ci) => {
      const prod = ci.product || ci
      return {
        product_name: prod.name || ci.product_name,
        product_image: prod.image || ci.product_image,
        volume: prod.volume || ci.volume || '330ml',
        quantity: ci.quantity || ci.qty || 1,
        unit_price: Number(prod.price || ci.unit_price || 0),
        total_price: Number(prod.price || ci.unit_price || 0) * Number(ci.quantity || ci.qty || 1),
      }
    }),
  })
}

/**
 * Update the status of an existing order in Supabase.
 */
export async function updateOrderStatus(orderId, newStatus) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('updateOrderStatus error:', error)
    throw error
  }

  return data
}

/**
 * Delete an order and its items from Supabase.
 */
export async function deleteOrder(orderId) {
  // Items should cascade-delete if FK is set, but delete explicitly just in case
  await supabase.from('order_items').delete().eq('order_id', orderId)

  const { error } = await supabase.from('orders').delete().eq('id', orderId)

  if (error) {
    console.error('deleteOrder error:', error)
    throw error
  }
}

/**
 * Transform a Supabase order row into the shape expected by the app UI.
 * This maps snake_case DB columns to the camelCase/nested structure
 * used by AdminDashboard and CheckoutModal.
 */
function transformOrderFromDB(dbOrder) {
  const createdAt = dbOrder.created_at
    ? new Date(dbOrder.created_at)
    : new Date()

  return {
    id: dbOrder.id,
    customer: {
      name: dbOrder.customer_name || 'Guest Shopper',
      email: dbOrder.customer_email || '',
      avatar: dbOrder.customer_avatar || null,
    },
    items: Array.isArray(dbOrder.order_items) && dbOrder.order_items.length > 0
      ? dbOrder.order_items.map((item) => ({
          id: item.id,
          productId: item.product_id,
          name: item.product_name,
          qty: Number(item.quantity) || 1,
          price: Number(item.unit_price) || 0,
          image: item.product_image || null,
          volume: item.volume || '330ml',
          totalPrice: Number(item.total_price) || ((Number(item.unit_price) || 0) * (Number(item.quantity) || 1)),
        }))
      : [],
    subtotal: Number(dbOrder.subtotal) || 0,
    discountAmount: Number(dbOrder.discount_amount) || 0,
    discountCode: dbOrder.discount_code || null,
    shippingCost: Number(dbOrder.shipping_cost) || 0,
    taxAmount: Number(dbOrder.tax_amount) || 0,
    total: Number(dbOrder.total) || 0,
    status: dbOrder.status || 'Processing',
    date: createdAt
      .toISOString()
      .replace('T', ' ')
      .substring(0, 16),
    paymentMethod: dbOrder.payment_method || 'Credit Card',
    paymentStatus: dbOrder.payment_status || 'Paid',
    shippingAddress: dbOrder.shipping_address || '',
    shippingCity: dbOrder.shipping_city || null,
    shippingZip: dbOrder.shipping_zip || null,
    userId: dbOrder.user_id || null,
    notes: dbOrder.notes || null,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
  }
}
