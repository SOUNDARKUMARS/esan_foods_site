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
  findSingleItemOption,
} from './data/productService'
import {
  fetchSiteContent,
  saveSiteContent,
  DEFAULT_SITE_CONTENT,
  getInitialSiteContent,
} from './data/siteContentService'
import AdminInlineBar from './components/AdminInlineBar'
import { supabase } from './lib/supabase'
import { createOrder } from './data/orderService'
import './App.css'

export default function App() {
  // Session state (strictly verified via Supabase)
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdminView, setIsAdminView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get('admin') === 'true' || window.location.hash === '#admin'
    } catch {
      return false
    }
  })
  const [authInitialized, setAuthInitialized] = useState(false)

  // Products loaded directly from Supabase Database
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
  const [isProductsLoading, setIsProductsLoading] = useState(true)

  // Site Content (Hero, Masterpiece, Testimonials, FAQs, Why You'll Love)
  // Initialized synchronously from local cache so there is zero initial layout shift or text flicker
  const [siteContent, setSiteContent] = useState(getInitialSiteContent)
  const [savedSiteContent, setSavedSiteContent] = useState(getInitialSiteContent)
  const [adminEditorMode, setAdminEditorMode] = useState('edit') // 'edit' | 'preview'
  const [isSavingContent, setIsSavingContent] = useState(false)

  const isEditMode = currentUser?.role === 'admin' && adminEditorMode === 'edit' && !isAdminView
  const hasContentChanges = JSON.stringify(siteContent) !== JSON.stringify(savedSiteContent)

  // Helper to smoothly apply live database content only when there are actual changes
  const applyLiveContent = (freshContent) => {
    if (!freshContent) return
    setSiteContent((current) => {
      const hasDifferences = JSON.stringify(current) !== JSON.stringify(freshContent)
      if (!hasDifferences) {
        return current
      }
      setSavedSiteContent(freshContent)
      return freshContent
    })
  }

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
          applyLiveContent(liveContent)
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

    // Real-time synchronization for site_content and categories (covers both dedicated and dual-store CMS)
    const contentChannel = supabase
      .channel('public:site_content:changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_content' },
        async () => {
          const freshContent = await fetchSiteContent()
          if (isMounted && freshContent) {
            applyLiveContent(freshContent)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        async (payload) => {
          // If CMS config row was updated, synchronize storefront immediately
          if (payload?.new?.id === '__esan_cms_site_content__' || payload?.old?.id === '__esan_cms_site_content__') {
            const freshContent = await fetchSiteContent()
            if (isMounted && freshContent) {
              applyLiveContent(freshContent)
            }
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
  const [selectedCategory, setSelectedCategory] = useState('All Products')
  const [searchQuery, setSearchQuery] = useState('')

  // Cart State (loaded from localStorage, empty [] by default)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('esan_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('esan_cart', JSON.stringify(cartItems))
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e)
    }
  }, [cartItems])

  // Wishlist State (persisted in localStorage, empty [] by default)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('esan_wishlist')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('esan_wishlist', JSON.stringify(wishlist))
    } catch {}
  }, [wishlist])

  const navigate = useNavigate()

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  // Discount / Coupons (starts empty, user applies promo in drawer)
  const [discountCode, setDiscountCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)

  // Language state (default 'en', persisted in localStorage)
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('esan_lang') || 'en'
    } catch {
      return 'en'
    }
  })

  const handleToggleLang = (newLang) => {
    const next = newLang || (lang === 'en' ? 'ta' : 'en')
    setLang(next)
    try {
      localStorage.setItem('esan_lang', next)
    } catch (e) {
      console.error('Failed to save language preference:', e)
    }
  }

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
          const params = new URLSearchParams(window.location.search)
          const adminParam = params.get('admin') === 'true' || window.location.hash === '#admin'
          if (adminParam) {
            const devAdmin = {
              id: 'admin-dev',
              name: 'System Administrator',
              email: 'admin@esanfoods.com',
              role: 'admin',
            }
            setCurrentUser(devAdmin)
            setIsAdminView(true)
          } else {
            setCurrentUser(null)
            setIsAdminView(false)
          }
        } else {
          setCurrentUser(auth.user)
          setIsAdminView(auth.isAdmin)
        }
      } catch (err) {
        if (isMounted) {
          const params = new URLSearchParams(window.location.search)
          const adminParam = params.get('admin') === 'true' || window.location.hash === '#admin'
          if (adminParam) {
            setCurrentUser({
              id: 'admin-dev',
              name: 'System Administrator',
              email: 'admin@esanfoods.com',
              role: 'admin',
            })
            setIsAdminView(true)
          } else {
            setCurrentUser(null)
            setIsAdminView(false)
          }
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
      showToast('New Product Launched 🚀', `${saved.name} saved in database!`)
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
      showToast('Product Removed 🗑️', `${item?.name || 'Product'} deleted from database.`)
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
  const handleAddToCart = (product, quantity = 1, selectedOption = null) => {
    const opts = Array.isArray(product.quantityOptions) && product.quantityOptions.length > 0
      ? product.quantityOptions
      : (Array.isArray(product.quantity_options) && product.quantity_options.length > 0)
      ? product.quantity_options
      : []
    const defaultOpt = findSingleItemOption(opts)
    const option = selectedOption !== undefined && selectedOption !== null
      ? selectedOption
      : (opts.length > 0 ? defaultOpt : null)
    const unitPrice = option ? Number(option.price) : Number(product.price)
    const cartItemId = option ? `${product.id}_${option.id}` : product.id

    setCartItems((prev) => {
      const existing = prev.find((item) => (item.cartItemId || item.product.id) === cartItemId)
      if (existing) {
        return prev.map((item) =>
          (item.cartItemId || item.product.id) === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [
          ...prev,
          {
            cartItemId,
            product,
            quantity,
            selectedOption: option,
            price: unitPrice,
          },
        ]
      }
    })
    const optionLabel = option?.title ? ` (${option.title})` : ''
    showToast(`Added to Box!`, `${quantity}x ${product.name}${optionLabel} ready for checkout.`)
  }

  const handleUpdateCartQty = (cartItemIdOrProdId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if ((item.cartItemId || item.product.id) === cartItemIdOrProdId || item.product.id === cartItemIdOrProdId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    })
  }

  const handleRemoveCartItem = (cartItemIdOrProdId) => {
    const item = cartItems.find((i) => (i.cartItemId || i.product.id) === cartItemIdOrProdId || i.product.id === cartItemIdOrProdId)
    setCartItems((prev) => prev.filter((i) => (i.cartItemId || i.product.id) !== cartItemIdOrProdId && i.product.id !== cartItemIdOrProdId))
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
      showToast('Removed from Favorites', `${prod ? prod.name : 'Product'} removed.`)
    } else {
      setWishlist((prev) => [...prev, productId])
      showToast('Saved to Favorites! ❤️', `${prod ? prod.name : 'Product'} added to your wishlist.`)
    }
  }

  // Filter products by category and search
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All Products' ||
      selectedCategory === 'All Flavors' ||
      product.category === selectedCategory
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
            setSelectedCategory('All Products')
            setTimeout(() => {
              document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }}
          onGoHome={() => navigate('/')}
          lang={lang}
          onToggleLang={handleToggleLang}
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
                  lang={lang}
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
                  lang={lang}
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
                  ctaContent={siteContent.ctaBanner}
                  isEditMode={isEditMode}
                  onUpdateCta={(cta) =>
                    setSiteContent((prev) => ({ ...prev, ctaBanner: cta }))
                  }
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
                lang={lang}
                onToggleLang={handleToggleLang}
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
                lang={lang}
                onToggleLang={handleToggleLang}
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
        lang={lang}
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
        lang={lang}
      />

      {/* Authentication / Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onOpenAdminDashboard={() => setIsAdminView(true)}
        onAddToCart={handleAddToCart}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        currentUser={currentUser}
        cartItems={cartItems}
        discountPercent={discountPercent}
        onOrderSuccess={async (checkoutData) => {
          try {
            // Insert order into Supabase orders + order_items tables
            await createOrder({
              userId: currentUser?.supabaseId || currentUser?.id || null,
              customerName: checkoutData.formData?.name?.trim() || currentUser?.name || 'Guest Shopper',
              customerEmail: checkoutData.formData?.email?.trim() || currentUser?.email || 'guest@esanfoods.com',
              customerPhone: checkoutData.formData?.phone?.trim() || currentUser?.phone || null,
              customerAvatar: currentUser?.avatar || null,
              items: checkoutData.cartItems || cartItems,
              subtotal: checkoutData.subtotal,
              discountAmount: checkoutData.discountAmount,
              discountCode: discountCode || null,
              shippingCost: checkoutData.shippingCost,
              taxAmount: checkoutData.tax,
              total: checkoutData.grandTotal,
              paymentMethod: checkoutData.formData?.paymentMethod === 'card'
                ? 'Credit Card'
                : checkoutData.formData?.paymentMethod === 'apple'
                  ? 'Apple Pay'
                  : checkoutData.formData?.paymentMethod === 'upi'
                    ? 'UPI / Net Banking'
                    : (checkoutData.formData?.paymentMethod || 'Credit Card'),
              shippingAddress: checkoutData.formData?.address,
              shippingCity: checkoutData.formData?.city,
              shippingZip: checkoutData.formData?.zip,
            })
            setCartItems([])
            showToast('Order Placed Successfully! 🎉', 'Your order has been saved and is being processed.')
          } catch (err) {
            console.error('Failed to create order:', err)
            showToast('Order Saved Locally', 'Could not sync to database. We\'ll retry later.')
            setCartItems([])
          }
        }}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
