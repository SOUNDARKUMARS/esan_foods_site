// Initial orders, inventory state, and revenue metrics stored in localStorage

const ORDERS_KEY = 'juicera_admin_orders'
const INVENTORY_KEY = 'juicera_admin_inventory'

// No hardcoded mock orders - all orders must come from actual checkouts
export const INITIAL_ORDERS = []

const MOCK_ORDER_IDS = new Set(['ORD-9842', 'ORD-9841', 'ORD-9840', 'ORD-9839', 'ORD-9838'])

export function getAdminOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // Filter out legacy hardcoded mock orders
      const realOrders = parsed.filter((o) => !MOCK_ORDER_IDS.has(o.id))
      return realOrders
    }
    return []
  } catch (e) {
    return []
  }
}

export function saveAdminOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch (_) {}
}

export function updateOrderStatus(orderId, newStatus) {
  const orders = getAdminOrders()
  const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
  saveAdminOrders(updated)
  return updated
}

export function addAdminOrder(order) {
  const orders = getAdminOrders()
  // Prevent duplicate insertion
  const existingIdx = orders.findIndex((o) => o.id === order.id)
  let updated
  if (existingIdx !== -1) {
    updated = [...orders]
    updated[existingIdx] = order
  } else {
    updated = [order, ...orders]
  }
  saveAdminOrders(updated)
  return updated
}
