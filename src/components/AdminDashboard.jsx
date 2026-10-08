import React, { useState, useEffect } from 'react'
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
  Menu,
  X,
  Sun,
  Moon,
  ArrowLeft,
  Check,
  Image as ImageIcon,
  Flame,
  ChevronRight,
} from 'lucide-react'
import { getAdminOrders, updateOrderStatus } from '../data/adminData'
import esanLogo from '../assets/esan_foods_logo.png'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('juicera_admin_theme') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('juicera_admin_theme', theme)
    } catch {}
    const rootEl = document.querySelector('.app-admin-root')
    if (rootEl) {
      rootEl.classList.remove('admin-theme-dark', 'admin-theme-light')
      rootEl.classList.add(theme === 'dark' ? 'admin-theme-dark' : 'admin-theme-light')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Smart sticky header: visible on load & scroll-up; hides when scrolling deep down
  const [headerVisible, setHeaderVisible] = useState(true)

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY
          const diff = currentY - lastY

          if (currentY <= 40) {
            setHeaderVisible(true)
          } else if (diff < -4) {
            // Scrolled up even slightly -> quickly bring header back!
            setHeaderVisible(true)
          } else if (diff > 10 && currentY > 100) {
            // Scrolling down -> hide to maximize reading view
            setHeaderVisible(false)
          }

          lastY = currentY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [orders, setOrders] = useState(getAdminOrders())
  const [orderFilter, setOrderFilter] = useState('All')
  const [productSearch, setProductSearch] = useState('')
  const [editorMode, setEditorMode] = useState(null) // null | 'create' | 'edit'
  const [editorProduct, setEditorProduct] = useState(null)
  const [adminNotification, setAdminNotification] = useState('')

  // Overview metrics calculations
  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
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

  const handleOpenCreateProduct = () => {
    setEditorProduct({
      name: '',
      subtitle: 'Fresh Organic Blend',
      category: '100% Pure Juice',
      volume: '330ml',
      price: 3.99,
      originalPrice: '',
      badge: 'Organic',
      color: '#059669',
      image: '',
      galleryImages: [],
      galleryImagesText: '',
      videoUrl: '',
      calories: '90 kcal',
      sugar: '10g',
      carbs: '20g',
      description: '',
    })
    setEditorMode('create')
    setActiveTab('products')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenEditProduct = (p) => {
    const galleryArr = Array.isArray(p.galleryImages)
      ? p.galleryImages
      : (p.image ? [p.image] : [])
    setEditorProduct({
      ...p,
      price: p.price ?? 3.99,
      originalPrice: p.originalPrice ?? '',
      badge: p.badge || 'Organic',
      volume: p.volume || '330ml',
      color: p.color || '#059669',
      galleryImages: galleryArr,
      galleryImagesText: galleryArr.join('\n'),
      calories: p.nutrition?.calories || p.calories || '90 kcal',
      sugar: p.nutrition?.sugar || p.sugar || '10g',
      carbs: p.nutrition?.carbs || p.carbs || '20g',
      description: p.description || '',
    })
    setEditorMode('edit')
    setActiveTab('products')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEditor = () => {
    setEditorMode(null)
    setEditorProduct(null)
  }

  const handleSaveProduct = (e) => {
    if (e) e.preventDefault()
    if (!editorProduct || !editorProduct.name.trim()) {
      alert('Please enter a drink flavor name.')
      return
    }

    const galleryList = editorProduct.galleryImagesText
      ? editorProduct.galleryImagesText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      : (Array.isArray(editorProduct.galleryImages) && editorProduct.galleryImages.length > 0
          ? editorProduct.galleryImages
          : (editorProduct.image ? [editorProduct.image] : []))

    const finalImage = editorProduct.image || galleryList[0] || (products[0]?.image || '')

    if (editorMode === 'edit') {
      const updated = {
        ...editorProduct,
        price: parseFloat(editorProduct.price) || 0,
        originalPrice: editorProduct.originalPrice ? parseFloat(editorProduct.originalPrice) : undefined,
        image: finalImage,
        galleryImages: galleryList.length > 0 ? galleryList : [finalImage],
        nutrition: {
          ...(editorProduct.nutrition || {}),
          calories: editorProduct.calories || editorProduct.nutrition?.calories || '90 kcal',
          sugar: editorProduct.sugar || editorProduct.nutrition?.sugar || '10g',
          carbs: editorProduct.carbs || editorProduct.nutrition?.carbs || '20g',
        },
      }
      onUpdateProduct(updated)
      setAdminNotification(`Flavor "${updated.name}" updated successfully! ✨`)
    } else {
      const idSlug = editorProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('prod-' + Date.now())
      const created = {
        ...editorProduct,
        id: idSlug,
        price: parseFloat(editorProduct.price) || 3.99,
        originalPrice: editorProduct.originalPrice ? parseFloat(editorProduct.originalPrice) : undefined,
        rating: 5.0,
        reviewsCount: 1,
        image: finalImage,
        galleryImages: galleryList.length > 0 ? galleryList : [finalImage],
        bgSoft: '#f0fdf4',
        nutrition: {
          calories: editorProduct.calories || '90 kcal',
          sugar: editorProduct.sugar || '10g',
          carbs: editorProduct.carbs || '20g',
          vitaminC: '100% DV',
          organic: '100% Certified',
        },
        tastingNotes: ['Crisp', 'Refreshing'],
        ingredients: ['Organic Fruit Blend', 'Pure Filtered Water'],
      }
      onAddProduct(created)
      setAdminNotification(`New flavor "${created.name}" created and published! 🚀`)
    }

    setEditorMode(null)
    setEditorProduct(null)
    setTimeout(() => setAdminNotification(''), 3500)
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
    <div className={`admin-layout-root animate-fade-in ${theme === 'dark' ? 'admin-theme-dark' : 'admin-theme-light'}`}>
      {/* Mobile Smart Sticky Header (Visible on screens <= 1024px) */}
      <header className={`admin-mobile-header-wrapper ${headerVisible ? 'header-visible' : 'header-hidden'}`}>
        <div className="admin-mobile-header">
          {editorMode && activeTab === 'products' ? (
            <div className="admin-mobile-editor-nav-bar">
              <button
                type="button"
                className="admin-mobile-editor-back-btn"
                onClick={handleCancelEditor}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <span className="admin-mobile-editor-title">
                {editorMode === 'create' ? 'Add Flavor' : 'Edit Flavor'}
              </span>
              <button
                type="button"
                className="btn-pill-primary admin-mobile-editor-save-btn"
                onClick={handleSaveProduct}
              >
                <Check size={14} />
                <span>Save</span>
              </button>
            </div>
          ) : (
            <>
              <div className="admin-mobile-brand">
                <img src={esanLogo} alt="Esan Foods" className="admin-brand-icon-img" />
                <div className="admin-brand-titles">
                  <h2 className="admin-brand-name">Esan Foods Admin</h2>
                  <span className="admin-secure-tag">
                    <Shield size={11} /> Secured
                  </span>
                </div>
              </div>

              <div className="admin-mobile-header-actions">
                <button
                  type="button"
                  className="admin-mobile-theme-btn"
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle admin color theme"
                >
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                <button
                  type="button"
                  className="admin-mobile-store-btn"
                  onClick={onSwitchToStore}
                  title="View Public Store"
                >
                  <ExternalLink size={15} />
                  <span className="hide-on-mobile-xs">Store</span>
                </button>
                <button
                  type="button"
                  className="admin-mobile-menu-btn"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle admin navigation menu"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Horizontal Quick-Tabs Pill Bar (Pinned directly below brand bar) */}
        {!editorMode && (
          <div className="admin-mobile-quick-nav">
            <button
              type="button"
              className={`mobile-tab-pill ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('overview')
                setEditorMode(null)
              }}
            >
              <LayoutDashboard size={14} />
              <span>Overview</span>
            </button>
            <button
              type="button"
              className={`mobile-tab-pill ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('products')
                setEditorMode(null)
              }}
            >
              <Boxes size={14} />
              <span>Products ({products.length})</span>
            </button>
            <button
              type="button"
              className={`mobile-tab-pill ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('orders')
                setEditorMode(null)
              }}
            >
              <ShoppingBag size={14} />
              <span>Orders ({orders.length})</span>
            </button>
            <button
              type="button"
              className={`mobile-tab-pill ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('customers')
                setEditorMode(null)
              }}
            >
              <Users size={14} />
              <span>Customers</span>
            </button>
            <button
              type="button"
              className={`mobile-tab-pill ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('settings')
                setEditorMode(null)
              }}
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
          </div>
        )}
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-backdrop animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (Slide-out drawer on mobile, sticky bar on desktop) */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-drawer-open' : ''}`}>
        <div className="admin-sidebar-header">
          <img src={esanLogo} alt="Esan Foods" className="admin-brand-icon-img" />
          <div className="admin-brand-titles">
            <h2 className="admin-brand-name">Esan Foods Admin</h2>
            <span className="admin-secure-tag">
              <Shield size={11} /> Secured Console
            </span>
          </div>
          {/* Close button inside mobile drawer */}
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview')
              setEditorMode(null)
              setMobileMenuOpen(false)
            }}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('products')
              setEditorMode(null)
              setMobileMenuOpen(false)
            }}
          >
            <Boxes size={18} />
            <span>Products</span>
            <span className="admin-badge-count">{products.length}</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('orders')
              setEditorMode(null)
              setMobileMenuOpen(false)
            }}
          >
            <ShoppingBag size={18} />
            <span>Orders</span>
            <span className="admin-badge-count">{orders.length}</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('customers')
              setEditorMode(null)
              setMobileMenuOpen(false)
            }}
          >
            <Users size={18} />
            <span>Customers</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings')
              setEditorMode(null)
              setMobileMenuOpen(false)
            }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Admin Quick Switch & Logout */}
        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-theme-switch-row"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="admin-theme-switch-label">
              {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
              <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
            </div>
            <div className={`admin-theme-toggle-slider ${theme === 'dark' ? 'active' : ''}`}>
              <div className="admin-theme-toggle-knob" />
            </div>
          </button>

          <button
            type="button"
            className="admin-switch-store-btn"
            onClick={() => {
              onSwitchToStore()
              setMobileMenuOpen(false)
            }}
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
              <span className="admin-profile-email">{adminUser?.email || 'admin@esanfoods.com'}</span>
            </div>
            <button
              type="button"
              className="admin-logout-icon-btn"
              onClick={() => {
                onLogout()
                setMobileMenuOpen(false)
              }}
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
              {editorMode && activeTab === 'products'
                ? editorMode === 'create'
                  ? 'Add New Beverage Flavor'
                  : `Edit Flavor: ${editorProduct?.name || ''}`
                : (activeTab === 'overview' && 'Overview') ||
                  (activeTab === 'products' && 'Products') ||
                  (activeTab === 'orders' && 'Orders') ||
                  (activeTab === 'customers' && 'Customers') ||
                  (activeTab === 'settings' && 'Settings')}
            </h1>
            <p className="admin-page-sub">
              {editorMode && activeTab === 'products' ? (
                'Configure drink recipe, pricing, media assets, and nutrition details'
              ) : (
                <>
                  Logged in with verified administrator credentials: <strong>{adminUser?.email}</strong>
                </>
              )}
            </p>
          </div>

          <div className="admin-topbar-actions">
            {adminNotification && (
              <div className="admin-banner-alert animate-fade-in">
                <CheckCircle size={15} />
                <span>{adminNotification}</span>
              </div>
            )}
            {editorMode && activeTab === 'products' && (
              <div className="admin-topbar-editor-pills">
                <button
                  type="button"
                  className="admin-editor-topbar-cancel"
                  onClick={handleCancelEditor}
                >
                  <ArrowLeft size={14} />
                  <span>Back to List</span>
                </button>
                <button
                  type="button"
                  className="admin-editor-topbar-save"
                  onClick={handleSaveProduct}
                >
                  <Check size={14} />
                  <span>{editorMode === 'create' ? 'Publish Flavor' : 'Save Changes'}</span>
                </button>
              </div>
            )}
            <button
              type="button"
              className="admin-theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
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
                  <table className="admin-table admin-table-recent-orders">
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

              {/* Best Selling Products Portfolio Table */}
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
                <div className="admin-table-responsive">
                  <table className="admin-table admin-portfolio-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Drink Name</th>
                        <th>Category</th>
                        <th>Volume</th>
                        <th>Price</th>
                        <th>Badge</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 5).map((p) => (
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
                          <td><strong>${(Number(p.price) || 0).toFixed(2)}</strong></td>
                          <td>
                            <span className="admin-badge-tag">{p.badge}</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="admin-action-icon-btn"
                              onClick={() => handleOpenEditProduct(p)}
                              title="Edit product"
                            >
                              <Edit2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PRODUCTS & INVENTORY */}
        {activeTab === 'products' && (
          <div className="admin-tab-content animate-fade-in">
            {editorMode && editorProduct ? (
              /* Dedicated Full-Screen Product Editor UI */
              <div className="admin-editor-screen animate-fade-in">
                {/* Editor Top Navigation Bar */}
                <div className="admin-editor-nav-bar">
                  <div className="admin-editor-nav-left">
                    <button
                      type="button"
                      className="admin-editor-back-btn"
                      onClick={handleCancelEditor}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to All Flavors</span>
                    </button>
                    <div className="admin-editor-heading-wrap">
                      <div className="admin-editor-breadcrumbs">
                        <span>Products</span>
                        <ChevronRight size={13} />
                        <span className="current">
                          {editorMode === 'create' ? 'Create New Flavor' : (editorProduct.name || 'Edit Flavor')}
                        </span>
                      </div>
                      <h2 className="admin-editor-title">
                        {editorMode === 'create' ? 'Create New Beverage Flavor' : `Editing: ${editorProduct.name}`}
                      </h2>
                    </div>
                  </div>

                  <div className="admin-editor-nav-actions">
                    <button
                      type="button"
                      className="btn-pill-outline admin-editor-cancel-btn"
                      onClick={handleCancelEditor}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-pill-primary admin-editor-save-btn"
                      onClick={handleSaveProduct}
                    >
                      <Check size={16} />
                      <span>{editorMode === 'create' ? 'Publish Flavor' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>

                {/* 2-Column Responsive Editor Workspace */}
                <div className="admin-editor-workspace">
                  {/* Left Column: Form Cards */}
                  <div className="admin-editor-main-col">
                    {/* 1. Flavor Identity */}
                    <div className="admin-editor-card">
                      <div className="admin-editor-card-header">
                        <div className="admin-editor-card-icon">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h3>Flavor Identity & Branding</h3>
                          <p>Define product naming, category classification, and packaging badges</p>
                        </div>
                      </div>

                      <div className="admin-editor-card-body">
                        <div className="editor-form-row">
                          <div className="editor-form-field flex-2">
                            <label>Flavor Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. Sparkling Yuzu Lime"
                              value={editorProduct.name}
                              onChange={(e) =>
                                setEditorProduct({ ...editorProduct, name: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="editor-form-field flex-1">
                            <label>Category</label>
                            <select
                              value={editorProduct.category}
                              onChange={(e) =>
                                setEditorProduct({ ...editorProduct, category: e.target.value })
                              }
                            >
                              <option value="100% Pure Juice">100% Pure Juice</option>
                              <option value="Sparkling Fruit">Sparkling Fruit</option>
                              <option value="Tropical & Exotic">Tropical & Exotic</option>
                              <option value="Hydration Boost">Hydration Boost</option>
                            </select>
                          </div>
                        </div>

                        <div className="editor-form-row">
                          <div className="editor-form-field flex-2">
                            <label>Tagline / Subtitle</label>
                            <input
                              type="text"
                              placeholder="e.g. 100% Cold-Pressed Japanese Citrus"
                              value={editorProduct.subtitle}
                              onChange={(e) =>
                                setEditorProduct({ ...editorProduct, subtitle: e.target.value })
                              }
                            />
                          </div>
                          <div className="editor-form-field flex-1">
                            <label>Badge / Label</label>
                            <input
                              type="text"
                              placeholder="e.g. Organic, Best Seller, New"
                              value={editorProduct.badge}
                              onChange={(e) =>
                                setEditorProduct({ ...editorProduct, badge: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="editor-form-row">
                          <div className="editor-form-field flex-1">
                            <label>Volume / Size</label>
                            <input
                              type="text"
                              placeholder="e.g. 330ml"
                              value={editorProduct.volume}
                              onChange={(e) =>
                                setEditorProduct({ ...editorProduct, volume: e.target.value })
                              }
                            />
                          </div>

                          <div className="editor-form-field flex-2">
                            <label>Accent Brand Color</label>
                            <div className="editor-color-picker-group">
                              <input
                                type="color"
                                className="editor-color-input"
                                value={editorProduct.color || '#059669'}
                                onChange={(e) =>
                                  setEditorProduct({ ...editorProduct, color: e.target.value })
                                }
                              />
                              <div className="editor-color-presets">
                                {[
                                  { label: 'Emerald', hex: '#059669' },
                                  { label: 'Orange', hex: '#f97316' },
                                  { label: 'Golden', hex: '#eab308' },
                                  { label: 'Ruby', hex: '#e11d48' },
                                  { label: 'Aqua', hex: '#06b6d4' },
                                  { label: 'Purple', hex: '#8b5cf6' },
                                ].map((preset) => (
                                  <button
                                    key={preset.hex}
                                    type="button"
                                    className={`color-preset-swatch ${
                                      editorProduct.color === preset.hex ? 'active' : ''
                                    }`}
                                    style={{ background: preset.hex }}
                                    onClick={() =>
                                      setEditorProduct({ ...editorProduct, color: preset.hex })
                                    }
                                    title={preset.label}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Pricing & Financials */}
                    <div className="admin-editor-card">
                      <div className="admin-editor-card-header">
                        <div className="admin-editor-card-icon">
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <h3>Pricing & Promotional Strategy</h3>
                          <p>Set active customer price and optional compare-at original price</p>
                        </div>
                      </div>

                      <div className="admin-editor-card-body">
                        <div className="editor-form-row">
                          <div className="editor-form-field">
                            <label>Selling Price ($) *</label>
                            <div className="editor-input-addon">
                              <span className="addon-symbol">$</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="3.99"
                                value={editorProduct.price}
                                onChange={(e) =>
                                  setEditorProduct({ ...editorProduct, price: e.target.value })
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="editor-form-field">
                            <label>Compare At / Strikethrough Price ($)</label>
                            <div className="editor-input-addon">
                              <span className="addon-symbol">$</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="4.99"
                                value={editorProduct.originalPrice || ''}
                                onChange={(e) =>
                                  setEditorProduct({
                                    ...editorProduct,
                                    originalPrice: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {parseFloat(editorProduct.originalPrice) > parseFloat(editorProduct.price) && (
                          <div className="editor-discount-banner">
                            <CheckCircle size={15} />
                            <span>
                              Promotional Savings Active: Displays a{' '}
                              <strong>
                                {Math.round(
                                  ((parseFloat(editorProduct.originalPrice) -
                                    parseFloat(editorProduct.price)) /
                                    parseFloat(editorProduct.originalPrice)) *
                                    100
                                )}
                                % OFF
                              </strong>{' '}
                              discount badge across storefront.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Media Assets */}
                    <div className="admin-editor-card">
                      <div className="admin-editor-card-header">
                        <div className="admin-editor-card-icon">
                          <ImageIcon size={18} />
                        </div>
                        <div>
                          <h3>Media Assets & Video</h3>
                          <p>Provide direct image URLs for bottle rendering and high-res gallery</p>
                        </div>
                      </div>

                      <div className="admin-editor-card-body">
                        <div className="editor-form-field">
                          <label>Main Bottle / Cover Image URL</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={editorProduct.image || ''}
                            onChange={(e) =>
                              setEditorProduct({ ...editorProduct, image: e.target.value })
                            }
                          />
                          {editorProduct.image && (
                            <div className="editor-image-preview-strip">
                              <img
                                src={editorProduct.image}
                                alt="Main Cover Preview"
                                className="editor-thumb-img"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                              <div className="editor-preview-label">
                                <CheckCircle size={13} /> Cover Image loaded and verified
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="editor-form-field">
                          <label>Reel / Product Video URL (.mp4 optional)</label>
                          <input
                            type="url"
                            placeholder="https://.../video.mp4"
                            value={editorProduct.videoUrl || ''}
                            onChange={(e) =>
                              setEditorProduct({ ...editorProduct, videoUrl: e.target.value })
                            }
                          />
                          {editorProduct.videoUrl && (
                            <div className="editor-video-preview-wrap">
                              <video
                                src={editorProduct.videoUrl}
                                controls
                                muted
                                className="editor-preview-video"
                              />
                            </div>
                          )}
                        </div>

                        <div className="editor-form-field">
                          <label>Gallery Image URLs (one URL per line or separated by commas)</label>
                          <textarea
                            rows="3"
                            placeholder="https://...pic1.jpg&#10;https://...pic2.jpg"
                            value={editorProduct.galleryImagesText || ''}
                            onChange={(e) =>
                              setEditorProduct({
                                ...editorProduct,
                                galleryImagesText: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Nutrition & Story */}
                    <div className="admin-editor-card">
                      <div className="admin-editor-card-header">
                        <div className="admin-editor-card-icon">
                          <Flame size={18} />
                        </div>
                        <div>
                          <h3>Nutrition Profile & Tasting Story</h3>
                          <p>Caloric content, natural fruit sugars, carbs, and taste notes</p>
                        </div>
                      </div>

                      <div className="admin-editor-card-body">
                        <div className="editor-form-row">
                          <div className="editor-form-field">
                            <label>Calories</label>
                            <input
                              type="text"
                              placeholder="e.g. 85 kcal"
                              value={editorProduct.calories || ''}
                              onChange={(e) =>
                                setEditorProduct({ ...editorProduct, calories: e.target.value })
                              }
                            />
                          </div>
                          <div className="editor-form-field">
                            <label>Natural Fruit Sugar</label>
                            <input
                              type="text"
                              placeholder="e.g. 10g"
                              value={editorProduct.sugar || ''}
                              onChange={(e) =>
                                setEditorProduct({ ...editorProduct, sugar: e.target.value })
                              }
                            />
                          </div>
                          <div className="editor-form-field">
                            <label>Carbohydrates</label>
                            <input
                              type="text"
                              placeholder="e.g. 20g"
                              value={editorProduct.carbs || ''}
                              onChange={(e) =>
                                setEditorProduct({ ...editorProduct, carbs: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="editor-form-field">
                          <label>Flavor Story & Tasting Notes</label>
                          <textarea
                            rows="4"
                            placeholder="Crafted with organic, sun-ripened ingredients to deliver an invigorating burst of natural refreshment..."
                            value={editorProduct.description || ''}
                            onChange={(e) =>
                              setEditorProduct({
                                ...editorProduct,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Storefront Card Preview & Fast Actions */}
                  <div className="admin-editor-side-col">
                    <div className="editor-preview-card">
                      <div className="editor-preview-badge-header">
                        <span className="live-pill">
                          <span className="pulse-dot" /> LIVE STOREFRONT CARD PREVIEW
                        </span>
                      </div>

                      {/* Visualized bottle card */}
                      <div
                        className="store-card-mockup"
                        style={{ borderColor: editorProduct.color || '#059669' }}
                      >
                        <div
                          className="mockup-header-bg"
                          style={{
                            background: `linear-gradient(135deg, ${editorProduct.color || '#059669'}18, ${editorProduct.color || '#059669'}35)`,
                          }}
                        >
                          <span
                            className="mockup-badge"
                            style={{
                              backgroundColor: editorProduct.color || '#059669',
                            }}
                          >
                            {editorProduct.badge || 'Organic'}
                          </span>
                          <img
                            src={
                              editorProduct.image ||
                              'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80'
                            }
                            alt=""
                            className="mockup-bottle-img"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80'
                            }}
                          />
                        </div>

                        <div className="mockup-body">
                          <div className="mockup-meta">
                            <span className="mockup-category">{editorProduct.category || '100% Pure Juice'}</span>
                            <span className="mockup-volume">{editorProduct.volume || '330ml'}</span>
                          </div>

                          <h4 className="mockup-name">{editorProduct.name || 'Flavor Name Preview'}</h4>
                          <p className="mockup-sub">{editorProduct.subtitle || 'Fresh Organic Blend'}</p>

                          <div className="mockup-nutrition-strip">
                            <span>🔥 {editorProduct.calories || '90 kcal'}</span>
                            <span>🍬 {editorProduct.sugar || '10g'} sugar</span>
                          </div>

                          <div className="mockup-price-row">
                            <div className="mockup-prices">
                              <span className="mockup-price">
                                ${parseFloat(editorProduct.price || 3.99).toFixed(2)}
                              </span>
                              {editorProduct.originalPrice && (
                                <span className="mockup-original-price">
                                  ${parseFloat(editorProduct.originalPrice).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="mockup-add-btn"
                              style={{ backgroundColor: editorProduct.color || '#059669' }}
                            >
                              Add to Bag
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Side Publishing Box */}
                      <div className="editor-status-box">
                        <div className="status-row">
                          <span>Status</span>
                          <span className="status-badge-active">Ready to Publish</span>
                        </div>
                        <div className="status-row">
                          <span>Visibility</span>
                          <span className="status-val">Public Store Catalog</span>
                        </div>
                        <div className="status-row">
                          <span>Action Type</span>
                          <span className="status-val">
                            {editorMode === 'create' ? 'New Flavor Creation' : 'Direct DB Update'}
                          </span>
                        </div>

                        <div className="editor-side-actions">
                          <button
                            type="button"
                            className="btn-pill-primary editor-full-btn"
                            onClick={handleSaveProduct}
                          >
                            <Check size={16} />
                            <span>{editorMode === 'create' ? 'Publish Flavor' : 'Save Changes'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn-pill-outline editor-full-btn"
                            onClick={handleCancelEditor}
                          >
                            Discard & Return
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Floating / Sticky Bottom Bar */}
                <div className="admin-editor-mobile-bar">
                  <button
                    type="button"
                    className="btn-pill-outline mobile-bar-cancel"
                    onClick={handleCancelEditor}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-pill-primary mobile-bar-save"
                    onClick={handleSaveProduct}
                  >
                    <Check size={16} />
                    <span>{editorMode === 'create' ? 'Publish Flavor' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Products Table View */
              <>
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
                    onClick={handleOpenCreateProduct}
                  >
                    <Plus size={16} />
                    <span>Add New Flavor</span>
                  </button>
                </div>

                {/* Products Table */}
                <div className="admin-section-box">
                  <div className="admin-table-responsive">
                    <table className="admin-table admin-table-full-products">
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
                            <td><strong>${(Number(p.price) || 0).toFixed(2)}</strong></td>
                            <td>
                              <span className="admin-badge-tag">{p.badge}</span>
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                <button
                                  type="button"
                                  className="admin-action-icon-btn"
                                  onClick={() => handleOpenEditProduct(p)}
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
              </>
            )}
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
                <table className="admin-table admin-table-full-orders">
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
                <h4>Security & Role Authorization</h4>
                <div className="rule-row">
                  <span>Authentication Method:</span>
                  <code>Supabase Passwordless Email OTP</code>
                </div>
                <div className="rule-row">
                  <span>Access Control:</span>
                  <span>Automatic redirect based on <code>role = 'admin'</code> in profiles</span>
                </div>
                <div className="rule-row">
                  <span>Current Active Admin:</span>
                  <code>{adminUser?.email || 'Authenticated Administrator'}</code>
                </div>
                <div className="rule-row">
                  <span>Role Authorization:</span>
                  <span className="role-badge">ADMINISTRATOR</span>
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
