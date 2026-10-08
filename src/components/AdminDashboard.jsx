import React, { useState } from 'react'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Boxes,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ExternalLink,
  Shield,
  Eye,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { getAdminOrders, updateOrderStatus } from '../data/adminData'

export default function AdminDashboard({
  adminUser,
  onLogout,
  onSwitchToStore,
  products,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
}) {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'products' | 'orders' | 'customers' | 'settings'
  const [orders, setOrders] = useState(getAdminOrders())
  const [orderFilter, setOrderFilter] = useState('All')
  const [productSearch, setProductSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [adminNotification, setAdminNotification] = useState('')

  // Form state for creating a new drink product
  const [newProd, setNewProd] = useState({
    name: '',
    subtitle: '',
    category: '100% Pure Juice',
    volume: '330ml',
    price: 3.99,
    badge: 'Organic',
    color: '#059669',
    calories: '90 kcal',
    sugar: '10g',
    description: '',
  })

  // Calculations for overview cards
  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0)
  const totalOrdersCount = orders.length
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'Processing' || o.status === 'Shipped'
  ).length

  const handleStatusChange = (orderId, newStatus) => {
    const updated = updateOrderStatus(orderId, newStatus)
    setOrders(updated)
    setAdminNotification(`Order ${orderId} updated to ${newStatus}`)
    setTimeout(() => setAdminNotification(''), 3000)
  }

  const handleSaveEditProduct = (e) => {
    e.preventDefault()
    if (!editingProduct) return
    onUpdateProduct(editingProduct)
    setEditingProduct(null)
    setAdminNotification(`Product ${editingProduct.name} updated!`)
    setTimeout(() => setAdminNotification(''), 3000)
  }

  const handleCreateProduct = (e) => {
    e.preventDefault()
    if (!newProd.name) return
    const created = {
      id: 'prod-' + Date.now(),
      name: newProd.name,
      subtitle: newProd.subtitle || 'Fresh Organic Blend',
      volume: newProd.volume || '330ml',
      price: parseFloat(newProd.price) || 3.99,
      category: newProd.category,
      rating: 5.0,
      reviewsCount: 1,
      badge: newProd.badge || 'New',
      image: products[0]?.image || '',
      color: newProd.color || '#10b981',
      bgSoft: '#f0fdf4',
      description: newProd.description || 'Delicious 100% natural beverage.',
      nutrition: {
        calories: newProd.calories || '95 kcal',
        sugar: newProd.sugar || '10g',
        carbs: '20g',
        vitaminC: '100% DV',
        organic: '100% Certified',
      },
      tastingNotes: ['Crisp', 'Refreshing'],
      ingredients: ['Organic Fruit', 'Filtered Water'],
    }
    onAddProduct(created)
    setIsAddProductOpen(false)
    setNewProd({
      name: '',
      subtitle: '',
      category: '100% Pure Juice',
      volume: '330ml',
      price: 3.99,
      badge: 'Organic',
      color: '#059669',
      calories: '90 kcal',
      sugar: '10g',
      description: '',
    })
    setAdminNotification(`Created new product: ${created.name}`)
    setTimeout(() => setAdminNotification(''), 3000)
  }

  // Filtered orders
  const filteredOrders =
    orderFilter === 'All'
      ? orders
      : orders.filter((o) => o.status.toLowerCase() === orderFilter.toLowerCase())

  // Filtered products in admin list
  const filteredProductsList = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="admin-layout-root animate-fade-in">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand-icon">
            <span>🌿</span>
          </div>
          <div className="admin-brand-titles">
            <h2 className="admin-brand-name">Juicera Admin</h2>
            <span className="admin-secure-tag">
              <Shield size={11} /> Secured Console
            </span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Overview & Metrics</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Boxes size={18} />
            <span>Inventory & Products</span>
            <span className="admin-badge-count">{products.length}</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={18} />
            <span>Orders Management</span>
            <span className="admin-badge-count">{orders.length}</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={18} />
            <span>Customers & VIPs</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            <span>Security & Store Config</span>
          </button>
        </nav>

        {/* Admin Quick Switch & Logout */}
        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-switch-store-btn"
            onClick={onSwitchToStore}
            title="View live consumer storefront"
          >
            <ExternalLink size={16} />
            <span>View Public Storefront</span>
          </button>

          <div className="admin-profile-pill">
            <img
              src={adminUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt="Admin avatar"
              className="admin-avatar-img"
            />
            <div className="admin-profile-meta">
              <span className="admin-profile-name">{adminUser?.name || 'Administrator'}</span>
              <span className="admin-profile-email">{adminUser?.email || 'admin@123'}</span>
            </div>
            <button
              type="button"
              className="admin-logout-icon-btn"
              onClick={onLogout}
              title="Secure Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-viewport">
        {/* Top Header Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h1 className="admin-page-title">
              {activeTab === 'overview' && 'Executive Dashboard'}
              {activeTab === 'products' && 'Product Inventory & Pricing'}
              {activeTab === 'orders' && 'Real-Time Orders & Fulfillment'}
              {activeTab === 'customers' && 'Customer CRM & Member Club'}
              {activeTab === 'settings' && 'Admin Credentials & Security'}
            </h1>
            <p className="admin-page-sub">
              Logged in with verified administrator credentials: <strong>{adminUser?.email}</strong>
            </p>
          </div>

          <div className="admin-topbar-actions">
            {adminNotification && (
              <div className="admin-banner-alert animate-fade-in">
                <CheckCircle size={15} />
                <span>{adminNotification}</span>
              </div>
            )}
            <button
              type="button"
              className="admin-store-link-pill"
              onClick={onSwitchToStore}
            >
              <ExternalLink size={15} />
              <span>Back to Store</span>
            </button>
            <button
              type="button"
              className="admin-logout-pill"
              onClick={onLogout}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="admin-tab-content animate-fade-in">
            {/* Stat KPI Cards */}
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap kpi-green">
                  <DollarSign size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Gross Revenue</span>
                  <h3 className="kpi-val">${totalRevenue.toFixed(2)}</h3>
                  <span className="kpi-trend positive">
                    <TrendingUp size={12} /> +18.4% vs last week
                  </span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap kpi-blue">
                  <ShoppingBag size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Placed Orders</span>
                  <h3 className="kpi-val">{totalOrdersCount}</h3>
                  <span className="kpi-trend neutral">
                    {deliveredOrdersCount} fulfilled · {pendingOrdersCount} in transit
                  </span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap kpi-amber">
                  <Boxes size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Active SKUs</span>
                  <h3 className="kpi-val">{products.length} Drinks</h3>
                  <span className="kpi-trend positive">All items in stock</span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap kpi-purple">
                  <Users size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Club Members</span>
                  <h3 className="kpi-val">1,420</h3>
                  <span className="kpi-trend positive">94.2% repeat rate</span>
                </div>
              </div>
            </div>

            {/* Recent Orders & Quick Stock Highlights */}
            <div className="admin-split-grid">
              {/* Recent Orders Mini Table */}
              <div className="admin-section-box">
                <div className="section-box-header">
                  <h3 className="section-box-title">Recent Customer Orders</h3>
                  <button
                    type="button"
                    className="admin-link-btn"
                    onClick={() => setActiveTab('orders')}
                  >
                    View All Orders →
                  </button>
                </div>
                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 4).map((order) => (
                        <tr key={order.id}>
                          <td><strong>#{order.id}</strong></td>
                          <td>
                            <div className="customer-cell">
                              <img src={order.customer.avatar} alt="" className="table-avatar" />
                              <span>{order.customer.name}</span>
                            </div>
                          </td>
                          <td><strong>${order.total.toFixed(2)}</strong></td>
                          <td>
                            <span className={`status-pill status-${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="admin-status-select"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Best Selling Products Mini Preview */}
              <div className="admin-section-box">
                <div className="section-box-header">
                  <h3 className="section-box-title">Beverage Portfolio</h3>
                  <button
                    type="button"
                    className="admin-link-btn"
                    onClick={() => setActiveTab('products')}
                  >
                    Manage Inventory →
                  </button>
                </div>
                <div className="admin-catalog-mini-list">
                  {products.slice(0, 5).map((p) => (
                    <div key={p.id} className="catalog-mini-row">
                      <img src={p.image} alt={p.name} className="catalog-mini-img" />
                      <div className="catalog-mini-info">
                        <h4 className="catalog-mini-name">{p.name}</h4>
                        <span className="catalog-mini-cat">{p.category} · {p.volume}</span>
                      </div>
                      <div className="catalog-mini-price">
                        ${p.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PRODUCTS & INVENTORY */}
        {activeTab === 'products' && (
          <div className="admin-tab-content animate-fade-in">
            <div className="admin-action-bar">
              <div className="admin-search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search products by title or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-pill-primary admin-primary-btn"
                onClick={() => setIsAddProductOpen(true)}
              >
                <Plus size={16} />
                <span>Add New Flavor</span>
              </button>
            </div>

            {/* Add Product Modal */}
            {isAddProductOpen && (
              <div className="modal-overlay animate-fade-in" onClick={() => setIsAddProductOpen(false)}>
                <div className="modal-panel admin-modal-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-modal-header">
                    <h3>Add New Drink Flavor</h3>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setIsAddProductOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleCreateProduct} className="admin-product-form">
                    <div className="form-row">
                      <div className="form-field">
                        <label>Flavor Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sparkling Yuzu Lime"
                          value={newProd.name}
                          onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label>Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="3.99"
                          value={newProd.price}
                          onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>Category</label>
                        <select
                          value={newProd.category}
                          onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                        >
                          <option value="100% Pure Juice">100% Pure Juice</option>
                          <option value="Sparkling Fruit">Sparkling Fruit</option>
                          <option value="Tropical & Exotic">Tropical & Exotic</option>
                          <option value="Hydration Boost">Hydration Boost</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label>Badge / Tag</label>
                        <input
                          type="text"
                          placeholder="e.g. New Release"
                          value={newProd.badge}
                          onChange={(e) => setNewProd({ ...newProd, badge: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>Calories</label>
                        <input
                          type="text"
                          placeholder="85 kcal"
                          value={newProd.calories}
                          onChange={(e) => setNewProd({ ...newProd, calories: e.target.value })}
                        />
                      </div>
                      <div className="form-field">
                        <label>Natural Sugar</label>
                        <input
                          type="text"
                          placeholder="11g"
                          value={newProd.sugar}
                          onChange={(e) => setNewProd({ ...newProd, sugar: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Flavor Description</label>
                      <textarea
                        rows="3"
                        placeholder="Crafted with organic ingredients..."
                        value={newProd.description}
                        onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                      />
                    </div>

                    <div className="admin-form-actions">
                      <button
                        type="button"
                        className="btn-pill-outline"
                        onClick={() => setIsAddProductOpen(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-pill-primary">
                        Save Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Product Modal */}
            {editingProduct && (
              <div className="modal-overlay animate-fade-in" onClick={() => setEditingProduct(null)}>
                <div className="modal-panel admin-modal-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-modal-header">
                    <h3>Edit {editingProduct.name}</h3>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setEditingProduct(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleSaveEditProduct} className="admin-product-form">
                    <div className="form-row">
                      <div className="form-field">
                        <label>Flavor Name</label>
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label>Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.price}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>Badge</label>
                        <input
                          type="text"
                          value={editingProduct.badge}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, badge: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-field">
                        <label>Volume</label>
                        <input
                          type="text"
                          value={editingProduct.volume}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, volume: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Description</label>
                      <textarea
                        rows="3"
                        value={editingProduct.description}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, description: e.target.value })
                        }
                      />
                    </div>

                    <div className="admin-form-actions">
                      <button
                        type="button"
                        className="btn-pill-outline"
                        onClick={() => setEditingProduct(null)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-pill-primary">
                        Update Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className="admin-section-box">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Drink Name</th>
                      <th>Category</th>
                      <th>Size</th>
                      <th>Price</th>
                      <th>Badge</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProductsList.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <img src={p.image} alt="" className="table-product-thumb" />
                        </td>
                        <td>
                          <div className="product-table-name-group">
                            <strong>{p.name}</strong>
                            <span className="product-table-sub">{p.subtitle}</span>
                          </div>
                        </td>
                        <td>{p.category}</td>
                        <td>{p.volume}</td>
                        <td><strong>${p.price.toFixed(2)}</strong></td>
                        <td>
                          <span className="admin-badge-tag">{p.badge}</span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="admin-action-icon-btn"
                              onClick={() => setEditingProduct(p)}
                              title="Edit product"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              className="admin-action-icon-btn delete"
                              onClick={() => {
                                if (window.confirm(`Delete ${p.name}?`)) {
                                  onDeleteProduct(p.id)
                                  setAdminNotification(`Deleted ${p.name}`)
                                  setTimeout(() => setAdminNotification(''), 3000)
                                }
                              }}
                              title="Delete product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="admin-tab-content animate-fade-in">
            {/* Filter pills */}
            <div className="admin-filter-strip">
              {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`admin-filter-pill ${orderFilter === st ? 'active' : ''}`}
                  onClick={() => setOrderFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="admin-section-box">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Placed Time</th>
                      <th>Customer</th>
                      <th>Items Included</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>#{order.id}</strong></td>
                        <td><span className="table-muted-time">{order.date}</span></td>
                        <td>
                          <div className="customer-cell">
                            <img src={order.customer.avatar} alt="" className="table-avatar" />
                            <div>
                              <div className="customer-name-bold">{order.customer.name}</div>
                              <span className="customer-email-muted">{order.customer.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="order-items-snippet">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="item-snippet-line">
                                {it.qty}x {it.name}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td><strong>${order.total.toFixed(2)}</strong></td>
                        <td><span className="payment-tag">{order.paymentMethod}</span></td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`admin-status-select select-${order.status.toLowerCase()}`}
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="admin-tab-content animate-fade-in">
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap kpi-purple">
                  <Users size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Active Customers</span>
                  <h3 className="kpi-val">1,420</h3>
                  <span className="kpi-trend positive">+38 this week</span>
                </div>
              </div>
              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap kpi-green">
                  <Sparkles size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">VIP Subscribers</span>
                  <h3 className="kpi-val">684</h3>
                  <span className="kpi-trend positive">Monthly recurring</span>
                </div>
              </div>
            </div>

            <div className="admin-section-box">
              <div className="section-box-header">
                <h3 className="section-box-title">Top Customer Profiles</h3>
              </div>
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Tier</th>
                      <th>Total Orders</th>
                      <th>Lifetime Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.customer.email}>
                        <td>
                          <div className="customer-cell">
                            <img src={o.customer.avatar} alt="" className="table-avatar" />
                            <strong>{o.customer.name}</strong>
                          </div>
                        </td>
                        <td>{o.customer.email}</td>
                        <td><span className="status-pill status-delivered">Gold Tier</span></td>
                        <td>{Math.floor(Math.random() * 5 + 3)} Orders</td>
                        <td><strong>${(o.total * 3.2).toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: SECURITY & SETTINGS */}
        {activeTab === 'settings' && (
          <div className="admin-tab-content animate-fade-in">
            <div className="admin-settings-card">
              <div className="settings-header">
                <Shield size={24} className="text-forest" />
                <div>
                  <h3>Admin Authentication & Security Policy</h3>
                  <p>Tightly secured authentication settings stored in persistent local storage.</p>
                </div>
              </div>

              <div className="security-rule-box">
                <h4>Configured Credentials Rule</h4>
                <div className="rule-row">
                  <span>Authorized Email:</span>
                  <code>admin@123</code>
                </div>
                <div className="rule-row">
                  <span>Master Password:</span>
                  <code>•••• (1212)</code>
                </div>
                <div className="rule-row">
                  <span>Session Expiry:</span>
                  <span>24 Hours (Encrypted Base64 Payload Token)</span>
                </div>
                <div className="rule-row">
                  <span>Role Authorization:</span>
                  <span className="role-badge">SUPER_ADMIN_OPERATIONS</span>
                </div>
              </div>

              <div className="settings-actions-group">
                <button
                  type="button"
                  className="btn-pill-outline"
                  onClick={() => {
                    localStorage.removeItem('juicera_admin_orders')
                    setOrders(getAdminOrders())
                    setAdminNotification('Reset orders back to default mock state!')
                    setTimeout(() => setAdminNotification(''), 3000)
                  }}
                >
                  <RefreshCw size={15} />
                  <span>Reset Demo Orders</span>
                </button>
                <button
                  type="button"
                  className="btn-pill-primary"
                  onClick={onLogout}
                >
                  <LogOut size={15} />
                  <span>Logout Administrator</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
