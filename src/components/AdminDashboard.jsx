import React, { useState, useEffect, useRef } from 'react'
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
  IndianRupee,
  Boxes,
  Plus,
  Trash2,
  Edit2,
  Edit3,
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
  ChevronLeft,
  Languages,
  Wand2,
  Globe,
  Maximize2,
  Heart,
  Minus,
  Camera,
  Zap,
  Droplets,
  Leaf,
  CheckCircle2,
  RotateCcw,
  Star,
  Play,
  Palette,
  Layers,
  Copy,
  Film,
  Upload,
  Share2,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import {
  fetchCategories,
  addCategory,
  updateCategoryName,
  removeCategory,
  SQL_CATEGORIES_MIGRATION,
} from '../data/categoryService'
import {
  fetchOrders,
  updateOrderStatus as supabaseUpdateOrderStatus,
} from '../data/orderService'
import { getDefaultQuantityOptions, findSingleItemOption } from '../data/productService'
import { supabase } from '../lib/supabase'
import esanLogo from '../assets/esan_foods_logo.png'
import MediaUploader from './MediaUploader'
import AdminProgressGraph from './AdminProgressGraph'
import { BUCKETS, uploadImageToSupabase } from '../data/storageService'
import {
  autoTranslateProduct,
  translateToTamil,
  getTamilInstantTranslation,
  SQL_MIGRATION,
  getProductName,
  getProductSubtitle,
  getProductCategory,
  getProductBadge,
  TAMIL_PRODUCT_TRANSLATIONS,
} from '../data/tamilService'
import { SQL_SITE_CONTENT_MIGRATION } from '../data/siteContentService'
import { generateProductContentWithAi } from '../data/aiContentService'
import ProductModal from './ProductModal'
import ProductDetailScreen from './ProductDetailScreen'
import { getRatingSummary } from '../data/reviewService'

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
  const [adminQuickViewProduct, setAdminQuickViewProduct] = useState(null)
  const [adminDetailProduct, setAdminDetailProduct] = useState(null)
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

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderFilter, setOrderFilter] = useState('All')
  const [productSearch, setProductSearch] = useState('')
  const [editorMode, setEditorMode] = useState(null) // null | 'create' | 'edit'
  const [editorProduct, setEditorProduct] = useState(null)
  const [adminNotification, setAdminNotification] = useState('')
  const [previewLang, setPreviewLang] = useState('en') // 'en' | 'ta'
  const [isTranslating, setIsTranslating] = useState(false)
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [aiUserNotes, setAiUserNotes] = useState('')
  const [showSqlMigrationModal, setShowSqlMigrationModal] = useState(false)
  const [asyncTamilName, setAsyncTamilName] = useState('')
  const [asyncTamilSubtitle, setAsyncTamilSubtitle] = useState('')
  const [canvasMode, setCanvasMode] = useState('edit') // 'edit' | 'preview'
  const [detailsTab, setDetailsTab] = useState('overview') // 'overview' | 'nutrition' | 'ingredients' | 'how-to-use'
  const [quickModalTab, setQuickModalTab] = useState('overview')
  const [selectedPackOption, setSelectedPackOption] = useState('single') // 'single' | 'pack6' | 'pack12'
  const [previewQty, setPreviewQty] = useState(1)
  const [showImageModal, setShowImageModal] = useState(false)
  const [newTastingNote, setNewTastingNote] = useState('')
  const [newIngredient, setNewIngredient] = useState('')
  const [newHighlight, setNewHighlight] = useState('')
  const [quickTagInput, setQuickTagInput] = useState('')
  const fileInputRef = useRef(null)
  const [isDropzoneDragging, setIsDropzoneDragging] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [customImageUrl, setCustomImageUrl] = useState('')
  const [draggedThumbIdx, setDraggedThumbIdx] = useState(null)
  const [categories, setCategories] = useState([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatNameTa, setNewCatNameTa] = useState('')
  const [editingCategoryName, setEditingCategoryName] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameValueTa, setRenameValueTa] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All')
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  // Load and sync categories
  useEffect(() => {
    fetchCategories(products).then((cats) => {
      if (cats && cats.length > 0) setCategories(cats)
    })
  }, [products])

  const handleAddCategory = async (e) => {
    e?.preventDefault()
    if (!newCatName.trim()) return
    try {
      const added = await addCategory(newCatName.trim(), newCatNameTa.trim())
      setCategories((prev) => [...prev.filter((c) => c.name.toLowerCase() !== added.name.toLowerCase()), added])
      setNewCatName('')
      setNewCatNameTa('')
      setAdminNotification(`Category "${added.name}" added successfully!`)
      setTimeout(() => setAdminNotification(''), 3000)
    } catch (err) {
      console.error('Error adding category:', err)
    }
  }

  const handleSaveRenameCategory = async (oldName) => {
    if (!renameValue.trim() || renameValue.trim() === oldName) {
      setEditingCategoryName(null)
      return
    }
    try {
      await updateCategoryName(oldName, renameValue.trim(), renameValueTa.trim(), products)
      setCategories((prev) =>
        prev.map((c) =>
          c.name.toLowerCase() === oldName.toLowerCase()
            ? { ...c, name: renameValue.trim(), name_ta: renameValueTa.trim() || c.name_ta }
            : c
        )
      )
      setEditingCategoryName(null)
      setAdminNotification(`Category renamed to "${renameValue.trim()}"!`)
      setTimeout(() => setAdminNotification(''), 3000)
    } catch (err) {
      console.error('Error renaming category:', err)
    }
  }

  const handleDeleteCategory = async (catName) => {
    if (!window.confirm(`Are you sure you want to remove category "${catName}"?`)) return
    try {
      await removeCategory(catName)
      setCategories((prev) => prev.filter((c) => c.name.toLowerCase() !== catName.toLowerCase()))
      if (selectedCategoryFilter === catName) setSelectedCategoryFilter('All')
      setAdminNotification(`Category "${catName}" removed.`)
      setTimeout(() => setAdminNotification(''), 3000)
    } catch (err) {
      console.error('Error removing category:', err)
    }
  }

  // Move a photo position left/right and ensure position 0 is ALWAYS the main card cover!
  const handleMoveGalleryImage = (fromIdx, toIdx) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return
    setEditorProduct((prev) => {
      const current = Array.isArray(prev.galleryImages) && prev.galleryImages.length > 0
        ? [...prev.galleryImages]
        : (prev.image ? [prev.image] : [])

      if (fromIdx >= current.length || toIdx >= current.length) return prev

      const [movedItem] = current.splice(fromIdx, 1)
      current.splice(toIdx, 0, movedItem)

      // The very first one is ALWAYS the main card cover!
      const newCover = current[0] || ''

      return {
        ...prev,
        galleryImages: current,
        galleryImagesText: current.join('\n'),
        image: newCover,
      }
    })
  }

  // Remove a photo from gallery and update cover if position 0 changed
  const handleRemoveGalleryImage = (idx) => {
    setEditorProduct((prev) => {
      const current = Array.isArray(prev.galleryImages) && prev.galleryImages.length > 0
        ? [...prev.galleryImages]
        : (prev.image ? [prev.image] : [])
      const nextGallery = current.filter((_, i) => i !== idx)
      const newCover = nextGallery[0] || ''
      return {
        ...prev,
        galleryImages: nextGallery,
        galleryImagesText: nextGallery.join('\n'),
        image: newCover,
      }
    })
  }

  const handleImageFileChange = async (filesOrFile) => {
    if (!filesOrFile) return
    const files = filesOrFile instanceof FileList || Array.isArray(filesOrFile)
      ? Array.from(filesOrFile)
      : [filesOrFile]

    const imageFiles = files.filter((f) => f && f.type?.startsWith('image/'))
    if (!imageFiles.length) {
      setAdminNotification('Please choose image files (PNG, JPG, WebP).')
      setTimeout(() => setAdminNotification(''), 3000)
      return
    }

    // 1. Instant local previews via FileReader so all photos render immediately
    const dataUrls = await Promise.all(
      imageFiles.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (ev) => resolve(ev.target.result)
            reader.readAsDataURL(file)
          })
      )
    )

    setEditorProduct((prev) => {
      const existingGallery = Array.isArray(prev.galleryImages)
        ? prev.galleryImages
        : (prev.image ? [prev.image] : [])
      const newGallery = [...existingGallery, ...dataUrls]
      return {
        ...prev,
        image: prev.image || newGallery[0] || '',
        galleryImages: newGallery,
        galleryImagesText: newGallery.join('\n'),
      }
    })

    setAdminNotification(`Processing ${imageFiles.length} photo${imageFiles.length > 1 ? 's' : ''}...`)

    // 2. Upload to Supabase Storage in background
    setIsUploadingImage(true)
    try {
      const uploadPromises = imageFiles.map((file) =>
        uploadImageToSupabase(file, BUCKETS.PRODUCT_IMAGES)
          .then((res) => res.publicUrl)
          .catch((err) => {
            console.warn('Storage upload note:', err)
            return null
          })
      )
      const uploadedUrls = await Promise.all(uploadPromises)
      const validUrls = uploadedUrls.filter(Boolean)

      if (validUrls.length > 0) {
        setEditorProduct((prev) => {
          const currentGallery = prev.galleryImages || []
          const cleanGallery = currentGallery.map((url) => {
            const matchIdx = dataUrls.indexOf(url)
            if (matchIdx !== -1 && validUrls[matchIdx]) {
              return validUrls[matchIdx]
            }
            return url
          })
          const finalCover = prev.image && !prev.image.startsWith('data:')
            ? prev.image
            : (cleanGallery[0] || prev.image)
          return {
            ...prev,
            image: finalCover,
            galleryImages: cleanGallery,
            galleryImagesText: cleanGallery.join('\n'),
          }
        })
        setAdminNotification(`Uploaded ${validUrls.length} image${validUrls.length > 1 ? 's' : ''}! ✨`)
      }
    } catch (err) {
      console.warn('Upload note:', err)
      setAdminNotification('Photos loaded! ✨')
    } finally {
      setIsUploadingImage(false)
      setTimeout(() => setAdminNotification(''), 3000)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleImageDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropzoneDragging(false)
    if (e.dataTransfer?.files?.length > 0) {
      handleImageFileChange(e.dataTransfer.files)
    }
  }

  // Live re-translate name whenever English name changes
  useEffect(() => {
    let isMounted = true
    if (!editorProduct?.name) {
      setAsyncTamilName('')
      return
    }
    const currentName = editorProduct.name
    const instant = getTamilInstantTranslation(currentName)
    if (instant) {
      setAsyncTamilName(instant)
      setEditorProduct((prev) => {
        if (!prev || prev.name !== currentName) return prev
        if (prev.name_ta === instant && prev.nameTa === instant) return prev
        return { ...prev, name_ta: instant, nameTa: instant }
      })
    }
    const timer = setTimeout(async () => {
      try {
        const tr = await translateToTamil(currentName)
        if (isMounted && tr) {
          setAsyncTamilName(tr)
          setEditorProduct((prev) => {
            if (!prev || prev.name !== currentName) return prev
            if (prev.name_ta === tr && prev.nameTa === tr) return prev
            return { ...prev, name_ta: tr, nameTa: tr }
          })
        }
      } catch (e) {}
    }, 200)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [editorProduct?.name])

  // Live re-translate subtitle whenever English subtitle changes
  useEffect(() => {
    let isMounted = true
    if (!editorProduct?.subtitle) {
      setAsyncTamilSubtitle('')
      return
    }
    const currentSub = editorProduct.subtitle
    const instant = getTamilInstantTranslation(currentSub)
    if (instant) {
      setAsyncTamilSubtitle(instant)
      setEditorProduct((prev) => {
        if (!prev || prev.subtitle !== currentSub) return prev
        if (prev.subtitle_ta === instant && prev.subtitleTa === instant) return prev
        return { ...prev, subtitle_ta: instant, subtitleTa: instant }
      })
    }
    const timer = setTimeout(async () => {
      try {
        const tr = await translateToTamil(currentSub)
        if (isMounted && tr) {
          setAsyncTamilSubtitle(tr)
          setEditorProduct((prev) => {
            if (!prev || prev.subtitle !== currentSub) return prev
            if (prev.subtitle_ta === tr && prev.subtitleTa === tr) return prev
            return { ...prev, subtitle_ta: tr, subtitleTa: tr }
          })
        }
      } catch (e) {}
    }, 200)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [editorProduct?.subtitle])

  // Live re-translate category whenever English category changes
  useEffect(() => {
    if (!editorProduct?.category) return
    const currentCat = editorProduct.category
    const catTa = getProductCategory(currentCat, 'ta')
    if (catTa) {
      setEditorProduct((prev) => {
        if (!prev || prev.category !== currentCat) return prev
        if (prev.category_ta === catTa && prev.categoryTa === catTa) return prev
        return { ...prev, category_ta: catTa, categoryTa: catTa }
      })
    }
  }, [editorProduct?.category])

  // Live re-translate badge whenever English badge changes
  useEffect(() => {
    if (!editorProduct?.badge) return
    const currentBadge = editorProduct.badge
    const badgeTa = getProductBadge(currentBadge, 'ta')
    if (badgeTa) {
      setEditorProduct((prev) => {
        if (!prev || prev.badge !== currentBadge) return prev
        if (prev.badge_ta === badgeTa && prev.badgeTa === badgeTa) return prev
        return { ...prev, badge_ta: badgeTa, badgeTa: badgeTa }
      })
    }
  }, [editorProduct?.badge])

  // Fetch orders from Supabase on mount + real-time sync
  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      try {
        const liveOrders = await fetchOrders()
        if (isMounted) {
          setOrders(liveOrders)
        }
      } catch (err) {
        console.error('Failed to load orders from Supabase:', err)
      } finally {
        if (isMounted) setOrdersLoading(false)
      }
    }

    loadOrders()

    // Real-time subscription for orders table changes
    const ordersChannel = supabase
      .channel('admin:orders:changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async () => {
          const fresh = await fetchOrders()
          if (isMounted) setOrders(fresh)
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(ordersChannel)
    }
  }, [])

  // Overview metrics calculations
  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  const totalOrdersCount = orders.length
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'Processing' || o.status === 'Shipped'
  ).length
  const outOfStockCount = products.filter((p) => p.stockStatus === 'Out of Stock').length
  const aov = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0
  const uniqueCustomerEmails = Array.from(
    new Set(orders.map((o) => o.customer?.email).filter(Boolean))
  )
  const uniqueCustomerCount = uniqueCustomerEmails.length || (orders.length > 0 ? 1 : 0)
  const repeatCustomersCount = uniqueCustomerEmails.filter(
    (email) => orders.filter((o) => o.customer?.email === email).length > 1
  ).length

  const handleStatusChange = async (orderId, newStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
    setAdminNotification(`Order ${orderId} updated to ${newStatus}`)
    setTimeout(() => setAdminNotification(''), 3000)

    try {
      await supabaseUpdateOrderStatus(orderId, newStatus)
    } catch (err) {
      console.error('Failed to update order status:', err)
      setAdminNotification('Failed to update status in database!')
      // Revert on failure
      const fresh = await fetchOrders()
      setOrders(fresh)
    }
  }

  const handleOpenCreateProduct = () => {
    const defaultQtyOpts = [
      {
        id: 'opt-1',
        title: 'Single Item',
        size: '250g',
        price: 0,
        badge: '',
        discountText: '',
      },
    ]
    setEditorProduct({
      id: 'prod-' + Date.now(),
      name: '',
      subtitle: '',
      category: '',
      volume: '',
      price: '',
      originalPrice: '',
      badge: '',
      color: '#059669',
      bgSoft: '#ecfdf5',
      image: '',
      galleryImages: [],
      galleryImagesText: '',
      videoUrl: '',
      calories: '',
      sugar: '',
      carbs: '',
      vitaminC: '',
      organic: '',
      description: '',
      quantityOptions: defaultQtyOpts,
      tastingNotes: [],
      ingredients: [],
      highlights: [],
      stockStatus: '',
      prepTitle: '',
      prepStep: '',
      blendTitle: '',
      blendStep: '',
      enjoyTitle: '',
      enjoyStep: '',
      rating: '',
      reviewsCount: '',
      seals: [
        { title: '', desc: '' },
        { title: '', desc: '' },
        { title: '', desc: '' },
        { title: '', desc: '' },
      ],
      name_ta: '',
      nameTa: '',
      subtitle_ta: '',
      subtitleTa: '',
      category_ta: '',
      categoryTa: '',
      badge_ta: '',
      badgeTa: '',
      description_ta: '',
      descriptionTa: '',
    })
    setEditorMode('create')
    setCanvasMode('edit')
    setIsCustomCategoryMode(false)
    setDetailsTab('overview')
    setAiUserNotes('')
    setSelectedPackOption('opt-1')
    setPreviewQty(1)
    setActiveTab('products')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenEditProduct = (p) => {
    const galleryArr = Array.isArray(p.galleryImages)
      ? p.galleryImages
      : (p.image ? [p.image] : [])
    const cleanPlaceholder = (val, ph) => (val === ph ? '' : (val || ''))

    const initialQtyOpts = Array.isArray(p.quantityOptions)
      ? p.quantityOptions
      : (Array.isArray(p.quantity_options)
      ? p.quantity_options
      : (Array.isArray(p.nutrition?.quantityOptions)
      ? p.nutrition.quantityOptions
      : getDefaultQuantityOptions(p.price, p.volume)))

    setEditorProduct({
      ...p,
      price: p.price ?? '',
      originalPrice: p.originalPrice ?? '',
      badge: p.badge || '',
      volume: p.volume || '',
      color: p.color || '#059669',
      bgSoft: p.bgSoft || p.bg_soft || '#ecfdf5',
      image: p.image || '',
      galleryImages: galleryArr,
      galleryImagesText: galleryArr.join('\n'),
      calories: p.nutrition?.calories || p.calories || '',
      sugar: p.nutrition?.sugar || p.sugar || '',
      carbs: p.nutrition?.carbs || p.carbs || '',
      vitaminC: p.nutrition?.vitaminC || p.vitaminC || '',
      organic: p.nutrition?.organic || p.organic || '',
      description: p.description || '',
      quantityOptions: initialQtyOpts,
      tastingNotes: p.tastingNotes || p.tasting_notes || [],
      ingredients: p.ingredients || [],
      highlights: p.highlights || [],
      stockStatus: p.stockStatus || p.stock_status || '',
      prepTitle: p.prepTitle || p.howToUse?.prepTitle || '',
      prepStep: p.prepStep || p.howToUse?.prepStep || '',
      blendTitle: p.blendTitle || p.howToUse?.blendTitle || '',
      blendStep: p.blendStep || p.howToUse?.blendStep || '',
      enjoyTitle: p.enjoyTitle || p.howToUse?.enjoyTitle || '',
      enjoyStep: p.enjoyStep || p.howToUse?.enjoyStep || '',
      rating: p.rating ?? '',
      reviewsCount: p.reviewsCount ?? '',
      seals: Array.isArray(p.seals) && p.seals.length === 4 ? p.seals : [
        { title: '', desc: '' },
        { title: '', desc: '' },
        { title: '', desc: '' },
        { title: '', desc: '' },
      ],
      name_ta: cleanPlaceholder(p.nameTa || p.name_ta, 'தமிழ் பெயர்'),
      nameTa: cleanPlaceholder(p.nameTa || p.name_ta, 'தமிழ் பெயர்'),
      subtitle_ta: cleanPlaceholder(p.subtitleTa || p.subtitle_ta, 'இயற்கை பானம்'),
      subtitleTa: cleanPlaceholder(p.subtitleTa || p.subtitle_ta, 'இயற்கை பானம்'),
      category_ta: p.categoryTa || p.category_ta || '',
      categoryTa: p.categoryTa || p.category_ta || '',
      badge_ta: p.badgeTa || p.badge_ta || '',
      badgeTa: p.badgeTa || p.badge_ta || '',
      description_ta: p.descriptionTa || p.description_ta || '',
      descriptionTa: p.descriptionTa || p.description_ta || '',
    })
    setEditorMode('edit')
    setCanvasMode('edit')
    setIsCustomCategoryMode(false)
    setDetailsTab('overview')
    setAiUserNotes('')
    const defaultOpt = findSingleItemOption(initialQtyOpts)
    setSelectedPackOption(defaultOpt?.id || initialQtyOpts[0]?.id || null)
    setPreviewQty(1)
    setActiveTab('products')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOptionChange = (index, field, value) => {
    setEditorProduct((prev) => {
      const currentOpts = Array.isArray(prev.quantityOptions)
        ? [...prev.quantityOptions]
        : []
      if (!currentOpts[index]) return prev
      currentOpts[index] = {
        ...currentOpts[index],
        [field]: value,
      }
      return { ...prev, quantityOptions: currentOpts }
    })
  }

  const handleAddOption = () => {
    setEditorProduct((prev) => {
      const currentOpts = Array.isArray(prev.quantityOptions)
        ? [...prev.quantityOptions]
        : []
      const newId = 'opt-' + Date.now()
      const newOpt = {
        id: newId,
        title: currentOpts.length === 0 ? 'Single Item' : `Option ${currentOpts.length + 1}`,
        size: prev.volume || '250g',
        price: Number(prev.price || 0),
        badge: '',
        discountText: '',
      }
      setSelectedPackOption(newId)
      return { ...prev, quantityOptions: [...currentOpts, newOpt] }
    })
  }

  const handleRemoveOption = (index) => {
    setEditorProduct((prev) => {
      const currentOpts = Array.isArray(prev.quantityOptions)
        ? [...prev.quantityOptions]
        : []
      if (currentOpts.length === 0) return prev
      const removedId = currentOpts[index]?.id
      const nextOpts = currentOpts.filter((_, i) => i !== index)
      if (selectedPackOption === removedId) {
        const nextDefault = findSingleItemOption(nextOpts)
        setSelectedPackOption(nextDefault?.id || nextOpts[0]?.id || null)
      }
      return { ...prev, quantityOptions: nextOpts }
    })
  }

  const handleAutoRecalculateDiscounts = () => {
    setEditorProduct((prev) => {
      const basePrice = Number(prev.price || 0)
      const vol = prev.volume || '250g'
      const updatedOpts = [
        {
          id: 'opt-1',
          title: 'Single Item',
          size: vol,
          price: Number(basePrice.toFixed(2)),
          badge: '',
          discountText: '',
        },
        {
          id: 'opt-2',
          title: 'Pack of 6',
          size: 'Save 10%',
          price: Number((basePrice * 6 * 0.9).toFixed(2)),
          badge: 'POPULAR',
          discountText: 'Save 10%',
        },
        {
          id: 'opt-3',
          title: 'Pack of 12',
          size: 'Save 15%',
          price: Number((basePrice * 12 * 0.85).toFixed(2)),
          badge: 'BEST VALUE',
          discountText: 'Save 15%',
        },
      ]
      setSelectedPackOption('opt-1')
      return { ...prev, quantityOptions: updatedOpts }
    })
    setAdminNotification('Packs updated with 10% & 15% bulk discounts! ⚡')
    setTimeout(() => setAdminNotification(''), 3500)
  }

  const handleResetGramPacks = () => {
    setEditorProduct((prev) => {
      const basePrice = Number(prev.price || 0)
      const p100 = basePrice > 0 ? basePrice : 150
      const p250 = Math.round(p100 * 2.3)
      const p500 = Math.round(p100 * 4.2)
      const updatedOpts = [
        {
          id: 'opt-1',
          title: '100g Pouch',
          size: '100g',
          price: p100,
          badge: '',
          discountText: 'Standard',
        },
        {
          id: 'opt-2',
          title: '250g Jar',
          size: '250g',
          price: p250,
          badge: 'POPULAR',
          discountText: 'Save 10%',
        },
        {
          id: 'opt-3',
          title: '500g Value Pack',
          size: '500g',
          price: p500,
          badge: 'BEST VALUE',
          discountText: 'Save 15%',
        },
      ]
      setSelectedPackOption('opt-1')
      return { ...prev, quantityOptions: updatedOpts }
    })
    setAdminNotification('Herbal powder weights loaded (100g / 250g / 500g)! 🌿')
    setTimeout(() => setAdminNotification(''), 3500)
  }

  const handleAutoTranslateTamil = async (customProduct = null) => {
    const target = customProduct || editorProduct
    if (!target?.name && !target?.description) {
      setAdminNotification('Please enter at least an English name first.')
      return
    }
    setIsTranslating(true)
    try {
      const translated = await autoTranslateProduct(target)
      setEditorProduct((prev) => ({
        ...prev,
        ...translated,
      }))
      setAdminNotification('Translated into Tamil! ✨')
    } catch (err) {
      console.error('Translation error:', err)
      setAdminNotification('Failed to auto-translate.')
    } finally {
      setIsTranslating(false)
      setTimeout(() => setAdminNotification(''), 3500)
    }
  }

  const handleAiAutoFill = async () => {
    const rawName = editorProduct?.name?.trim()
    if (!rawName) {
      setAdminNotification('Please enter a product name first.')
      setTimeout(() => setAdminNotification(''), 3000)
      return
    }

    setIsAiGenerating(true)
    setAdminNotification('✨ Writing product details with AI...')

    try {
      const catNames = categories.map((c) => c.name)
      const aiData = await generateProductContentWithAi(rawName, {
        availableCategories: catNames,
        userNotes: aiUserNotes.trim(),
        existingProduct: editorProduct,
      })

      // If AI created or suggested a new category that does not exist in store, add it automatically
      let resolvedCategory = aiData.category
      if (aiData.category) {
        const existingCat = categories.find(
          (c) => c.name.toLowerCase() === aiData.category.toLowerCase()
        )
        if (!existingCat) {
          try {
            const added = await addCategory(
              aiData.category.trim(),
              (aiData.category_ta || '').trim()
            )
            setCategories((prev) => [
              ...prev.filter((c) => c.name.toLowerCase() !== added.name.toLowerCase()),
              added,
            ])
            resolvedCategory = added.name
          } catch (e) {
            console.warn('Could not auto-save new category:', e)
          }
        } else {
          resolvedCategory = existingCat.name
        }
      }

      setEditorProduct((prev) => {
        // Retain any existing images/video uploaded by the admin
        const keepImage = prev?.image || ''
        const keepGallery = (Array.isArray(prev?.galleryImages) && prev.galleryImages.length > 0)
          ? prev.galleryImages
          : (keepImage ? [keepImage] : [])

        const hasExistingZeroOpts = Array.isArray(prev?.quantityOptions) && prev.quantityOptions.length === 0
        const wantsOptionsInNotes = aiUserNotes.toLowerCase().includes('option') || aiUserNotes.toLowerCase().includes('pack')
        const resolvedQtyOpts = hasExistingZeroOpts && !wantsOptionsInNotes
          ? []
          : (aiData.quantityOptions ?? prev?.quantityOptions ?? [])

        return {
          ...prev,
          name: aiData.name || prev?.name || rawName,
          subtitle: aiData.subtitle || prev?.subtitle || '',
          category: resolvedCategory || prev?.category || '',
          volume: aiData.volume || prev?.volume || '250g',
          price: aiData.price !== undefined ? aiData.price : prev?.price,
          originalPrice: aiData.originalPrice !== undefined ? aiData.originalPrice : prev?.originalPrice,
          badge: aiData.badge || prev?.badge || '',
          color: aiData.color || prev?.color || '#059669',
          bgSoft: aiData.bgSoft || prev?.bgSoft || '#ecfdf5',
          image: keepImage,
          galleryImages: keepGallery,
          galleryImagesText: keepGallery.join('\n'),
          stockStatus: aiData.stockStatus || prev?.stockStatus || 'In Stock • Ships Today',
          rating: aiData.rating || prev?.rating || 4.9,
          reviewsCount: aiData.reviewsCount || prev?.reviewsCount || 128,
          description: aiData.description || prev?.description || '',
          quantityOptions: resolvedQtyOpts,
          tastingNotes: aiData.tastingNotes || prev?.tastingNotes || [],
          ingredients: aiData.ingredients || prev?.ingredients || [],
          highlights: aiData.highlights || prev?.highlights || [],
          seals: aiData.seals || prev?.seals || [],
          nutrition: aiData.nutrition || prev?.nutrition,
          calories: aiData.nutrition?.calories || prev?.calories || '',
          sugar: aiData.nutrition?.sugar || prev?.sugar || '',
          carbs: aiData.nutrition?.carbs || prev?.carbs || '',
          vitaminC: aiData.nutrition?.vitaminC || prev?.vitaminC || '',
          organic: aiData.nutrition?.organic || prev?.organic || '',
          prepTitle: aiData.howToUse?.prepTitle || prev?.prepTitle || '',
          prepStep: aiData.howToUse?.prepStep || prev?.prepStep || '',
          blendTitle: aiData.howToUse?.blendTitle || prev?.blendTitle || '',
          blendStep: aiData.howToUse?.blendStep || prev?.blendStep || '',
          enjoyTitle: aiData.howToUse?.enjoyTitle || prev?.enjoyTitle || '',
          enjoyStep: aiData.howToUse?.enjoyStep || prev?.enjoyStep || '',
          name_ta: aiData.name_ta || prev?.name_ta || '',
          nameTa: aiData.name_ta || prev?.nameTa || '',
          subtitle_ta: aiData.subtitle_ta || prev?.subtitle_ta || '',
          subtitleTa: aiData.subtitle_ta || prev?.subtitleTa || '',
          category_ta: aiData.category_ta || prev?.category_ta || '',
          categoryTa: aiData.category_ta || prev?.categoryTa || '',
          badge_ta: aiData.badge_ta || prev?.badge_ta || '',
          badgeTa: aiData.badge_ta || prev?.badgeTa || '',
          description_ta: aiData.description_ta || prev?.description_ta || '',
          descriptionTa: aiData.description_ta || prev?.descriptionTa || '',
          ingredients_ta: aiData.ingredients_ta || prev?.ingredients_ta || [],
          ingredientsTa: aiData.ingredients_ta || prev?.ingredientsTa || [],
        }
      })

      if (Array.isArray(aiData.quantityOptions) && aiData.quantityOptions.length > 0) {
        const defaultOpt = findSingleItemOption(aiData.quantityOptions)
        setSelectedPackOption(defaultOpt?.id || aiData.quantityOptions[0]?.id || null)
      } else {
        setSelectedPackOption(null)
      }

      setAdminNotification('✨ Product details polished & filled successfully!')
    } catch (err) {
      console.error('AI Auto-Fill error:', err)
      setAdminNotification(`AI Auto-Fill: ${err.message || 'Please try again'}`)
    } finally {
      setIsAiGenerating(false)
      setTimeout(() => setAdminNotification(''), 4000)
    }
  }

  const handleCancelEditor = () => {
    setEditorMode(null)
    setEditorProduct(null)
  }

  const handleSaveProduct = (e) => {
    if (e) e.preventDefault()
    if (!editorProduct || !editorProduct.name.trim()) {
      alert('Please enter a product name.')
      return
    }

    const galleryList = editorProduct.galleryImagesText
      ? editorProduct.galleryImagesText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      : (Array.isArray(editorProduct.galleryImages) && editorProduct.galleryImages.length > 0
          ? editorProduct.galleryImages
          : (editorProduct.image ? [editorProduct.image] : []))

    const finalImage = (galleryList && galleryList[0]) || editorProduct.image || ''

    const sanitizedSeals = Array.isArray(editorProduct.seals) ? editorProduct.seals : []
    const sanitizedHighlights = Array.isArray(editorProduct.highlights) ? editorProduct.highlights : []

    const rawOpts = Array.isArray(editorProduct.quantityOptions)
      ? editorProduct.quantityOptions
      : []

    const sanitizedQuantityOptions = rawOpts.map((opt, i) => ({
      id: opt.id || `opt-${i + 1}`,
      title: opt.title || `Option ${i + 1}`,
      size: opt.size || '',
      price: parseFloat(opt.price) || 0,
      badge: opt.badge || '',
      discountText: opt.discountText || opt.size || '',
    }))

    if (editorMode === 'edit') {
      const updated = {
        ...editorProduct,
        quantityOptions: sanitizedQuantityOptions,
        price: parseFloat(editorProduct.price) || 0,
        originalPrice: editorProduct.originalPrice ? parseFloat(editorProduct.originalPrice) : undefined,
        rating: parseFloat(editorProduct.rating) || 5.0,
        reviewsCount: parseInt(editorProduct.reviewsCount, 10) || 1,
        image: finalImage,
        galleryImages: galleryList.length > 0 ? galleryList : (finalImage ? [finalImage] : []),
        bgSoft: editorProduct.bgSoft || '#ecfdf5',
        tastingNotes: editorProduct.tastingNotes || [],
        ingredients: editorProduct.ingredients || [],
        highlights: sanitizedHighlights,
        seals: sanitizedSeals,
        stockStatus: editorProduct.stockStatus || '',
        prepTitle: editorProduct.prepTitle || '',
        prepStep: editorProduct.prepStep || '',
        blendTitle: editorProduct.blendTitle || '',
        blendStep: editorProduct.blendStep || '',
        enjoyTitle: editorProduct.enjoyTitle || '',
        enjoyStep: editorProduct.enjoyStep || '',
        howToUse: {
          prepTitle: editorProduct.prepTitle || '',
          prepStep: editorProduct.prepStep || '',
          blendTitle: editorProduct.blendTitle || '',
          blendStep: editorProduct.blendStep || '',
          enjoyTitle: editorProduct.enjoyTitle || '',
          enjoyStep: editorProduct.enjoyStep || '',
        },
        nutrition: {
          ...(editorProduct.nutrition || {}),
          calories: editorProduct.calories || editorProduct.nutrition?.calories || '',
          sugar: editorProduct.sugar || editorProduct.nutrition?.sugar || '',
          carbs: editorProduct.carbs || editorProduct.nutrition?.carbs || '',
          vitaminC: editorProduct.vitaminC || editorProduct.nutrition?.vitaminC || '',
          organic: editorProduct.organic || editorProduct.nutrition?.organic || '',
        },
        name_ta: editorProduct.name_ta || editorProduct.nameTa || '',
        nameTa: editorProduct.name_ta || editorProduct.nameTa || '',
        subtitle_ta: editorProduct.subtitle_ta || editorProduct.subtitleTa || '',
        subtitleTa: editorProduct.subtitle_ta || editorProduct.subtitleTa || '',
        category_ta: editorProduct.category_ta || editorProduct.categoryTa || '',
        categoryTa: editorProduct.category_ta || editorProduct.categoryTa || '',
        badge_ta: editorProduct.badge_ta || editorProduct.badgeTa || '',
        badgeTa: editorProduct.badge_ta || editorProduct.badgeTa || '',
        description_ta: editorProduct.description_ta || editorProduct.descriptionTa || '',
        descriptionTa: editorProduct.description_ta || editorProduct.descriptionTa || '',
      }
      onUpdateProduct(updated)
      setAdminNotification(`Product "${updated.name}" updated successfully! ✨`)
    } else {
      const idSlug = editorProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('prod-' + Date.now())
      const created = {
        ...editorProduct,
        id: idSlug,
        quantityOptions: sanitizedQuantityOptions,
        price: parseFloat(editorProduct.price) || 0,
        originalPrice: editorProduct.originalPrice ? parseFloat(editorProduct.originalPrice) : undefined,
        rating: parseFloat(editorProduct.rating) || 5.0,
        reviewsCount: parseInt(editorProduct.reviewsCount, 10) || 1,
        image: finalImage,
        galleryImages: galleryList.length > 0 ? galleryList : (finalImage ? [finalImage] : []),
        bgSoft: editorProduct.bgSoft || '#ecfdf5',
        tastingNotes: editorProduct.tastingNotes || [],
        ingredients: editorProduct.ingredients || [],
        highlights: sanitizedHighlights,
        seals: sanitizedSeals,
        stockStatus: editorProduct.stockStatus || '',
        prepTitle: editorProduct.prepTitle || '',
        prepStep: editorProduct.prepStep || '',
        blendTitle: editorProduct.blendTitle || '',
        blendStep: editorProduct.blendStep || '',
        enjoyTitle: editorProduct.enjoyTitle || '',
        enjoyStep: editorProduct.enjoyStep || '',
        howToUse: {
          prepTitle: editorProduct.prepTitle || '',
          prepStep: editorProduct.prepStep || '',
          blendTitle: editorProduct.blendTitle || '',
          blendStep: editorProduct.blendStep || '',
          enjoyTitle: editorProduct.enjoyTitle || '',
          enjoyStep: editorProduct.enjoyStep || '',
        },
        nutrition: {
          calories: editorProduct.calories || '',
          sugar: editorProduct.sugar || '',
          carbs: editorProduct.carbs || '',
          vitaminC: editorProduct.vitaminC || '',
          organic: editorProduct.organic || '',
        },
        name_ta: editorProduct.name_ta || editorProduct.nameTa || '',
        nameTa: editorProduct.name_ta || editorProduct.nameTa || '',
        subtitle_ta: editorProduct.subtitle_ta || editorProduct.subtitleTa || '',
        subtitleTa: editorProduct.subtitle_ta || editorProduct.subtitleTa || '',
        category_ta: editorProduct.category_ta || editorProduct.categoryTa || '',
        categoryTa: editorProduct.category_ta || editorProduct.categoryTa || '',
        badge_ta: editorProduct.badge_ta || editorProduct.badgeTa || '',
        badgeTa: editorProduct.badge_ta || editorProduct.badgeTa || '',
        description_ta: editorProduct.description_ta || editorProduct.descriptionTa || '',
        descriptionTa: editorProduct.description_ta || editorProduct.descriptionTa || '',
      }
      onAddProduct(created)
      setAdminNotification(`New product "${created.name}" published successfully! 🚀`)
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

  // Filtered products in admin list with search and category filter
  const filteredProductsList = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    const matchesCat =
      selectedCategoryFilter === 'All' ||
      p.category?.toLowerCase() === selectedCategoryFilter.toLowerCase()
    return matchesSearch && matchesCat
  })

  return (
    <div className={`admin-layout-root animate-fade-in ${theme === 'dark' ? 'admin-theme-dark' : 'admin-theme-light'}`}>
      {/* Mobile Smart Sticky Header (Visible on screens <= 1024px) */}
      {!(editorMode && activeTab === 'products') && (
        <header className={`admin-mobile-header-wrapper ${headerVisible ? 'header-visible' : 'header-hidden'}`}>
          <div className="admin-mobile-header">
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
          </div>

          {/* Mobile Horizontal Quick-Tabs Pill Bar (Pinned directly below brand bar) */}
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
        </header>
      )}

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
            <div className="admin-avatar-badge" title="Administrator">
              <ShieldCheck size={18} />
            </div>
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

        {/* Top Header Bar - hidden during in-place product visual editing to avoid duplicate headers */}
        {!(editorMode && activeTab === 'products') && (
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <h1 className="admin-page-title">
                {(activeTab === 'overview' && 'Overview') ||
                  (activeTab === 'products' && 'Products') ||
                  (activeTab === 'orders' && 'Orders') ||
                  (activeTab === 'customers' && 'Customers') ||
                  (activeTab === 'settings' && 'Settings')}
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
        )}

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="admin-tab-content animate-fade-in">
            {/* Stat KPI Cards - 100% Real Live Database Data */}
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap kpi-green">
                  <IndianRupee size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Gross Revenue</span>
                  <h3 className="kpi-val">₹{totalRevenue.toFixed(2)}</h3>
                  <span className="kpi-trend positive">
                    {totalOrdersCount > 0
                      ? `₹${aov.toFixed(2)} avg / order`
                      : 'Verified database orders'}
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
                  <h3 className="kpi-val">{products.length} Products</h3>
                  <span className="kpi-trend positive">
                    {outOfStockCount > 0 ? `${outOfStockCount} out of stock` : 'All items in stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Progress Graph & Lifecycle Analytics */}
            <AdminProgressGraph orders={orders} />

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
                      {ordersLoading ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--color-text-muted)' }}>
                            <div className="media-spinner" style={{ margin: '0 auto 8px', width: '20px', height: '20px' }}></div>
                            Loading recent database orders...
                          </td>
                        </tr>
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--color-text-muted)' }}>
                            No orders placed yet.
                          </td>
                        </tr>
                      ) : (
                        orders.slice(0, 5).map((order) => (
                          <tr key={order.id}>
                            <td><strong>#{order.id}</strong></td>
                            <td>
                              <div className="customer-cell-simple">
                                <span className="customer-name-bold">{order.customer?.name || 'Customer'}</span>
                              </div>
                            </td>
                            <td><strong>₹{Number(order.total || 0).toFixed(2)}</strong></td>
                            <td>
                              <span className={`status-pill status-${(order.status || 'processing').toLowerCase()}`}>
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Best Selling Products Portfolio Table */}
              <div className="admin-section-box">
                <div className="section-box-header">
                  <h3 className="section-box-title">Product Portfolio</h3>
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
                        <th>Product Name</th>
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
                            <img
                              src={p.image}
                              alt=""
                              className="table-product-thumb"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setAdminQuickViewProduct(p)}
                              title="Click for Quick View"
                            />
                          </td>
                          <td>
                            <div
                              className="product-table-name-group"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setAdminDetailProduct(p)}
                              title="Click to view in detail"
                            >
                              <strong>{p.name}</strong>
                              <span className="product-table-sub">{p.subtitle}</span>
                            </div>
                          </td>
                          <td>{p.category}</td>
                          <td>{p.volume}</td>
                          <td><strong>₹{(Number(p.price) || 0).toFixed(2)}</strong></td>
                          <td>
                            <span className="admin-badge-tag">{p.badge}</span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                className="admin-action-icon-btn"
                                onClick={() => setAdminQuickViewProduct(p)}
                                title="Quick View (Customer modal preview)"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                className="admin-action-icon-btn"
                                onClick={() => setAdminDetailProduct(p)}
                                title="Open in Detail (Customer page preview)"
                              >
                                <ExternalLink size={14} />
                              </button>
                              <button
                                type="button"
                                className="admin-action-icon-btn"
                                onClick={() => handleOpenEditProduct(p)}
                                title="Edit product"
                              >
                                <Edit2 size={14} />
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
          </div>
        )}

        {/* Tab 2: PRODUCTS & INVENTORY */}
        {activeTab === 'products' && (
          <div className="admin-tab-content animate-fade-in">
            {editorMode && editorProduct ? (
              /* DIRECT IN-PLACE WYSIWYG VISUAL CANVAS EDITOR */
              <div className={`admin-visual-editor-screen animate-fade-in ${canvasMode === 'edit' ? 'edit-mode' : 'preview-mode'}`}>
                {/* 1. Master Sticky Navigation Toolbar */}
                <div className="visual-editor-sticky-toolbar">
                  <div className="visual-toolbar-left">
                    <button
                      type="button"
                      className="visual-toolbar-back-btn"
                      onClick={handleCancelEditor}
                      title="Back to products list"
                    >
                      <ArrowLeft size={15} />
                      <span>Back</span>
                    </button>
                    <div className="visual-toolbar-divider" />
                    <div className="visual-toolbar-info">
                      <span className="visual-toolbar-badge">
                        {editorMode === 'create' ? 'New Product' : 'Editing Product'}
                      </span>
                      <h3 className="visual-toolbar-title" title={editorProduct.name}>
                        {editorProduct.name || 'Untitled Product'}
                      </h3>
                    </div>
                  </div>

                  <div className="visual-toolbar-right">
                    {/* View Mode: Edit vs Preview */}
                    <div className="canvas-mode-toggle" title="Switch between in-place editing and preview">
                      <button
                        type="button"
                        className={`canvas-mode-btn ${canvasMode === 'edit' ? 'active' : ''}`}
                        onClick={() => setCanvasMode('edit')}
                        title="Edit mode"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className={`canvas-mode-btn ${canvasMode === 'preview' ? 'active' : ''}`}
                        onClick={() => setCanvasMode('preview')}
                        title="Customer preview mode"
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                    </div>

                    {/* Language: EN vs தமிழ் */}
                    <div className="canvas-lang-toggle" title="Switch language preview">
                      <button
                        type="button"
                        className={`canvas-lang-btn ${previewLang === 'en' ? 'active' : ''}`}
                        onClick={() => setPreviewLang('en')}
                        title="English"
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        className={`canvas-lang-btn ${previewLang === 'ta' ? 'active' : ''}`}
                        onClick={() => setPreviewLang('ta')}
                        title="தமிழ் (Tamil)"
                      >
                        தமிழ்
                      </button>
                    </div>

                    {/* Instant Tamil Sync */}
                    <button
                      type="button"
                      className="canvas-auto-translate-btn compact"
                      onClick={() => handleAutoTranslateTamil()}
                      disabled={isTranslating}
                      title="Sync English content into Tamil"
                    >
                      <Sparkles size={13} className={isTranslating ? 'animate-spin' : ''} />
                      <span>{isTranslating ? 'Syncing...' : 'Sync'}</span>
                    </button>

                    {/* Compact AI Fill Icon Button */}
                    <button
                      type="button"
                      className={`visual-toolbar-icon-btn ai-btn ${!editorProduct?.name?.trim() ? 'disabled' : 'ready'} ${isAiGenerating ? 'loading' : ''}`}
                      onClick={handleAiAutoFill}
                      disabled={isAiGenerating || !editorProduct?.name?.trim()}
                      title={
                        editorProduct?.name?.trim()
                          ? 'AI Auto-Fill: Automatically write details from product name'
                          : 'Type a product name in the box below to enable AI Auto-Fill'
                      }
                      aria-label="AI Auto-Fill product details"
                    >
                      <Wand2 size={15} className={isAiGenerating ? 'animate-spin' : ''} />
                    </button>

                    {/* Quick Theme Switch Icon Button */}
                    <button
                      type="button"
                      className="visual-toolbar-icon-btn theme-btn"
                      onClick={toggleTheme}
                      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                      aria-label="Toggle admin color theme"
                    >
                      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    </button>

                    {/* Primary Save Action */}
                    <button
                      type="button"
                      className="visual-toolbar-save-btn"
                      onClick={handleSaveProduct}
                      title={editorMode === 'create' ? 'Publish product to store' : 'Save changes to store'}
                    >
                      <Check size={14} />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                {/* Hidden file input for multiple image browsing */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.length > 0) {
                      handleImageFileChange(e.target.files);
                      setShowImageModal(false);
                    }
                  }}
                />


                                {/* Single In-Place Visual Canvas: 100% Exact Product Details Skeleton UI */}
                <div className={`product-detail-screen canvas-single-view ${canvasMode === 'edit' ? 'edit-mode' : 'preview-mode'}`} style={{ padding: '24px 0 60px' }}>
                  <div className="section-container detail-page-container">
                    
                    {/* Clean Breadcrumbs Bar */}
                    <div className="detail-top-nav-bar" style={{ marginBottom: '18px' }}>
                      <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
                        <span className="crumb-link" onClick={handleCancelEditor}>Home</span>
                        <span className="crumb-sep">/</span>
                        <span className="crumb-link" onClick={handleCancelEditor}>Products</span>
                        <span className="crumb-sep">/</span>
                        <span className="crumb-current" style={{ fontWeight: 700, color: '#0f172a' }}>
                          {previewLang === 'ta'
                            ? (editorProduct.name_ta || 'தமிழ் தயாரிப்பு தலைப்பு')
                            : (editorProduct.name || 'Product Title')}
                        </span>
                      </nav>
                    </div>

                    {/* Main Product Showcase Grid */}
                    <div className="detail-main-grid">
                      {/* Left Column: Master Visual Gallery */}
                      <div className="detail-gallery-column">
                        <div className="detail-master-stage" style={{ background: editorProduct.image ? '#ffffff' : '#f8fafc', position: 'relative' }}>
                          {editorProduct.image ? (
                            <div className="detail-image-stage" style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <img
                                src={editorProduct.image}
                                alt={editorProduct.name || 'Product Preview'}
                                className="detail-master-img"
                              />
                              </div>
                          ) : (
                            <div
                              className="canvas-image-empty-dropzone"
                              onClick={() => setShowImageModal(true)}
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                padding: '24px',
                                cursor: 'pointer',
                                border: '2px dashed #94a3b8',
                                borderRadius: '24px',
                                background: '#f8fafc',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                <Camera size={26} />
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1e293b' }}>
                                  + Upload Master Product Photo
                                </strong>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                  Click or drag & drop bottle image here
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Top badges on stage */}
                          <div className="detail-stage-badges" style={{ pointerEvents: 'auto' }}>
                            {canvasMode === 'edit' ? (
                              <input
                                type="text"
                                className="canvas-inline-input detail-stage-badge-pill"
                                style={{
                                  borderColor: editorProduct.color || '#059669',
                                  width: 'auto',
                                  minWidth: '110px',
                                  maxWidth: '170px',
                                }}
                                value={previewLang === 'ta' ? (editorProduct.badge_ta || '') : (editorProduct.badge || '')}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (previewLang === 'ta') {
                                    setEditorProduct((p) => ({ ...p, badge_ta: val, badgeTa: val }))
                                  } else {
                                    setEditorProduct((p) => ({ ...p, badge: val }))
                                  }
                                }}
                                placeholder={previewLang === 'ta' ? 'பேட்ஜ் (உதா: ORGANIC)...' : 'Badge (e.g. ORGANIC)'}
                              />
                            ) : (
                              (previewLang === 'ta' ? (editorProduct.badge_ta || editorProduct.badgeTa) : editorProduct.badge) ? (
                                <span
                                  className="detail-stage-badge-pill"
                                  style={{
                                    borderColor: editorProduct.color || '#059669',
                                    color: editorProduct.color || '#059669',
                                  }}
                                >
                                  {previewLang === 'ta' ? (editorProduct.badge_ta || editorProduct.badgeTa) : editorProduct.badge}
                                </span>
                              ) : null
                            )}

                          </div>

                          {/* Quick Photo Controls in edit mode */}
                          {canvasMode === 'edit' && editorProduct.image && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 12,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '8px',
                                zIndex: 6,
                              }}
                            >
                              <button
                                type="button"
                                className="btn-pill-subtle"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '5px 12px',
                                  background: 'rgba(255, 255, 255, 0.92)',
                                  backdropFilter: 'blur(8px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }}
                                onClick={() => setShowImageModal(true)}
                              >
                                <Camera size={13} style={{ marginRight: 4 }} />
                                Change Photo
                              </button>
                              <button
                                type="button"
                                className="btn-pill-subtle"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '5px 12px',
                                  background: 'rgba(255, 255, 255, 0.92)',
                                  color: '#ef4444',
                                  backdropFilter: 'blur(8px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }}
                                onClick={() => setEditorProduct((p) => ({ ...p, image: '' }))}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Thumbnail Navigation Strip with Left/Right Reordering & Cover Indicator */}
                        <div className="detail-thumbs-strip" style={{ alignItems: 'flex-start', paddingBottom: '6px' }}>
                          {(editorProduct.galleryImages && editorProduct.galleryImages.length > 0
                            ? editorProduct.galleryImages
                            : editorProduct.image
                            ? [editorProduct.image]
                            : []
                          ).map((imgUrl, idx, arr) => {
                            const isMain = idx === 0
                            return (
                              <div
                                key={idx}
                                className={`detail-thumb-item ${draggedThumbIdx === idx ? 'is-dragging' : ''}`}
                                draggable={canvasMode === 'edit'}
                                onDragStart={() => setDraggedThumbIdx(idx)}
                                onDragOver={(e) => { e.preventDefault() }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  if (draggedThumbIdx !== null && draggedThumbIdx !== idx) {
                                    handleMoveGalleryImage(draggedThumbIdx, idx)
                                  }
                                  setDraggedThumbIdx(null)
                                }}
                                onDragEnd={() => setDraggedThumbIdx(null)}
                              >
                                <div style={{ position: 'relative' }}>
                                  <button
                                    type="button"
                                    className={`detail-thumb-btn ${isMain ? 'thumb-card-cover-ring' : ''}`}
                                    onClick={() => setEditorProduct((p) => ({ ...p, image: imgUrl }))}
                                    title={isMain ? 'Main Cover Photo (Index 1)' : `Image ${idx + 1} - Click to preview or use arrows to adjust position`}
                                  >
                                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                                  </button>

                                  {/* Cover Tag on the very first photo */}
                                  {isMain && (
                                    <span className="thumb-cover-tag" title="This 1st photo is always the main card cover">
                                      ★ Cover
                                    </span>
                                  )}

                                  {/* Remove Button in Edit Mode */}
                                  {canvasMode === 'edit' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveGalleryImage(idx)
                                      }}
                                      className="thumb-remove-btn"
                                      title="Remove photo"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>

                                {/* Reorder Controls: Left & Right Arrows in Edit Mode */}
                                {canvasMode === 'edit' && arr.length > 1 && (
                                  <div className="thumb-reorder-bar" title="Adjust position left or right">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleMoveGalleryImage(idx, idx - 1)
                                      }}
                                      className="thumb-nav-arrow-btn"
                                      title={idx === 0 ? 'Already first (Cover)' : 'Move Left (Towards Cover)'}
                                    >
                                      <ChevronLeft size={13} />
                                    </button>

                                    <button
                                      type="button"
                                      disabled={idx === arr.length - 1}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleMoveGalleryImage(idx, idx + 1)
                                      }}
                                      className="thumb-nav-arrow-btn"
                                      title={idx === arr.length - 1 ? 'Already last' : 'Move Right'}
                                    >
                                      <ChevronRight size={13} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {canvasMode === 'edit' && (
                            <button
                              type="button"
                              className="detail-thumb-btn"
                              style={{
                                border: '2px dashed #94a3b8',
                                background: '#f8fafc',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#64748b',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                gap: '2px',
                                height: '64px',
                              }}
                              onClick={() => setShowImageModal(true)}
                              title="Add gallery images"
                            >
                              <Plus size={16} />
                              <span>Add</span>
                            </button>
                          )}
                        </div>

                        {/* Quality Seals Strip (2x2 Grid) */}
                        <div className="detail-seals-grid">
                          {(editorProduct.seals || [{}, {}, {}, {}]).map((seal, idx) => {
                            const IconComponent =
                              idx === 0 ? Leaf : idx === 1 ? ShieldCheck : idx === 2 ? Truck : RotateCcw
                            const defaultTitles = [
                              '100% Natural',
                              'No Preservatives',
                              'Fresh Express',
                              'Satisfaction',
                            ]
                            const defaultDescs = [
                              'Pure Herbal Ingredients',
                              'Zero Artificial Colors',
                              'Direct Farm Shipping',
                              'Guaranteed Quality',
                            ]
                            return (
                              <div key={idx} className="detail-seal-item">
                                <IconComponent size={18} className="text-emerald-500" style={{ flexShrink: 0 }} />
                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '2px' }}>
                                  {canvasMode === 'edit' ? (
                                    <>
                                      <input
                                        type="text"
                                        className="canvas-inline-input"
                                        style={{
                                          fontSize: '0.78rem',
                                          fontWeight: 800,
                                          color: 'var(--color-primary-dark, #1b2d18)',
                                          padding: '2px 4px',
                                          width: '100%',
                                        }}
                                        value={seal?.title || ''}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          setEditorProduct((p) => {
                                            const currentSeals = Array.isArray(p.seals) ? [...p.seals] : [{}, {}, {}, {}]
                                            while (currentSeals.length < 4) currentSeals.push({})
                                            currentSeals[idx] = { ...currentSeals[idx], title: val }
                                            return { ...p, seals: currentSeals }
                                          })
                                        }}
                                        placeholder={defaultTitles[idx]}
                                      />
                                      <input
                                        type="text"
                                        className="canvas-inline-input"
                                        style={{
                                          fontSize: '0.68rem',
                                          color: '#64748b',
                                          padding: '1px 4px',
                                          width: '100%',
                                        }}
                                        value={seal?.desc || ''}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          setEditorProduct((p) => {
                                            const currentSeals = Array.isArray(p.seals) ? [...p.seals] : [{}, {}, {}, {}]
                                            while (currentSeals.length < 4) currentSeals.push({})
                                            currentSeals[idx] = { ...currentSeals[idx], desc: val }
                                            return { ...p, seals: currentSeals }
                                          })
                                        }}
                                        placeholder={defaultDescs[idx]}
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <strong style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary-dark, #1b2d18)' }}>
                                        {seal?.title || defaultTitles[idx]}
                                      </strong>
                                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                        {seal?.desc || defaultDescs[idx]}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Right Column: Information, Pricing, Pack Selector & Actions */}
                      <div className="detail-info-column">
                        {/* Header Block */}
                        <div className="detail-header-block">
                          <div className="detail-category-row">
                            {canvasMode === 'edit' ? (
                              <div className="admin-category-pill-picker">
                                <Tag size={13} className="text-forest" />
                                <select
                                  className="detail-category-select-pill"
                                  value={isCustomCategoryMode ? '__custom__' : (editorProduct.category || '')}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    if (val === '__custom__') {
                                      setIsCustomCategoryMode(true)
                                    } else {
                                      setIsCustomCategoryMode(false)
                                      const matched = categories.find((c) => c.name === val)
                                      setEditorProduct((p) => ({
                                        ...p,
                                        category: val,
                                        category_ta: matched?.name_ta || p.category_ta,
                                        categoryTa: matched?.name_ta || p.categoryTa,
                                      }))
                                    }
                                  }}
                                  title="Select or add category"
                                >
                                  <option value="">-- Select Category --</option>
                                  {categories.map((c) => (
                                    <option key={c.id || c.name} value={c.name}>
                                      {previewLang === 'ta' && c.name_ta ? c.name_ta : c.name}
                                    </option>
                                  ))}
                                  <option value="__custom__">+ Type New Category...</option>
                                </select>

                                {isCustomCategoryMode && (
                                  <input
                                    type="text"
                                    className="canvas-inline-input detail-category-pill custom-cat-active"
                                    style={{ width: 'auto', minWidth: '150px' }}
                                    value={previewLang === 'ta' ? (editorProduct.category_ta || '') : (editorProduct.category || '')}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      if (previewLang === 'ta') {
                                        setEditorProduct((p) => ({ ...p, category_ta: val, categoryTa: val }))
                                      } else {
                                        setEditorProduct((p) => ({ ...p, category: val }))
                                      }
                                    }}
                                    placeholder={previewLang === 'ta' ? 'புதிய வகை பெயர்...' : 'New category name...'}
                                    autoFocus
                                  />
                                )}

                                <button
                                  type="button"
                                  className="btn-quick-manage-cats"
                                  onClick={() => setShowCategoryModal(true)}
                                  title="Manage Categories"
                                >
                                  <Plus size={11} />
                                  <span>Categories</span>
                                </button>
                              </div>
                            ) : (
                              <span className="detail-category-pill">
                                {(previewLang === 'ta' && (editorProduct.category_ta || editorProduct.categoryTa))
                                  ? (editorProduct.category_ta || editorProduct.categoryTa)
                                  : (editorProduct.category || (previewLang === 'ta' ? 'பாரம்பரிய மூலிகை உணவு வகைகள்' : 'Herbal Food Products'))}
                              </span>
                            )}

                            {canvasMode === 'edit' ? (
                              <input
                                type="text"
                                className="canvas-inline-input detail-volume-pill"
                                style={{ width: 'auto', minWidth: '70px', maxWidth: '100px' }}
                                value={editorProduct.volume || ''}
                                onChange={(e) => setEditorProduct((p) => ({ ...p, volume: e.target.value }))}
                                placeholder="250g"
                              />
                            ) : (
                              <span className="detail-volume-pill">{editorProduct.volume || '250g'}</span>
                            )}

                            {canvasMode === 'edit' ? (
                              <div className="detail-stock-badge">
                                <span className="stock-dot"></span>
                                <input
                                  type="text"
                                  className="canvas-inline-input"
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    color: '#065f46',
                                    width: 'auto',
                                    minWidth: '140px',
                                    padding: '2px 4px',
                                  }}
                                  value={editorProduct.stockStatus || ''}
                                  onChange={(e) => setEditorProduct((p) => ({ ...p, stockStatus: e.target.value }))}
                                  placeholder="In Stock • Ships Today"
                                />
                              </div>
                            ) : (
                              <span className="detail-stock-badge">
                                <span className="stock-dot"></span>{' '}
                                {editorProduct.stockStatus || (previewLang === 'ta' ? 'இருப்பில் உள்ளது • இன்றே டெலிவரி' : 'In Stock • Ships Today')}
                              </span>
                            )}
                          </div>

                          {/* AI Auto-Fill Assistant In-Canvas Card */}
                          {canvasMode === 'edit' && (
                            <div
                              className={`canvas-ai-card animate-fade-in ${editorProduct.name?.trim() ? 'active' : 'idle'} ${isAiGenerating ? 'generating' : ''}`}
                            >
                              <div className="canvas-ai-card-content">
                                <div className="canvas-ai-card-top">
                                  <div className="canvas-ai-card-badge">
                                    <Sparkles size={13} className={isAiGenerating ? 'animate-spin' : ''} />
                                    <span>AI Assistant</span>
                                  </div>
                                  <span className="canvas-ai-card-hint">
                                    {editorProduct.name?.trim()
                                      ? 'Ready to polish & fill details. Any fields you already entered will be preserved and refined.'
                                      : 'Type a product name in the box below to enable AI auto-fill.'}
                                  </span>
                                </div>

                                {/* User Context / Notes Input Box */}
                                <div className="canvas-ai-notes-wrap">
                                  <label className="canvas-ai-notes-label">
                                    Notes or specific instructions (optional):
                                  </label>
                                  <textarea
                                    rows={2}
                                    className="canvas-ai-notes-textarea"
                                    placeholder="e.g. Only 2 package options: 250g jar for ₹220 and 500g pouch for ₹400. Grown in Kolli Hills, 100% natural."
                                    value={aiUserNotes}
                                    onChange={(e) => setAiUserNotes(e.target.value)}
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                className={`canvas-ai-fill-btn ${!editorProduct.name?.trim() ? 'disabled-btn' : 'glow-btn'}`}
                                onClick={handleAiAutoFill}
                                disabled={isAiGenerating || !editorProduct.name?.trim()}
                                title={
                                  editorProduct.name?.trim()
                                    ? 'Auto-fill all product details with AI'
                                    : 'Please type a product name in the field below first'
                                }
                              >
                                <Wand2 size={14} className={isAiGenerating ? 'animate-spin' : ''} />
                                <span>{isAiGenerating ? 'Writing...' : 'Auto-Fill'}</span>
                              </button>
                            </div>
                          )}

                          {/* Product Title */}
                          {canvasMode === 'edit' ? (
                            <input
                              type="text"
                              className="canvas-inline-input detail-product-title"
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                marginBottom: '6px',
                                borderBottom: '2px solid transparent',
                              }}
                              value={previewLang === 'ta' ? (editorProduct.name_ta || '') : (editorProduct.name || '')}
                              onChange={(e) => {
                                const val = e.target.value
                                if (previewLang === 'ta') {
                                  setEditorProduct((p) => ({ ...p, name_ta: val, nameTa: val }))
                                } else {
                                  setEditorProduct((p) => ({ ...p, name: val }))
                                }
                              }}
                              placeholder={previewLang === 'ta' ? 'தமிழ் தயாரிப்பு தலைப்பு (உதா: முருங்கை பவுடர்)...' : 'Moringa Powder'}
                            />
                          ) : (
                            <h1 className="detail-product-title" style={{ marginBottom: '6px' }}>
                              {(previewLang === 'ta' && (editorProduct.name_ta || editorProduct.nameTa))
                                ? (editorProduct.name_ta || editorProduct.nameTa)
                                : (editorProduct.name || 'Herbal Product')}
                            </h1>
                          )}

                          {/* Product Subtitle */}
                          {canvasMode === 'edit' ? (
                            <input
                              type="text"
                              className="canvas-inline-input detail-product-subtitle"
                              style={{
                                width: '100%',
                                padding: '3px 6px',
                                marginBottom: '12px',
                              }}
                              value={previewLang === 'ta' ? (editorProduct.subtitle_ta || '') : (editorProduct.subtitle || '')}
                              onChange={(e) => {
                                const val = e.target.value
                                if (previewLang === 'ta') {
                                  setEditorProduct((p) => ({ ...p, subtitle_ta: val, subtitleTa: val }))
                                } else {
                                  setEditorProduct((p) => ({ ...p, subtitle: val }))
                                }
                              }}
                              placeholder={previewLang === 'ta' ? 'சுருக்கமான விவரிப்பு அல்லது நன்மைகள்...' : 'nice powers description text is typed here'}
                            />
                          ) : (
                            <p className="detail-product-subtitle" style={{ marginBottom: '12px' }}>
                              {(previewLang === 'ta' && (editorProduct.subtitle_ta || editorProduct.subtitleTa))
                                ? (editorProduct.subtitle_ta || editorProduct.subtitleTa)
                                : (editorProduct.subtitle || '')}
                            </p>
                          )}

                          {/* Ratings Row — strictly non-editable, coming directly from customer feedback */}
                          <div className="detail-ratings-row">
                            <div className="detail-stars-group">
                              {[...Array(5)].map((_, i) => {
                                const avg = Number(editorProduct.rating) || 5.0
                                return (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={i < Math.round(avg) ? 'star-filled' : 'star-empty'}
                                    fill={i < Math.round(avg) ? 'currentColor' : 'none'}
                                  />
                                )
                              })}
                            </div>
                            <strong className="detail-score">
                              {(Number(editorProduct.rating) || 5.0).toFixed(1)}
                            </strong>
                            <span className="detail-review-count">
                              ({editorProduct.reviewsCount || 0} customer reviews)
                            </span>
                            <span
                              className="admin-readonly-badge"
                              style={{
                                fontSize: '0.72rem',
                                color: '#059669',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                marginLeft: '8px',
                                fontWeight: 600,
                              }}
                              title="Ratings and reviews are submitted by real customers and cannot be created or edited by store admin."
                            >
                              Customer Feedback (Non-editable)
                            </span>
                          </div>
                        </div>

                        {/* Price Row */}
                        <div className="detail-price-card">
                          <div className="detail-price-main">
                            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark, #1b2d18)' }}>₹</span>
                            {canvasMode === 'edit' ? (
                              <input
                                type="number"
                                step="0.01"
                                className="canvas-inline-input detail-curr-price"
                                style={{
                                  width: '100px',
                                  padding: '2px 6px',
                                }}
                                value={editorProduct.price || ''}
                                onChange={(e) => setEditorProduct((p) => ({ ...p, price: e.target.value }))}
                                placeholder="3.99"
                              />
                            ) : (
                              <span className="detail-curr-price">{Number(editorProduct.price || 0).toFixed(2)}</span>
                            )}
                            {canvasMode === 'edit' ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '1.05rem', textDecoration: 'line-through' }}>₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="canvas-inline-input detail-orig-price"
                                  style={{
                                    width: '80px',
                                    padding: '2px 4px',
                                    textDecoration: 'line-through',
                                  }}
                                  value={editorProduct.originalPrice || ''}
                                  onChange={(e) => setEditorProduct((p) => ({ ...p, originalPrice: e.target.value }))}
                                  placeholder="Orig ₹"
                                />
                              </div>
                            ) : (
                              editorProduct.originalPrice && (
                                <span className="detail-orig-price">₹{Number(editorProduct.originalPrice).toFixed(2)}</span>
                              )
                            )}
                            <span className="detail-per-unit">/ unit</span>
                          </div>

                          {/* Active Option savings pill if available */}
                          {(() => {
                            const optsList = Array.isArray(editorProduct.quantityOptions)
                              ? editorProduct.quantityOptions
                              : []
                            const currentActive = optsList.find((o) => o.id === selectedPackOption) || optsList[0] || null
                            return currentActive?.discountText ? (
                              <span className="detail-bulk-save-badge">
                                {currentActive.discountText}
                              </span>
                            ) : null
                          })()}
                        </div>

                        {/* Pack Size Selection */}
                        <div className="detail-pack-selector-section">
                          {(() => {
                            const optsList = Array.isArray(editorProduct.quantityOptions)
                              ? editorProduct.quantityOptions
                              : []
                            const currentActive = optsList.find((o) => o.id === selectedPackOption) || optsList[0] || null

                            if (canvasMode === 'preview' && optsList.length === 0) {
                              return null
                            }

                            return (
                              <>
                                <div className="detail-pack-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                  <span className="detail-section-label">
                                    {optsList.length === 0 ? 'QUANTITY OPTIONS (0 CONFIGURED - DIRECT PURCHASE):' : 'SELECT QUANTITY OPTION:'}
                                  </span>
                                  {canvasMode === 'edit' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button
                                        type="button"
                                        onClick={handleAutoRecalculateDiscounts}
                                        className="pack-quick-action-btn"
                                        title="Auto-calculate bulk packs with 10% and 15% discount based on base price"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '0.72rem',
                                          padding: '3px 8px',
                                          borderRadius: '9999px',
                                          background: '#f0fdf4',
                                          border: '1px solid #bbf7d0',
                                          color: '#166534',
                                          cursor: 'pointer',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Sparkles size={11} />
                                        <span>Auto Bulk (6 & 12)</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleResetGramPacks}
                                        className="pack-quick-action-btn"
                                        title="Preset weights for herbal powders (100g, 250g, 500g)"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '0.72rem',
                                          padding: '3px 8px',
                                          borderRadius: '9999px',
                                          background: '#ecfdf5',
                                          border: '1px solid #a7f3d0',
                                          color: '#065f46',
                                          cursor: 'pointer',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Leaf size={11} />
                                        <span>Grams Preset</span>
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="detail-pack-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                                  {optsList.map((opt, idx) => {
                                    const isSelected = (currentActive?.id === opt.id)
                                    return (
                                      <div
                                        key={opt.id || idx}
                                        className={`detail-pack-card ${isSelected ? 'active' : ''} ${canvasMode === 'edit' ? 'pack-card-editable' : ''}`}
                                        onClick={() => setSelectedPackOption(opt.id)}
                                        style={{ position: 'relative', cursor: 'pointer' }}
                                      >
                                        {/* Delete Option (can delete down to 0 options!) */}
                                        {canvasMode === 'edit' && (
                                          <button
                                            type="button"
                                            className="pack-card-remove-btn"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleRemoveOption(idx)
                                            }}
                                            title="Delete this option"
                                            style={{
                                              position: 'absolute',
                                              top: '4px',
                                              right: '4px',
                                              width: '18px',
                                              height: '18px',
                                              borderRadius: '50%',
                                              background: '#fee2e2',
                                              color: '#ef4444',
                                              border: 'none',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              cursor: 'pointer',
                                              fontSize: '12px',
                                              lineHeight: 1,
                                              zIndex: 3,
                                            }}
                                          >
                                            ×
                                          </button>
                                        )}

                                        {/* Badge Display or Inline Edit */}
                                        {canvasMode === 'edit' ? (
                                          <div style={{ width: '100%', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                                            <input
                                              type="text"
                                              className="canvas-inline-input"
                                              value={opt.badge || ''}
                                              onChange={(e) => handleOptionChange(idx, 'badge', e.target.value)}
                                              placeholder="+ Badge (e.g. POPULAR)"
                                              title="Optional badge text, e.g. POPULAR or BEST VALUE"
                                              style={{
                                                fontSize: '0.62rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                padding: '2px 6px',
                                                borderRadius: '9999px',
                                                textAlign: 'center',
                                                background: opt.badge ? (opt.badge.toLowerCase().includes('value') ? '#d97706' : '#059669') : '#f1f5f9',
                                                color: opt.badge ? '#ffffff' : '#64748b',
                                                border: '1px dashed rgba(0,0,0,0.1)',
                                                maxWidth: '110px',
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                        ) : (
                                          opt.badge && (
                                            <span className={`pack-badge ${opt.badge.toLowerCase().includes('value') ? 'bulk' : ''}`}>
                                              {opt.badge}
                                            </span>
                                          )
                                        )}

                                        {/* Title Row */}
                                        <div className="pack-card-left" style={{ width: '100%', alignItems: 'center' }}>
                                          {canvasMode === 'edit' ? (
                                            <input
                                              type="text"
                                              className="canvas-inline-input pack-title-input"
                                              value={opt.title || ''}
                                              onChange={(e) => handleOptionChange(idx, 'title', e.target.value)}
                                              placeholder="Option Title"
                                              title="Option title, e.g. Single Item, Pack of 6, 100g Pouch"
                                              style={{
                                                fontWeight: 800,
                                                fontSize: '0.86rem',
                                                textAlign: 'center',
                                                width: '100%',
                                                padding: '1px 4px',
                                                color: 'var(--color-primary-dark, #1b2d18)',
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          ) : (
                                            <span className="pack-title">{opt.title}</span>
                                          )}

                                          {/* Subtitle / Volume / Discount */}
                                          {canvasMode === 'edit' ? (
                                            <input
                                              type="text"
                                              className="canvas-inline-input pack-desc-input"
                                              value={opt.size ?? opt.discountText ?? ''}
                                              onChange={(e) => {
                                                handleOptionChange(idx, 'size', e.target.value)
                                                handleOptionChange(idx, 'discountText', e.target.value)
                                              }}
                                              placeholder="Weight/Savings (e.g. 250g)"
                                              title="Weight, size, or savings, e.g. 250g or Save 10%"
                                              style={{
                                                fontSize: '0.72rem',
                                                color: '#64748b',
                                                textAlign: 'center',
                                                width: '100%',
                                                padding: '1px 4px',
                                                marginTop: '2px',
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          ) : (
                                            <span className="pack-desc">{opt.size || opt.discountText}</span>
                                          )}
                                        </div>

                                        {/* Price */}
                                        <div className="pack-card-right" style={{ marginTop: '4px' }}>
                                          {canvasMode === 'edit' ? (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                                              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-primary-dark, #1b2d18)' }}>₹</span>
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="canvas-inline-input"
                                                value={opt.price ?? ''}
                                                onChange={(e) => handleOptionChange(idx, 'price', e.target.value)}
                                                placeholder="0.00"
                                                title="Price for this quantity option"
                                                style={{
                                                  width: '64px',
                                                  fontWeight: 800,
                                                  fontSize: '0.92rem',
                                                  textAlign: 'center',
                                                  padding: '2px 4px',
                                                  color: 'var(--color-primary-dark, #1b2d18)',
                                                }}
                                              />
                                            </div>
                                          ) : (
                                            <strong className="pack-price">
                                              ₹{Number(opt.price || 0).toFixed(2)}
                                            </strong>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}

                                {optsList.length === 0 && canvasMode === 'edit' && (
                                  <div
                                    style={{
                                      gridColumn: '1 / -1',
                                      padding: '14px 16px',
                                      borderRadius: '12px',
                                      background: '#f8fafc',
                                      border: '1px dashed #cbd5e1',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '12px',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                                      <strong style={{ color: '#0f172a' }}>0 Quantity Options Configured:</strong> Customers will directly choose any quantity using the stepper at the unit price (₹{Number(editorProduct.price || 0).toFixed(2)}).
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleAddOption}
                                      className="btn-pill-secondary"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.78rem',
                                        padding: '5px 12px',
                                        fontWeight: 700,
                                        color: '#059669',
                                        borderColor: '#a7f3d0',
                                        background: '#ecfdf5',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <Plus size={14} />
                                      <span>+ Add Option</span>
                                    </button>
                                  </div>
                                )}

                                {/* Inline Add Option Card in Edit Mode */}
                                {canvasMode === 'edit' && optsList.length > 0 && (
                                  <button
                                    type="button"
                                    className="detail-pack-card detail-pack-add-card"
                                    onClick={handleAddOption}
                                    title="Add new pack size or quantity option"
                                    style={{
                                      border: '2px dashed #10b981',
                                      background: '#f0fdf4',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      minHeight: '85px',
                                      color: '#059669',
                                      gap: '4px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Plus size={20} />
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>+ Add Option</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )
                        })()}
                      </div>

                      {/* Stepper & Add to Bag CTA */}
                      <div className="detail-action-group">
                        <div className="stepper-pill detail-stepper">
                          <button
                            type="button"
                            className="stepper-btn"
                            aria-label="Decrease quantity"
                            onClick={() => setPreviewQty((q) => Math.max(1, q - 1))}
                          >
                            <Minus size={15} />
                          </button>
                          <span className="stepper-value">
                            {String(previewQty).padStart(2, '0')}
                          </span>
                          <button
                            type="button"
                            className="stepper-btn"
                            aria-label="Increase quantity"
                            onClick={() => setPreviewQty((q) => q + 1)}
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn-pill-primary detail-add-btn"
                          style={{ cursor: 'pointer' }}
                        >
                          <ShoppingBag size={18} />
                          <span>
                            {(() => {
                              const optsList = Array.isArray(editorProduct.quantityOptions)
                                ? editorProduct.quantityOptions
                                : []
                              const currentActive = optsList.find((o) => o.id === selectedPackOption) || optsList[0] || null
                              const unitPrice = currentActive ? Number(currentActive.price || 0) : Number(editorProduct.price || 0)
                              const totalVal = (unitPrice * previewQty).toFixed(2)
                              return `Add to Bag — ₹${totalVal}`
                            })()}
                          </span>
                        </button>
                      </div>

                        {/* Fast Features Highlights */}
                        <div className="detail-key-highlights" style={{ alignItems: 'center' }}>
                          {(editorProduct.highlights || []).map((hl, idx) => (
                            <div key={idx} className="highlight-pill" style={{ position: 'relative' }}>
                              <CheckCircle2 size={14} className="text-emerald-600" />
                              <span>{hl}</span>
                              {canvasMode === 'edit' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditorProduct((p) => ({
                                      ...p,
                                      highlights: (p.highlights || []).filter((_, i) => i !== idx),
                                    }))
                                  }
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    lineHeight: 1,
                                    padding: '0 0 0 4px',
                                  }}
                                  title="Remove highlight"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}

                          {canvasMode === 'edit' && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#f8fafc',
                                border: '1.5px dashed rgba(16, 185, 129, 0.5)',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                              }}
                            >
                              <Plus size={13} className="text-emerald-600" />
                              <input
                                type="text"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  outline: 'none',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color: '#334155',
                                  width: '160px',
                                }}
                                value={newHighlight}
                                onChange={(e) => setNewHighlight(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newHighlight.trim()) {
                                    e.preventDefault()
                                    setEditorProduct((p) => ({
                                      ...p,
                                      highlights: [...(p.highlights || []), newHighlight.trim()],
                                    }))
                                    setNewHighlight('')
                                  }
                                }}
                                placeholder="+ Add highlight (Enter)..."
                              />
                              {newHighlight.trim() && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditorProduct((p) => ({
                                      ...p,
                                      highlights: [...(p.highlights || []), newHighlight.trim()],
                                    }))
                                    setNewHighlight('')
                                  }}
                                  style={{
                                    border: 'none',
                                    background: '#059669',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    width: 18,
                                    height: 18,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Informational Tabs (Overview, Nutrition, Ingredients, How to Use) */}
                        <div className="detail-tabs-wrapper">
                          <div className="detail-tabs-header">
                            <button
                              type="button"
                              className={`detail-tab-btn ${detailsTab === 'overview' ? 'active' : ''}`}
                              onClick={() => setDetailsTab('overview')}
                            >
                              Overview & Taste
                            </button>
                            <button
                              type="button"
                              className={`detail-tab-btn ${detailsTab === 'nutrition' ? 'active' : ''}`}
                              onClick={() => setDetailsTab('nutrition')}
                            >
                              Nutrition Facts
                            </button>
                            <button
                              type="button"
                              className={`detail-tab-btn ${detailsTab === 'ingredients' ? 'active' : ''}`}
                              onClick={() => setDetailsTab('ingredients')}
                            >
                              Pure Ingredients
                            </button>
                            <button
                              type="button"
                              className={`detail-tab-btn ${detailsTab === 'how-to-use' ? 'active' : ''}`}
                              onClick={() => setDetailsTab('how-to-use')}
                            >
                              How to Use
                            </button>
                          </div>

                          <div className="detail-tab-body">
                            {/* Tab 1: Overview & Taste */}
                            {detailsTab === 'overview' && (
                              <div className="detail-tab-content animate-fade-in">
                                {canvasMode === 'edit' ? (
                                  <textarea
                                    rows={3}
                                    className="canvas-inline-textarea detail-long-desc"
                                    style={{ width: '100%', resize: 'vertical' }}
                                    value={previewLang === 'ta' ? (editorProduct.description_ta || '') : (editorProduct.description || '')}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      if (previewLang === 'ta') {
                                        setEditorProduct((p) => ({ ...p, description_ta: val, descriptionTa: val }))
                                      } else {
                                        setEditorProduct((p) => ({ ...p, description: val }))
                                      }
                                    }}
                                    placeholder={
                                      previewLang === 'ta'
                                        ? 'தயாரிப்பு பற்றிய முழுமையான விவரங்கள் மற்றும் மருத்துவ நன்மைகள்...'
                                        : 'Detailed product description, heritage, flavor notes, and health advantages...'
                                    }
                                  />
                                ) : (
                                  <p className="detail-long-desc" style={{ whiteSpace: 'pre-line' }}>
                                    {previewLang === 'ta'
                                      ? (editorProduct.description_ta || editorProduct.description || 'பாரம்பரிய முறைப்படி தயாரிக்கப்பட்ட இயற்கையான மூலிகை உணவு தயாரிப்பு.')
                                      : (editorProduct.description || 'Natural herbal food product crafted with traditional methods for everyday wellness.')}
                                  </p>
                                )}

                                <div className="detail-notes-block">
                                  <h4 className="detail-block-title">
                                    <Sparkles size={14} /> Tasting Notes & Sensory Profile
                                  </h4>
                                  <div className="tasting-notes-pills" style={{ alignItems: 'center' }}>
                                    {(editorProduct.tastingNotes || []).map((note, idx) => (
                                      <span key={idx} className="tasting-note-tag" style={{ position: 'relative' }}>
                                        {note}
                                        {canvasMode === 'edit' && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditorProduct((p) => ({
                                                ...p,
                                                tastingNotes: (p.tastingNotes || []).filter((_, i) => i !== idx),
                                              }))
                                            }
                                            style={{
                                              border: 'none',
                                              background: 'transparent',
                                              color: '#94a3b8',
                                              cursor: 'pointer',
                                              fontSize: '13px',
                                              lineHeight: 1,
                                              padding: '0 0 0 5px',
                                            }}
                                            title="Remove note"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </span>
                                    ))}

                                    {canvasMode === 'edit' && (
                                      <div
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          background: '#f8fafc',
                                          border: '1.5px dashed rgba(16, 185, 129, 0.45)',
                                          padding: '3px 8px',
                                          borderRadius: '9999px',
                                        }}
                                      >
                                        <Plus size={12} className="text-emerald-600" />
                                        <input
                                          type="text"
                                          style={{
                                            border: 'none',
                                            background: 'transparent',
                                            outline: 'none',
                                            fontSize: '0.78rem',
                                            color: '#334155',
                                            width: '130px',
                                          }}
                                          value={newTastingNote}
                                          onChange={(e) => setNewTastingNote(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newTastingNote.trim()) {
                                              e.preventDefault()
                                              setEditorProduct((p) => ({
                                                ...p,
                                                tastingNotes: [...(p.tastingNotes || []), newTastingNote.trim()],
                                              }))
                                              setNewTastingNote('')
                                            }
                                          }}
                                          placeholder="+ Add note (Enter)..."
                                        />
                                        {newTastingNote.trim() && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditorProduct((p) => ({
                                                ...p,
                                                tastingNotes: [...(p.tastingNotes || []), newTastingNote.trim()],
                                              }))
                                              setNewTastingNote('')
                                            }}
                                            style={{
                                              border: 'none',
                                              background: '#059669',
                                              color: '#fff',
                                              borderRadius: '50%',
                                              width: 16,
                                              height: 16,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: '10px',
                                              cursor: 'pointer',
                                            }}
                                          >
                                            ✓
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tab 2: Nutrition Facts */}
                            {detailsTab === 'nutrition' && (
                              <div className="detail-tab-content animate-fade-in">
                                <div className="detail-nutri-grid">
                                  <div className="nutri-stat-card">
                                    <span className="stat-label">Calories</span>
                                    {canvasMode === 'edit' ? (
                                      <input
                                        type="text"
                                        className="canvas-inline-input stat-val"
                                        value={editorProduct.calories || ''}
                                        onChange={(e) => setEditorProduct((p) => ({ ...p, calories: e.target.value }))}
                                        placeholder="90 kcal"
                                      />
                                    ) : (
                                      <span className="stat-val">{editorProduct.calories || '90 kcal'}</span>
                                    )}
                                  </div>
                                  <div className="nutri-stat-card">
                                    <span className="stat-label">Natural Sugars</span>
                                    {canvasMode === 'edit' ? (
                                      <input
                                        type="text"
                                        className="canvas-inline-input stat-val"
                                        value={editorProduct.sugar || ''}
                                        onChange={(e) => setEditorProduct((p) => ({ ...p, sugar: e.target.value }))}
                                        placeholder="10g"
                                      />
                                    ) : (
                                      <span className="stat-val">{editorProduct.sugar || '10g'}</span>
                                    )}
                                  </div>
                                  <div className="nutri-stat-card">
                                    <span className="stat-label">Carbohydrates</span>
                                    {canvasMode === 'edit' ? (
                                      <input
                                        type="text"
                                        className="canvas-inline-input stat-val"
                                        value={editorProduct.carbs || ''}
                                        onChange={(e) => setEditorProduct((p) => ({ ...p, carbs: e.target.value }))}
                                        placeholder="20g"
                                      />
                                    ) : (
                                      <span className="stat-val">{editorProduct.carbs || '20g'}</span>
                                    )}
                                  </div>
                                  <div className="nutri-stat-card">
                                    <span className="stat-label">Vitamin C</span>
                                    {canvasMode === 'edit' ? (
                                      <input
                                        type="text"
                                        className="canvas-inline-input stat-val"
                                        value={editorProduct.vitaminC || ''}
                                        onChange={(e) => setEditorProduct((p) => ({ ...p, vitaminC: e.target.value }))}
                                        placeholder="100% DV"
                                      />
                                    ) : (
                                      <span className="stat-val">{editorProduct.vitaminC || '100% DV'}</span>
                                    )}
                                  </div>
                                  <div className="nutri-stat-card">
                                    <span className="stat-label">Organic Certified</span>
                                    {canvasMode === 'edit' ? (
                                      <input
                                        type="text"
                                        className="canvas-inline-input stat-val"
                                        value={editorProduct.organic || ''}
                                        onChange={(e) => setEditorProduct((p) => ({ ...p, organic: e.target.value }))}
                                        placeholder="100%"
                                      />
                                    ) : (
                                      <span className="stat-val">{editorProduct.organic || '100%'}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tab 3: Pure Ingredients */}
                            {detailsTab === 'ingredients' && (
                              <div className="detail-tab-content animate-fade-in">
                                <ul className="detail-ingredients-list">
                                  {(editorProduct.ingredients || []).map((item, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Check size={15} className="text-emerald-600" style={{ flexShrink: 0 }} />
                                      <span style={{ flex: 1 }}>{item}</span>
                                      {canvasMode === 'edit' && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditorProduct((p) => ({
                                              ...p,
                                              ingredients: (p.ingredients || []).filter((_, i) => i !== idx),
                                            }))
                                          }
                                          style={{
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                          }}
                                          title="Remove ingredient"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </li>
                                  ))}
                                </ul>

                                {canvasMode === 'edit' && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      marginBottom: '14px',
                                    }}
                                  >
                                    <input
                                      type="text"
                                      className="canvas-inline-input"
                                      style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        fontSize: '0.88rem',
                                      }}
                                      value={newIngredient}
                                      onChange={(e) => setNewIngredient(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newIngredient.trim()) {
                                          e.preventDefault()
                                          setEditorProduct((p) => ({
                                            ...p,
                                            ingredients: [...(p.ingredients || []), newIngredient.trim()],
                                          }))
                                          setNewIngredient('')
                                        }
                                      }}
                                      placeholder="+ Add botanical ingredient (e.g. Farm-fresh Moringa Leaves, press Enter)..."
                                    />
                                    {newIngredient.trim() && (
                                      <button
                                        type="button"
                                        className="btn-pill-primary"
                                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                                        onClick={() => {
                                          setEditorProduct((p) => ({
                                            ...p,
                                            ingredients: [...(p.ingredients || []), newIngredient.trim()],
                                          }))
                                          setNewIngredient('')
                                        }}
                                      >
                                        Add
                                      </button>
                                    )}
                                  </div>
                                )}

                                <p className="detail-disclaimer-note">
                                  Produced under strict quality and hygiene standards. Free of preservatives, artificial fillers, artificial flavoring, or synthetic colors.
                                </p>
                              </div>
                            )}

                            {/* Tab 4: How to Use */}
                            {detailsTab === 'how-to-use' && (
                              <div className="detail-tab-content animate-fade-in">
                                <div className="how-to-use-grid">
                                  {/* Step 1: Prep */}
                                  <div className="how-to-step">
                                    <div className="step-icon-wrapper">
                                      <Droplets size={24} className="text-emerald-600" />
                                    </div>
                                    <div className="step-content" style={{ width: '100%' }}>
                                      {canvasMode === 'edit' ? (
                                        <>
                                          <input
                                            type="text"
                                            className="canvas-inline-input step-title"
                                            style={{ width: '100%', marginBottom: '4px' }}
                                            value={editorProduct.prepTitle || ''}
                                            onChange={(e) => setEditorProduct((p) => ({ ...p, prepTitle: e.target.value }))}
                                            placeholder="1. Prep"
                                          />
                                          <textarea
                                            rows={2}
                                            className="canvas-inline-textarea step-desc"
                                            style={{ width: '100%', resize: 'none' }}
                                            value={editorProduct.prepStep || ''}
                                            onChange={(e) => setEditorProduct((p) => ({ ...p, prepStep: e.target.value }))}
                                            placeholder="Mix 1-2 scoops of the herbal blend with warm water."
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <h4 className="step-title" style={{ marginBottom: '4px' }}>
                                            {editorProduct.prepTitle || '1. Prep'}
                                          </h4>
                                          <p className="step-desc">
                                            {editorProduct.prepStep || 'Mix 1-2 scoops of the herbal blend with warm water.'}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Step 2: Blend */}
                                  <div className="how-to-step">
                                    <div className="step-icon-wrapper">
                                      <Zap size={24} className="text-emerald-600" />
                                    </div>
                                    <div className="step-content" style={{ width: '100%' }}>
                                      {canvasMode === 'edit' ? (
                                        <>
                                          <input
                                            type="text"
                                            className="canvas-inline-input step-title"
                                            style={{ width: '100%', marginBottom: '4px' }}
                                            value={editorProduct.blendTitle || ''}
                                            onChange={(e) => setEditorProduct((p) => ({ ...p, blendTitle: e.target.value }))}
                                            placeholder="2. Blend"
                                          />
                                          <textarea
                                            rows={2}
                                            className="canvas-inline-textarea step-desc"
                                            style={{ width: '100%', resize: 'none' }}
                                            value={editorProduct.blendStep || ''}
                                            onChange={(e) => setEditorProduct((p) => ({ ...p, blendStep: e.target.value }))}
                                            placeholder="Stir thoroughly until completely dissolved for a smooth texture."
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <h4 className="step-title" style={{ marginBottom: '4px' }}>
                                            {editorProduct.blendTitle || '2. Blend'}
                                          </h4>
                                          <p className="step-desc">
                                            {editorProduct.blendStep || 'Stir thoroughly until completely dissolved for a smooth texture.'}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Step 3: Enjoy */}
                                  <div className="how-to-step">
                                    <div className="step-icon-wrapper">
                                      <Sparkles size={24} className="text-emerald-600" />
                                    </div>
                                    <div className="step-content" style={{ width: '100%' }}>
                                      {canvasMode === 'edit' ? (
                                        <>
                                          <input
                                            type="text"
                                            className="canvas-inline-input step-title"
                                            style={{ width: '100%', marginBottom: '4px' }}
                                            value={editorProduct.enjoyTitle || ''}
                                            onChange={(e) => setEditorProduct((p) => ({ ...p, enjoyTitle: e.target.value }))}
                                            placeholder="3. Enjoy"
                                          />
                                          <textarea
                                            rows={2}
                                            className="canvas-inline-textarea step-desc"
                                            style={{ width: '100%', resize: 'none' }}
                                            value={editorProduct.enjoyStep || ''}
                                            onChange={(e) => setEditorProduct((p) => ({ ...p, enjoyStep: e.target.value }))}
                                            placeholder="Consume daily for optimal natural nourishment and vitality."
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <h4 className="step-title" style={{ marginBottom: '4px' }}>
                                            {editorProduct.enjoyTitle || '3. Enjoy'}
                                          </h4>
                                          <p className="step-desc">
                                            {editorProduct.enjoyStep || 'Consume daily for optimal natural nourishment and vitality.'}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Dedicated Multi-Photo Gallery Modal */}
                {showImageModal && (
                  <div className="canvas-image-picker-modal" onClick={() => setShowImageModal(false)}>
                    <div className="canvas-image-picker-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Camera size={18} color="#059669" />
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Manage Product Photos & Gallery</h3>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Upload multiple photos for angles, packaging, and labels</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setShowImageModal(false)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Multi-Dropzone Area */}
                      <div
                        className={`canvas-modal-dropzone ${isDropzoneDragging ? 'is-dragging' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDropzoneDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDropzoneDragging(false); }}
                        onDrop={handleImageDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="canvas-dropzone-icon-wrap" style={{ margin: '0 auto 10px auto' }}>
                          <Upload size={22} />
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-heading)' }}>
                          Click or Drag Multiple Images to Upload
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 12px 0' }}>
                          Select multiple files at once • Auto-compressed to lossless WebP
                        </p>
                        <button
                          type="button"
                          className="btn-pill-primary"
                          style={{ padding: '7px 18px', fontSize: '0.82rem' }}
                        >
                          Browse Multiple Photos
                        </button>
                      </div>

                      {/* Existing Photos Grid in Modal */}
                      {Array.isArray(editorProduct.galleryImages) && editorProduct.galleryImages.length > 0 && (
                        <div style={{ marginBottom: '18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                              Current Gallery ({editorProduct.galleryImages.length} images)
                            </span>
                            <button
                              type="button"
                              className="btn-pill-sm-danger"
                              style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                              onClick={() => {
                                setEditorProduct((p) => ({ ...p, image: '', galleryImages: [], galleryImagesText: '' }));
                                setCustomImageUrl('');
                              }}
                            >
                              Clear All Photos
                            </button>
                          </div>

                          <div className="canvas-modal-gallery-grid">
                            {editorProduct.galleryImages.map((imgUrl, idx, arr) => {
                              const isMain = idx === 0;
                              return (
                                <div key={idx} className={`canvas-modal-gallery-card ${isMain ? 'is-cover' : ''}`}>
                                  <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="canvas-modal-gallery-img" />
                                  <div className="canvas-modal-thumb-actions">
                                    <button
                                      type="button"
                                      className={`canvas-make-cover-btn ${isMain ? 'active' : ''}`}
                                      onClick={() => handleMoveGalleryImage(idx, 0)}
                                      title={isMain ? 'Currently the main cover' : 'Move to Position 1 to make Cover'}
                                    >
                                      {isMain ? '★ Cover' : 'Make Cover'}
                                    </button>

                                    {arr.length > 1 && (
                                      <div style={{ display: 'flex', gap: '3px' }}>
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={() => handleMoveGalleryImage(idx, idx - 1)}
                                          style={{
                                            border: 'none',
                                            background: idx === 0 ? '#f8fafc' : '#f1f5f9',
                                            color: idx === 0 ? '#cbd5e1' : '#334155',
                                            borderRadius: '4px',
                                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                            padding: '3px 5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                          }}
                                          title="Move Left"
                                        >
                                          <ChevronLeft size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === arr.length - 1}
                                          onClick={() => handleMoveGalleryImage(idx, idx + 1)}
                                          style={{
                                            border: 'none',
                                            background: idx === arr.length - 1 ? '#f8fafc' : '#f1f5f9',
                                            color: idx === arr.length - 1 ? '#cbd5e1' : '#334155',
                                            borderRadius: '4px',
                                            cursor: idx === arr.length - 1 ? 'not-allowed' : 'pointer',
                                            padding: '3px 5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                          }}
                                          title="Move Right"
                                        >
                                          <ChevronRight size={13} />
                                        </button>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGalleryImage(idx)}
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                      title="Remove"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* URL input fallback: Multiple URLs accepted */}
                      <div style={{ paddingTop: '14px', borderTop: '1px solid var(--admin-border-subtle)' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                          Or Paste Direct Image URLs (one per line or comma-separated):
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <textarea
                            rows={2}
                            className="input-textarea font-mono"
                            style={{ flex: 1, fontSize: '0.8rem', resize: 'vertical' }}
                            placeholder="https://example.com/bottle-front.webp&#10;https://example.com/bottle-back.webp"
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-pill-primary"
                            style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.8rem' }}
                            onClick={() => {
                              if (customImageUrl.trim()) {
                                const urls = customImageUrl.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
                                setEditorProduct((p) => {
                                  const existingG = Array.isArray(p.galleryImages) ? p.galleryImages : (p.image ? [p.image] : []);
                                  const combined = [...existingG, ...urls];
                                  return {
                                    ...p,
                                    image: p.image || combined[0] || '',
                                    galleryImages: combined,
                                    galleryImagesText: combined.join('\n'),
                                  };
                                });
                                setCustomImageUrl('');
                              }
                            }}
                          >
                            + Add URLs
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-pill-primary"
                          style={{ padding: '8px 24px', fontSize: '0.84rem' }}
                          onClick={() => setShowImageModal(false)}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

                  <div className="admin-action-bar-right">
                    <button
                      type="button"
                      className="btn-pill-outline admin-secondary-btn"
                      onClick={() => setShowCategoryModal(true)}
                      title="Manage product categories"
                    >
                      <Tag size={15} />
                      <span>Manage Categories</span>
                    </button>

                    <button
                      type="button"
                      className="btn-pill-primary admin-primary-btn"
                      onClick={handleOpenCreateProduct}
                    >
                      <Plus size={16} />
                      <span>Add New Product</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills on Products Table */}
                <div className="admin-category-filter-strip">
                  {['All', ...categories.map((c) => c.name)].map((catName) => (
                    <button
                      key={catName}
                      type="button"
                      className={`admin-filter-pill ${selectedCategoryFilter === catName ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryFilter(catName)}
                    >
                      {catName}
                      {catName !== 'All' && (
                        <span className="cat-pill-count">
                          {products.filter((p) => p.category?.toLowerCase() === catName.toLowerCase()).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Products Table */}
                <div className="admin-section-box">
                  <div className="admin-table-responsive">
                    <table className="admin-table admin-table-full-products">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Product Name</th>
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
                              <img
                                src={p.image}
                                alt=""
                                className="table-product-thumb"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setAdminQuickViewProduct(p)}
                                title="Click for Quick View"
                              />
                            </td>
                            <td>
                              <div
                                className="product-table-name-group"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setAdminDetailProduct(p)}
                                title="Click to view in detail"
                              >
                                <strong>{p.name}</strong>
                                <span className="product-table-sub">{p.subtitle}</span>
                              </div>
                            </td>
                            <td>{p.category}</td>
                            <td>{p.volume}</td>
                            <td><strong>₹{(Number(p.price) || 0).toFixed(2)}</strong></td>
                            <td>
                              <span className="admin-badge-tag">{p.badge}</span>
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                <button
                                  type="button"
                                  className="admin-action-icon-btn"
                                  onClick={() => setAdminQuickViewProduct(p)}
                                  title="Quick View (Customer modal preview)"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="admin-action-icon-btn"
                                  onClick={() => setAdminDetailProduct(p)}
                                  title="Open in Detail (Customer page preview)"
                                >
                                  <ExternalLink size={15} />
                                </button>
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
                {ordersLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <div className="media-spinner" style={{ margin: '0 auto 12px' }}></div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      Fetching real-time orders from Supabase database...
                    </p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                      No orders found matching the filter "{orderFilter}".
                    </p>
                  </div>
                ) : (
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
                            <div className="customer-cell-simple">
                              <div className="customer-name-bold">{order.customer.name}</div>
                              {order.customer.email && (
                                <span className="customer-email-muted">{order.customer.email}</span>
                              )}
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
                          <td><strong>₹{order.total.toFixed(2)}</strong></td>
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
                )}
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
                  <h3 className="kpi-val">{uniqueCustomerCount}</h3>
                  <span className="kpi-trend positive">
                    {repeatCustomersCount > 0
                      ? `${repeatCustomersCount} repeat buyer${repeatCustomersCount > 1 ? 's' : ''}`
                      : `${totalOrdersCount} verified transaction${totalOrdersCount === 1 ? '' : 's'}`}
                  </span>
                </div>
              </div>
              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap kpi-green">
                  <Sparkles size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Average Order Spend</span>
                  <h3 className="kpi-val">₹{aov.toFixed(2)}</h3>
                  <span className="kpi-trend positive">Real customer average</span>
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
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--color-text-muted)' }}>
                          No customer profiles yet.
                        </td>
                      </tr>
                    ) : (
                      orders
                        .filter((o, idx, arr) => arr.findIndex((x) => x.customer?.email === o.customer?.email) === idx)
                        .map((o) => (
                          <tr key={o.id || o.customer?.email}>
                            <td>
                              <div className="customer-cell-simple">
                                <strong className="customer-name-bold">{o.customer?.name || 'Customer'}</strong>
                              </div>
                            </td>
                            <td>{o.customer?.email || 'N/A'}</td>
                            <td><span className="status-pill status-delivered">Verified Member</span></td>
                            <td>
                              {orders.filter((x) => x.customer?.email === o.customer?.email).length} Orders
                            </td>
                            <td>
                              <strong>
                                ₹
                                {orders
                                  .filter((x) => x.customer?.email === o.customer?.email)
                                  .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)
                                  .toFixed(2)}
                              </strong>
                            </td>
                          </tr>
                        ))
                    )}
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
                  onClick={async () => {
                    try {
                      const fresh = await fetchOrders()
                      setOrders(fresh)
                      setAdminNotification('Orders refreshed from database!')
                    } catch (err) {
                      setAdminNotification('Failed to refresh orders.')
                    }
                    setTimeout(() => setAdminNotification(''), 3000)
                  }}
                >
                  <RefreshCw size={15} />
                  <span>Refresh Orders</span>
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

            {/* Tamil Schema Migration Box */}
            <div className="admin-settings-card" style={{ marginTop: '20px' }}>
              <div className="settings-header">
                <Languages size={24} className="text-forest" />
                <div>
                  <h3>Tamil Localization Schema Migration (Supabase)</h3>
                  <p>Execute this SQL once in your Supabase SQL Editor to enable bilingual database persistence.</p>
                </div>
              </div>

              <pre className="rls-sql-block" style={{ maxHeight: '200px' }}>
                <code>{SQL_MIGRATION}</code>
              </pre>

              <div className="settings-actions-group">
                <button
                  type="button"
                  className="btn-pill-primary"
                  onClick={() => {
                    navigator.clipboard?.writeText(SQL_MIGRATION)
                    setAdminNotification('SQL Migration query copied to clipboard! 📋')
                    setTimeout(() => setAdminNotification(''), 3000)
                  }}
                >
                  <Copy size={15} />
                  <span>Copy SQL Migration</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/tacyfcsyswlwbdtminnz/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-pill-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={15} />
                  <span>Open Supabase SQL Editor</span>
                </a>
              </div>
            </div>

            {/* Site Content Dedicated Schema Migration Box */}
            <div className="admin-settings-card" style={{ marginTop: '20px' }}>
              <div className="settings-header">
                <Shield size={24} className="text-forest" />
                <div>
                  <h3>Dedicated Site Content Table (public.site_content)</h3>
                  <p>
                    Run this SQL query in your Supabase SQL Editor. Initially, all content columns are <code>NULL</code> so the site loads directly from its built-in code. When an admin makes changes and saves, only the updated content is stored in the database.
                  </p>
                </div>
              </div>

              <pre className="rls-sql-block" style={{ maxHeight: '200px' }}>
                <code>{SQL_SITE_CONTENT_MIGRATION}</code>
              </pre>

              <div className="settings-actions-group">
                <button
                  type="button"
                  className="btn-pill-primary"
                  onClick={() => {
                    navigator.clipboard?.writeText(SQL_SITE_CONTENT_MIGRATION)
                    setAdminNotification('Site Content SQL query copied to clipboard! 📋')
                    setTimeout(() => setAdminNotification(''), 3000)
                  }}
                >
                  <Copy size={15} />
                  <span>Copy site_content SQL</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/tacyfcsyswlwbdtminnz/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-pill-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={15} />
                  <span>Open Supabase SQL Editor</span>
                </a>
              </div>
            </div>
          </div>
        )}
        {/* Categories Manager Modal */}
        {showCategoryModal && (
          <div className="admin-modal-overlay animate-fade-in" onClick={() => setShowCategoryModal(false)}>
            <div className="admin-cat-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="cat-modal-header">
                <div className="cat-modal-title-group">
                  <div className="cat-modal-icon-badge">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 className="cat-modal-title">Product Categories Manager</h3>
                    <p className="cat-modal-sub">Create, edit, and organize product categories across your store</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setShowCategoryModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} className="cat-add-form-card">
                <h4 className="cat-form-title">
                  <Plus size={15} /> Add New Category
                </h4>
                <div className="cat-add-inputs-row">
                  <input
                    type="text"
                    placeholder="Category Name in English (e.g., Herbal Leaf Powders)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="cat-input-main"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Tamil Name (optional, e.g., மூலிகைப் பொடிகள்)"
                    value={newCatNameTa}
                    onChange={(e) => setNewCatNameTa(e.target.value)}
                    className="cat-input-sub"
                  />
                  <button type="submit" className="btn-pill-primary" style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={15} />
                    <span>Add Category</span>
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div className="cat-list-section">
                <div className="cat-list-header-row">
                  <span className="cat-list-heading">Active Categories ({categories.length})</span>
                  <span className="cat-list-hint">Categories apply instantly to store navigation & products</span>
                </div>

                <div className="cat-cards-grid">
                  {categories.map((cat) => {
                    const count = products.filter(
                      (p) => p.category?.toLowerCase() === cat.name.toLowerCase()
                    ).length
                    const isEditing = editingCategoryName === cat.name

                    return (
                      <div key={cat.id || cat.name} className="cat-item-card">
                        {isEditing ? (
                          <div className="cat-item-edit-mode">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="cat-rename-input"
                              placeholder="Category Name"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={renameValueTa}
                              onChange={(e) => setRenameValueTa(e.target.value)}
                              className="cat-rename-input"
                              placeholder="Tamil Name"
                            />
                            <div className="cat-rename-actions">
                              <button
                                type="button"
                                className="btn-pill-sm-primary"
                                onClick={() => handleSaveRenameCategory(cat.name)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-pill-sm-outline"
                                onClick={() => setEditingCategoryName(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="cat-item-view-mode">
                            <div className="cat-item-left">
                              <span className="cat-dot-indicator"></span>
                              <div>
                                <strong className="cat-name-text">{cat.name}</strong>
                                {cat.name_ta && (
                                  <span className="cat-name-ta-text">{cat.name_ta}</span>
                                )}
                              </div>
                            </div>

                            <div className="cat-item-right">
                              <span className="cat-count-badge">
                                {count} product{count === 1 ? '' : 's'}
                              </span>

                              <button
                                type="button"
                                className="admin-action-icon-btn"
                                onClick={() => {
                                  setEditingCategoryName(cat.name)
                                  setRenameValue(cat.name)
                                  setRenameValueTa(cat.name_ta || '')
                                }}
                                title="Rename category"
                              >
                                <Edit2 size={13} />
                              </button>

                              <button
                                type="button"
                                className="admin-action-icon-btn delete"
                                onClick={() => handleDeleteCategory(cat.name)}
                                title="Remove category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Supabase SQL Helper Accordion */}
              <div className="cat-supabase-helper-box">
                <div className="cat-supabase-header">
                  <div className="helper-icon-wrap">
                    <CheckCircle size={16} className="text-forest" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 className="helper-title">Supabase Database Integration Status</h5>
                    <p className="helper-desc">
                      Your Supabase <code>products</code> table already stores <code>category</code> and <code>category_ta</code>. Any category you assign is immediately saved to the database.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-pill-sm-outline"
                    onClick={() => {
                      navigator.clipboard?.writeText(SQL_CATEGORIES_MIGRATION)
                      setCopiedSql(true)
                      setTimeout(() => setCopiedSql(false), 2000)
                    }}
                  >
                    <Copy size={13} />
                    <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Table Schema'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Quick View Modal for Admin */}
      {adminQuickViewProduct && (
        <ProductModal
          product={adminQuickViewProduct}
          isOpen={Boolean(adminQuickViewProduct)}
          onClose={() => setAdminQuickViewProduct(null)}
          onAddToCart={() => {}}
          onOpenDetail={(prod) => {
            setAdminQuickViewProduct(null)
            setAdminDetailProduct(prod)
          }}
        />
      )}

      {/* Customer Full Detail View Preview Overlay for Admin */}
      {adminDetailProduct && (
        <div className="admin-preview-overlay">
          <div className="admin-preview-top-banner">
            <div className="admin-preview-banner-title">
              <Eye size={18} style={{ color: '#10b981' }} />
              <span>Customer Detail Page Preview: <strong>{adminDetailProduct.name}</strong></span>
              <span className="admin-preview-mode-tag">Storefront Preview</span>
            </div>
            <div className="admin-preview-banner-actions">
              <button
                type="button"
                className="btn-pill-subtle"
                onClick={() => {
                  const prodToEdit = adminDetailProduct
                  setAdminDetailProduct(null)
                  handleOpenEditProduct(prodToEdit)
                }}
              >
                <Edit2 size={13} style={{ marginRight: 5 }} />
                Edit Product
              </button>
              <button
                type="button"
                className="btn-pill-subtle"
                onClick={() => {
                  window.open(`/product/${adminDetailProduct.id}`, '_blank')
                }}
              >
                <ExternalLink size={13} style={{ marginRight: 5 }} />
                Open Live Page ↗
              </button>
              <button
                type="button"
                className="admin-preview-close-btn"
                onClick={() => setAdminDetailProduct(null)}
                title="Close customer preview"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="admin-preview-content-scroll">
            <ProductDetailScreen
              product={adminDetailProduct}
              allProducts={products}
              onBack={() => setAdminDetailProduct(null)}
              onAddToCart={() => {}}
              onQuickView={(p) => setAdminQuickViewProduct(p)}
              onSelectProduct={(p) => setAdminDetailProduct(p)}
              wishlist={[]}
              onToggleWishlist={() => {}}
              lang="en"
              onToggleLang={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  )
}
