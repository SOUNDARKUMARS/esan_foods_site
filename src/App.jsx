import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import CollectionsSection from './components/CollectionsSection'
import SpotlightSection from './components/SpotlightSection'
import CustomerReviewsSection from './components/CustomerReviewsSection'
import WhyYouLoveSection from './components/WhyYouLoveSection'
import CtaBanner from './components/CtaBanner'
import FaqSection from './components/FaqSection'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ProductModal from './components/ProductModal'
import AuthModal from './components/AuthModal'
import CheckoutModal from './components/CheckoutModal'
import AdminDashboard from './components/AdminDashboard'
import Toast from './components/Toast'

import { PRODUCTS as INITIAL_PRODUCTS } from './data/mockData'
import {
  verifyCurrentSupabaseSession,
  clearSession,
  formatUserFromSupabase,
} from './data/authService'
import { supabase } from './lib/supabase'
import { addAdminOrder } from './data/adminData'
import './App.css'

export default function App() {
  // Session state (strictly verified via Supabase)
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdminView, setIsAdminView] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)

  // Dynamic products list stored locally so admin edits reflect on storefront!
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('juicera_products_list')
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS
    } catch (e) {
      return INITIAL_PRODUCTS
    }
  })

  // Save product changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('juicera_products_list', JSON.stringify(products))
    } catch (e) {
      console.error(e)
    }
  }, [products])

  // Products & Filtering for Storefront
  const [selectedCategory, setSelectedCategory] = useState('All Flavors')
  const [searchQuery, setSearchQuery] = useState('')

  // Cart State (pre-populated)
  const [cartItems, setCartItems] = useState([
    {
      product: INITIAL_PRODUCTS[0], // Guava
      quantity: 1,
    },
    {
      product: INITIAL_PRODUCTS[3], // Passion
      quantity: 1,
    },
  ])

  // Wishlist State
  const [wishlist, setWishlist] = useState(['guava-juice'])

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  // Discount / Coupons
  const [discountCode, setDiscountCode] = useState('FRESH15')
  const [discountPercent, setDiscountPercent] = useState(15)

  // Toast Notification
  const [toast, setToast] = useState(null)

  const showToast = (title, message = '') => {
    setToast({ title, message })
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // 1. Strictly verify session against Supabase on load
  // If no session found from Supabase, it logs the user out and clears state!
  useEffect(() => {
    async function initSupabaseAuth() {
      const auth = await verifyCurrentSupabaseSession()
      if (!auth) {
        // No session found from Supabase -> logged out
        setCurrentUser(null)
        setIsAdminView(false)
      } else {
        // Valid active session confirmed by Supabase
        setCurrentUser(auth.user)
        setIsAdminView(auth.isAdmin)
      }
      setAuthInitialized(true)
    }

    initSupabaseAuth()

    // Real-time Supabase auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === 'SIGNED_OUT') {
        clearSession()
        setCurrentUser(null)
        setIsAdminView(false)
      } else {
        const appUser = formatUserFromSupabase(session.user)
        setCurrentUser(appUser)
        setIsAdminView(appUser.role === 'admin')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Auth Handlers
  const handleAuthSuccess = (userObj, isAdmin) => {
    setCurrentUser(userObj)
    if (isAdmin) {
      setIsAdminView(true)
      showToast('Admin Console Unlocked 🛡️', 'Welcome, Administrator.')
    } else {
      setIsAdminView(false)
      showToast(`Welcome, ${userObj.name}!`, 'You are now signed in.')
    }
  }

  const handleLogout = async () => {
    await clearSession()
    setCurrentUser(null)
    setIsAdminView(false)
    showToast('Signed Out', 'Your session has ended securely.')
  }

  // Admin Product Management
  const handleUpdateProduct = (updatedProd) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    )
    showToast('Catalog Updated', `${updatedProd.name} changes applied live!`)
  }

  const handleAddProduct = (newProd) => {
    setProducts((prev) => [newProd, ...prev])
    showToast('New Flavor Launched', `${newProd.name} added to catalog!`)
  }

  const handleDeleteProduct = (productId) => {
    const item = products.find((p) => p.id === productId)
    setProducts((prev) => prev.filter((p) => p.id !== productId))
    showToast('Product Removed', `${item?.name || 'Drink'} removed from catalog.`)
  }

  // Cart Handlers
  const handleAddToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [...prev, { product, quantity }]
      }
    })
    showToast(`Added to Box!`, `${quantity}x ${product.name} ready for checkout.`)
  }

  const handleUpdateCartQty = (productId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    })
  }

  const handleRemoveCartItem = (productId) => {
    const item = cartItems.find((i) => i.product.id === productId)
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId))
    if (item) {
      showToast('Item Removed', `${item.product.name} removed from your box.`)
    }
  }

  const handleApplyDiscount = (code, percent) => {
    setDiscountCode(code)
    setDiscountPercent(percent)
    showToast('Promo Code Applied!', `${code} gave you ${percent}% discount!`)
  }

  // Wishlist Handlers
  const handleToggleWishlist = (productId) => {
    const prod = products.find((p) => p.id === productId)
    if (wishlist.includes(productId)) {
      setWishlist((prev) => prev.filter((id) => id !== productId))
      showToast('Removed from Favorites', `${prod ? prod.name : 'Drink'} removed.`)
    } else {
      setWishlist((prev) => [...prev, productId])
      showToast('Saved to Favorites! ❤️', `${prod ? prod.name : 'Drink'} added to your wishlist.`)
    }
  }

  // Filter products by category and search
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All Flavors' || product.category === selectedCategory
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.subtitle.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.ingredients?.some((ing) => ing.toLowerCase().includes(query))
    return matchesCategory && matchesSearch
  })

  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  // If user is currently in Admin Dashboard view
  if (isAdminView && currentUser?.role === 'admin') {
    return (
      <div className="app-admin-root">
        <AdminDashboard
          adminUser={currentUser}
          onLogout={handleLogout}
          onSwitchToStore={() => setIsAdminView(false)}
          products={products}
          onUpdateProduct={handleUpdateProduct}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    )
  }

  return (
    <div className="app-root-wrapper">
      <main className="app-canvas-sheet">
        {/* Header & Navigation */}
        <Navbar
          cartCount={cartTotalCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenAdminDashboard={() => setIsAdminView(true)}
          user={currentUser}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          wishlistCount={wishlist.length}
          onOpenWishlist={() => {
            setSelectedCategory('All Flavors')
            document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
          }}
        />

        {/* Hero Section */}
        <Hero
          onShopClick={() => {
            document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
          }}
          onExploreClick={() => {
            document.getElementById('spotlight')?.scrollIntoView({ behavior: 'smooth' })
          }}
        />

        {/* Discover Our Collections Grid */}
        <CollectionsSection
          products={filteredProducts}
          onAddToCart={handleAddToCart}
          onQuickView={(prod) => setQuickViewProduct(prod)}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Featured Spotlight: Tinned Passion Juice */}
        <SpotlightSection
          onAddToCart={handleAddToCart}
          onQuickView={(prod) => setQuickViewProduct(prod)}
        />

        {/* What Our Customers Say */}
        <CustomerReviewsSection />

        {/* Why You'll Love This Drink */}
        <WhyYouLoveSection />

        {/* Bottom CTA Banner */}
        <CtaBanner
          onOrderNow={() => {
            document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
          }}
        />

        {/* FAQ Accordion */}
        <FaqSection />

        {/* Footer */}
        <Footer
          onSubscribeSuccess={(email) => {
            showToast('Subscribed! 🌿', `Welcome email sent to ${email} with code FRESH15!`)
          }}
        />
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        discountCode={discountCode}
        discountPercent={discountPercent}
        onApplyDiscount={handleApplyDiscount}
        onCheckout={() => {
          setIsCartOpen(false)
          setIsCheckoutOpen(true)
        }}
      />

      {/* Quick View Product Modal */}
      <ProductModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Authentication / Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        discountPercent={discountPercent}
        onOrderSuccess={() => {
          // Push new order to admin orders in local storage
          const newOrder = {
            id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            customer: {
              name: currentUser?.name || 'Guest Shopper',
              email: currentUser?.email || 'guest@juicera.com',
              avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
            },
            items: cartItems.map((ci) => ({
              name: ci.product.name,
              qty: ci.quantity,
              price: ci.product.price,
            })),
            total: cartItems.reduce((acc, ci) => acc + ci.product.price * ci.quantity, 0),
            status: 'Processing',
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            paymentMethod: 'Credit Card (••4242)',
            shippingAddress: 'Express Carbon-Neutral Delivery',
          }
          addAdminOrder(newOrder)
          setCartItems([])
          showToast('Order Placed Successfully! 🎉', 'Scheduled for express delivery.')
        }}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
