import React, { useState, useEffect } from 'react'
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'
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
import ProductDetailScreen from './components/ProductDetailScreen'
import AuthModal from './components/AuthModal'
import CheckoutModal from './components/CheckoutModal'
import AdminDashboard from './components/AdminDashboard'
import Toast from './components/Toast'

import { PRODUCTS as INITIAL_PRODUCTS } from './data/mockData'
import {
  verifyCurrentSupabaseSession,
  clearSession,
  formatUserFromSupabase,
  syncUserProfile,
} from './data/authService'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './data/productService'
import {
  fetchSiteContent,
  saveSiteContent,
  DEFAULT_SITE_CONTENT,
} from './data/siteContentService'
import AdminInlineBar from './components/AdminInlineBar'
import { supabase } from './lib/supabase'
import { addAdminOrder } from './data/adminData'
import './App.css'

export default function App() {
  // Session state (strictly verified via Supabase)
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdminView, setIsAdminView] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)

  // Products loaded directly from Supabase Database
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
  const [isProductsLoading, setIsProductsLoading] = useState(true)

  // Site Content (Hero, Masterpiece, Testimonials, FAQs, Why You'll Love)
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT)
  const [savedSiteContent, setSavedSiteContent] = useState(DEFAULT_SITE_CONTENT)
  const [adminEditorMode, setAdminEditorMode] = useState('edit') // 'edit' | 'preview'
  const [isSavingContent, setIsSavingContent] = useState(false)

  const isEditMode = currentUser?.role === 'admin' && adminEditorMode === 'edit' && !isAdminView
  const hasContentChanges = JSON.stringify(siteContent) !== JSON.stringify(savedSiteContent)

  // 1. Fetch live products and site content from Supabase
  useEffect(() => {
    let isMounted = true

    async function loadDatabaseData() {
      try {
        const [liveProducts, liveContent] = await Promise.all([
          fetchProducts(),
          fetchSiteContent(),
        ])
        if (isMounted && liveProducts && liveProducts.length > 0) {
          setProducts(liveProducts)
        }
        if (isMounted && liveContent) {
          setSiteContent(liveContent)
          setSavedSiteContent(liveContent)
        }
      } catch (err) {
        console.error('Failed to load database data:', err)
      } finally {
        if (isMounted) setIsProductsLoading(false)
      }
    }

    loadDatabaseData()

    // Real-time synchronization for products
    const productsChannel = supabase
      .channel('public:products:changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async () => {
          const fresh = await fetchProducts()
          if (isMounted && fresh && fresh.length > 0) {
            setProducts(fresh)
          }
        }
      )
      .subscribe()

    // Real-time synchronization for site_content
    const contentChannel = supabase
      .channel('public:site_content:changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_content' },
        async () => {
          const freshContent = await fetchSiteContent()
          if (isMounted && freshContent) {
            setSiteContent(freshContent)
            setSavedSiteContent(freshContent)
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(productsChannel)
      supabase.removeChannel(contentChannel)
    }
  }, [])

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

  const navigate = useNavigate()

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
  useEffect(() => {
    let isMounted = true

    async function initSupabaseAuth() {
      try {
        const auth = await verifyCurrentSupabaseSession()
        if (!isMounted) return
        if (!auth) {
          setCurrentUser(null)
          setIsAdminView(false)
        } else {
          setCurrentUser(auth.user)
          setIsAdminView(auth.isAdmin)
        }
      } catch (err) {
        if (isMounted) {
          setCurrentUser(null)
          setIsAdminView(false)
        }
      } finally {
        if (isMounted) {
          setAuthInitialized(true)
        }
      }
    }

    initSupabaseAuth()

    // Real-time Supabase auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT' || !session) {
        // Do NOT call clearSession() / signOut() here to avoid recursive infinite loop!
        setCurrentUser(null)
        setIsAdminView(false)
      } else if (session?.user) {
        const appUser = await syncUserProfile(session.user)
        if (!isMounted) return
        setCurrentUser(appUser)
        setIsAdminView(appUser?.role === 'admin')
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  // Auth Handlers
  const handleAuthSuccess = (userObj, isAdmin) => {
    setCurrentUser(userObj)
    const isUserAdmin = Boolean(isAdmin || userObj?.role === 'admin')
    if (isUserAdmin) {
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

  // Admin Product Management (Direct Supabase CRUD)
  const handleUpdateProduct = async (updatedProd) => {
    try {
      // Optimistically update local view
      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProd.id ? { ...p, ...updatedProd } : p))
      )
      const saved = await updateProduct(updatedProd.id, updatedProd)
      setProducts((prev) =>
        prev.map((p) => (p.id === saved.id ? saved : p))
      )
      showToast('Catalog Updated ✨', `${saved.name} saved to Supabase!`)
    } catch (err) {
      console.error('Failed to update product:', err)
      showToast('Update Failed', err.message || 'Could not save changes to database.')
      // Revert from DB
      const fresh = await fetchProducts()
      setProducts(fresh)
    }
  }

  const handleAddProduct = async (newProd) => {
    try {
      const saved = await createProduct(newProd)
      setProducts((prev) => [saved, ...prev])
      showToast('New Flavor Launched 🚀', `${saved.name} saved in database!`)
    } catch (err) {
      console.error('Failed to add product:', err)
      showToast('Creation Failed', err.message || 'Could not create product in database.')
    }
  }

  const handleDeleteProduct = async (productId) => {
    const item = products.find((p) => p.id === productId)
    try {
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      await deleteProduct(productId)
      showToast('Product Removed 🗑️', `${item?.name || 'Drink'} deleted from database.`)
    } catch (err) {
      console.error('Failed to delete product:', err)
      showToast('Delete Failed', err.message || 'Could not delete product.')
      const fresh = await fetchProducts()
      setProducts(fresh)
    }
  }

  // Site Content Handlers (Inline CMS)
  const handleSaveSiteContent = async () => {
    setIsSavingContent(true)
    try {
      const saved = await saveSiteContent(siteContent)
      setSiteContent(saved)
      setSavedSiteContent(saved)
      showToast('Live Changes Saved! 🚀', 'Updated storefront content in database.')
    } catch (err) {
      console.error('Failed to save site content:', err)
      showToast('Save Failed', err.message || 'Could not update content in database.')
    } finally {
      setIsSavingContent(false)
    }
  }

  const handleDiscardSiteContent = () => {
    setSiteContent(savedSiteContent)
    showToast('Changes Discarded', 'Restored back to current database version.')
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
            navigate('/#collections')
            setSelectedCategory('All Flavors')
            setTimeout(() => {
              document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }}
          onGoHome={() => navigate('/')}
        />

        {/* Client-side Route Endpoints */}
        <Routes>
          {/* Main Storefront Root Endpoint (/) */}
          <Route
            path="/"
            element={
              <>
                {/* Hero Section */}
                <Hero
                  heroContent={siteContent.hero}
                  isEditMode={isEditMode}
                  onUpdateHero={(h) => setSiteContent((prev) => ({ ...prev, hero: h }))}
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
                  onOpenDetail={(prod) => navigate(`/product/${prod.id}`)}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />

                {/* Featured Spotlight: Masterpiece Drink Showcase */}
                <SpotlightSection
                  products={products}
                  featuredProductId={siteContent.featuredProductId}
                  onUpdateFeaturedProductId={(id) =>
                    setSiteContent((prev) => ({ ...prev, featuredProductId: id }))
                  }
                  isEditMode={isEditMode}
                  onAddToCart={handleAddToCart}
                  onQuickView={(prod) => setQuickViewProduct(prod)}
                  onOpenDetail={(prod) => navigate(`/product/${prod.id}`)}
                />

                {/* What Our Customers Say */}
                <CustomerReviewsSection
                  testimonials={siteContent.testimonials}
                  isEditMode={isEditMode}
                  onUpdateTestimonials={(t) =>
                    setSiteContent((prev) => ({ ...prev, testimonials: t }))
                  }
                />

                {/* Why You'll Love This Drink */}
                <WhyYouLoveSection
                  benefits={siteContent.whyLove}
                  isEditMode={isEditMode}
                  onUpdateBenefits={(b) =>
                    setSiteContent((prev) => ({ ...prev, whyLove: b }))
                  }
                />

                {/* Bottom CTA Banner */}
                <CtaBanner
                  onOrderNow={() => {
                    document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                />

                {/* FAQ Accordion */}
                <FaqSection
                  faqs={siteContent.faqs}
                  isEditMode={isEditMode}
                  onUpdateFaqs={(f) =>
                    setSiteContent((prev) => ({ ...prev, faqs: f }))
                  }
                />
              </>
            }
          />

          {/* Dedicated Product Detail Route Endpoint (/product/:productId) */}
          <Route
            path="/product/:productId"
            element={
              <ProductDetailScreen
                allProducts={products}
                onBack={() => navigate('/#collections')}
                onAddToCart={handleAddToCart}
                onQuickView={(prod) => setQuickViewProduct(prod)}
                onSelectProduct={(prod) => navigate(`/product/${prod.id}`)}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />

          {/* Alternate plural endpoint (/products/:productId) */}
          <Route
            path="/products/:productId"
            element={
              <ProductDetailScreen
                allProducts={products}
                onBack={() => navigate('/#collections')}
                onAddToCart={handleAddToCart}
                onQuickView={(prod) => setQuickViewProduct(prod)}
                onSelectProduct={(prod) => navigate(`/product/${prod.id}`)}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Footer */}
        <Footer
          onSubscribeSuccess={(email) => {
            showToast('Subscribed! 🌿', `Welcome email sent to ${email} with code FRESH15!`)
          }}
        />
      </main>

      {/* Floating Inline Admin Toolbar for live in-place website editing */}
      {currentUser?.role === 'admin' && !isAdminView && (
        <AdminInlineBar
          isEditMode={adminEditorMode === 'edit'}
          onToggleMode={() =>
            setAdminEditorMode((prev) => (prev === 'edit' ? 'preview' : 'edit'))
          }
          hasChanges={hasContentChanges}
          onSave={handleSaveSiteContent}
          onDiscard={handleDiscardSiteContent}
          isSaving={isSavingContent}
        />
      )}

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
        onOpenDetail={(prod) => {
          setQuickViewProduct(null)
          navigate(`/product/${prod.id}`)
        }}
      />

      {/* Authentication / Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onOpenAdminDashboard={() => setIsAdminView(true)}
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
