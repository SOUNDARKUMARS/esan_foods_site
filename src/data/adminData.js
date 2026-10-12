// Initial mock orders, inventory state, and revenue metrics stored in localStorage

const ORDERS_KEY = 'juicera_admin_orders'
const INVENTORY_KEY = 'juicera_admin_inventory'

export const INITIAL_ORDERS = [
  {
    id: 'ORD-9842',
    customer: {
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      avatar: null,
    },
    items: [
      { name: 'Guava Juice Drink (330ml)', qty: 4, price: 3.50 },
      { name: 'Tinned Passion Juice (330ml)', qty: 2, price: 6.20 },
    ],
    total: 26.40,
    status: 'Delivered',
    date: '2026-10-07 18:32',
    paymentMethod: 'Credit Card (••4242)',
    shippingAddress: '420 Mission St, San Francisco, CA',
  },
  {
    id: 'ORD-9841',
    customer: {
      name: 'Marcus Vance',
      email: 'm.vance@fitlife.org',
      avatar: null,
    },
    items: [
      { name: 'Pure Coconut Water (330ml)', qty: 12, price: 4.50 },
    ],
    total: 54.00,
    status: 'Processing',
    date: '2026-10-07 19:15',
    paymentMethod: 'Apple Pay',
    shippingAddress: '1088 Sunset Blvd, Los Angeles, CA',
  },
  {
    id: 'ORD-9840',
    customer: {
      name: 'Elena Rostova',
      email: 'elena.rostova@design.io',
      avatar: null,
    },
    items: [
      { name: 'Soursop Juice (330ml)', qty: 6, price: 4.50 },
      { name: 'Sparkling Strawberry (330ml)', qty: 6, price: 3.80 },
    ],
    total: 49.80,
    status: 'Shipped',
    date: '2026-10-07 16:40',
    paymentMethod: 'Credit Card (••8819)',
    shippingAddress: '742 Park Ave, New York, NY',
  },
  {
    id: 'ORD-9839',
    customer: {
      name: 'David Kim',
      email: 'david.kim@techcorp.com',
      avatar: null,
    },
    items: [
      { name: 'Golden Mango Zing (330ml)', qty: 8, price: 3.90 },
      { name: 'Tinned Passion Juice (330ml)', qty: 4, price: 6.20 },
    ],
    total: 56.00,
    status: 'Delivered',
    date: '2026-10-06 14:12',
    paymentMethod: 'PayPal',
    shippingAddress: '120 University Ave, Palo Alto, CA',
  },
  {
    id: 'ORD-9838',
    customer: {
      name: 'Chloe Bennett',
      email: 'chloe.b@natureclub.net',
      avatar: null,
    },
    items: [
      { name: 'Guava Juice Drink (330ml)', qty: 2, price: 3.50 },
    ],
    total: 7.00,
    status: 'Cancelled',
    date: '2026-10-06 11:05',
    paymentMethod: 'Credit Card (••1042)',
    shippingAddress: '88 King St, Seattle, WA',
  },
]

export function getAdminOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS))
      return INITIAL_ORDERS
    }
    return JSON.parse(raw)
  } catch (e) {
    return INITIAL_ORDERS
  }
}

export function saveAdminOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

export function updateOrderStatus(orderId, newStatus) {
  const orders = getAdminOrders()
  const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
  saveAdminOrders(updated)
  return updated
}

export function addAdminOrder(order) {
  const orders = getAdminOrders()
  const updated = [order, ...orders]
  saveAdminOrders(updated)
  return updated
}
