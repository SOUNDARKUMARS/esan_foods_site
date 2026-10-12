import { supabase } from '../lib/supabase'
import { PRODUCTS as INITIAL_PRODUCTS } from './mockData'
import { TAMIL_PRODUCT_TRANSLATIONS } from './tamilService'

// Local cache helpers to preserve Tamil translations even before SQL migration is executed
function saveLocalTamilCache(id, data) {
  if (!id) return
  try {
    const raw = localStorage.getItem('esan_products_tamil_cache')
    const cache = raw ? JSON.parse(raw) : {}
    cache[id] = {
      name_ta: data.name_ta || data.nameTa || '',
      subtitle_ta: data.subtitle_ta || data.subtitleTa || '',
      category_ta: data.category_ta || data.categoryTa || '',
      badge_ta: data.badge_ta || data.badgeTa || '',
      description_ta: data.description_ta || data.descriptionTa || '',
    }
    localStorage.setItem('esan_products_tamil_cache', JSON.stringify(cache))
  } catch (e) {}
}

function getLocalTamilCache(id) {
  if (!id) return null
  try {
    const raw = localStorage.getItem('esan_products_tamil_cache')
    if (!raw) return null
    const cache = JSON.parse(raw)
    return cache[id] || null
  } catch (e) {
    return null
  }
}

// Local cache helpers to preserve custom quantity options even before SQL migration
function saveLocalQuantityCache(id, options) {
  if (!id || !options) return
  try {
    const raw = localStorage.getItem('esan_products_quantity_cache')
    const cache = raw ? JSON.parse(raw) : {}
    cache[id] = options
    localStorage.setItem('esan_products_quantity_cache', JSON.stringify(cache))
  } catch (e) {}
}

function getLocalQuantityCache(id) {
  if (!id) return null
  try {
    const raw = localStorage.getItem('esan_products_quantity_cache')
    if (!raw) return null
    const cache = JSON.parse(raw)
    return cache[id] || null
  } catch (e) {
    return null
  }
}

export function findSingleItemOption(options) {
  if (!Array.isArray(options) || options.length === 0) return null
  // 1. Prioritize option explicitly labeled as 'Single' or '1'
  const single = options.find((o) => {
    const t = (o.title || '').toLowerCase()
    const s = (o.size || '').toLowerCase()
    return (
      t.includes('single') ||
      t.includes('1 pc') ||
      t.includes('1 unit') ||
      t.includes('1 can') ||
      t.includes('100g') ||
      s.includes('single')
    )
  })
  if (single) return single
  // 2. Otherwise lowest priced unit option
  const sorted = [...options].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
  return sorted[0] || options[0]
}

export function getDefaultQuantityOptions(basePrice = 0, volume = '250g') {
  const p = Number(basePrice) || 0
  const vol = volume || '250g'
  return [
    {
      id: 'opt-1',
      title: 'Single Item',
      size: vol,
      price: p > 0 ? Number(p.toFixed(2)) : 0,
      badge: '',
      discountText: '',
    },
    {
      id: 'opt-2',
      title: 'Pack of 6',
      size: 'Save 10%',
      price: p > 0 ? Number((p * 6 * 0.9).toFixed(2)) : 0,
      badge: 'POPULAR',
      discountText: 'Save 10%',
    },
    {
      id: 'opt-3',
      title: 'Pack of 12',
      size: 'Save 15%',
      price: p > 0 ? Number((p * 12 * 0.85).toFixed(2)) : 0,
      badge: 'BEST VALUE',
      discountText: 'Save 15%',
    },
  ]
}

// Check if Supabase error is caused by missing columns in table schema
function isMissingColumnError(error) {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    error.code === '42P01' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the') ||
    msg.includes('column') ||
    msg.includes('quantity_options') ||
    msg.includes('_ta')
  )
}

// Transform database row (snake_case) to client model (camelCase + backward compat)
export function formatProductFromDb(row) {
  if (!row) return null
  const localTa = getLocalTamilCache(row.id)
  const fallbackTa = TAMIL_PRODUCT_TRANSLATIONS[row.id] || {}
  const localQty = getLocalQuantityCache(row.id)
  let rawQuantityOptions = null

  if (Array.isArray(row.quantity_options)) {
    rawQuantityOptions = row.quantity_options
  } else if (Array.isArray(row.nutrition?.quantityOptions)) {
    rawQuantityOptions = row.nutrition.quantityOptions
  } else if (Array.isArray(localQty)) {
    rawQuantityOptions = localQty
  }

  // If quantity options are defined (even if empty []), respect that explicitly.
  // Otherwise if not defined at all, return empty array for 0-option standard unit stepper mode.
  const quantityOptions = rawQuantityOptions !== null
    ? rawQuantityOptions.map((opt, i) => ({
        id: opt.id || `opt-${i + 1}`,
        title: opt.title || `Option ${i + 1}`,
        size: opt.size || '',
        price: Number(opt.price || 0),
        badge: opt.badge || '',
        discountText: opt.discountText || opt.size || '',
      }))
    : []

  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle || '',
    volume: row.volume || '330ml',
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    original_price: row.original_price,
    category: row.category || 'Herbal Leaf Powders',
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : 0,
    reviewsCount: Number(row.reviews_count) || 0,
    reviews_count: row.reviews_count,
    badge: row.badge || '',
    image: row.image || '',
    galleryImages: Array.isArray(row.gallery_images) && row.gallery_images.length > 0
      ? row.gallery_images
      : (row.image ? [row.image] : []),
    gallery_images: row.gallery_images,
    videoUrl: row.video_url || '',
    video_url: row.video_url,
    color: row.color || '#059669',
    bgSoft: row.bg_soft || '#ecfdf5',
    bg_soft: row.bg_soft,
    description: row.description || '',
    quantityOptions: quantityOptions,
    quantity_options: quantityOptions,
    nutrition: row.nutrition || {
      calories: '90 kcal',
      sugar: '10g',
      carbs: '20g',
      vitaminC: '100% DV',
      organic: '100% Certified',
    },
    tastingNotes: row.tasting_notes || ['Fresh', 'Organic', 'Natural'],
    tasting_notes: row.tasting_notes,
    ingredients: row.ingredients || ['Cold-Pressed Organic Fruit', 'Filtered Water'],
    highlights: Array.isArray(row.highlights) && row.highlights.length > 0
      ? row.highlights
      : ['Cold-Extracted Purity', 'Zero Synthetic Additives', 'Traditional Wellness Heritage'],
    seals: Array.isArray(row.seals) && row.seals.length === 4
      ? row.seals
      : [
          { title: '100% Natural', desc: 'Pure Herbal Ingredients' },
          { title: 'No Preservatives', desc: 'Zero Artificial Colors' },
          { title: 'Fresh Express', desc: 'Direct Farm Shipping' },
          { title: 'Satisfaction', desc: 'Guaranteed Quality' },
        ],
    stockStatus: row.stock_status || '',
    stock_status: row.stock_status,
    howToUse: row.how_to_use || {
      prepTitle: '1. Prep',
      prepStep: 'Mix 1–2 scoops of the herbal blend with warm water.',
      blendTitle: '2. Blend',
      blendStep: 'Stir thoroughly until completely dissolved for a smooth texture.',
      enjoyTitle: '3. Enjoy',
      enjoyStep: 'Consume daily for optimal natural nourishment and vitality.',
    },
    prepTitle: row.how_to_use?.prepTitle || '1. Prep',
    prepStep: row.how_to_use?.prepStep || 'Mix 1–2 scoops of the herbal blend with warm water.',
    blendTitle: row.how_to_use?.blendTitle || '2. Blend',
    blendStep: row.how_to_use?.blendStep || 'Stir thoroughly until completely dissolved for a smooth texture.',
    enjoyTitle: row.how_to_use?.enjoyTitle || '3. Enjoy',
    enjoyStep: row.how_to_use?.enjoyStep || 'Consume daily for optimal natural nourishment and vitality.',
    stockQuantity: row.stock_quantity ?? 100,
    stock_quantity: row.stock_quantity,
    isFeatured: row.is_featured ?? false,
    is_featured: row.is_featured,
    isActive: row.is_active ?? true,
    is_active: row.is_active,

    // Tamil localized fields
    name_ta: row.name_ta || localTa?.name_ta || fallbackTa.name || '',
    nameTa: row.name_ta || localTa?.name_ta || fallbackTa.name || '',
    subtitle_ta: row.subtitle_ta || localTa?.subtitle_ta || fallbackTa.subtitle || '',
    subtitleTa: row.subtitle_ta || localTa?.subtitle_ta || fallbackTa.subtitle || '',
    category_ta: row.category_ta || localTa?.category_ta || fallbackTa.category || '',
    categoryTa: row.category_ta || localTa?.category_ta || fallbackTa.category || '',
    badge_ta: row.badge_ta || localTa?.badge_ta || fallbackTa.badge || '',
    badgeTa: row.badge_ta || localTa?.badge_ta || fallbackTa.badge || '',
    description_ta: row.description_ta || localTa?.description_ta || fallbackTa.description || '',
    descriptionTa: row.description_ta || localTa?.description_ta || fallbackTa.description || '',
    ingredients_ta: row.ingredients_ta || fallbackTa.ingredients || [],
    ingredientsTa: row.ingredients_ta || fallbackTa.ingredients || [],
  }
}

// Transform client model to database row (snake_case)
export function formatProductForDb(prod) {
  // Normalize gallery images
  let gallery = prod.galleryImages || prod.gallery_images
  if (typeof gallery === 'string') {
    gallery = gallery.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
  }
  if (!Array.isArray(gallery) || gallery.length === 0) {
    gallery = prod.image ? [prod.image] : []
  }

  // Normalize tasting notes and ingredients
  let notes = prod.tastingNotes || prod.tasting_notes || []
  if (typeof notes === 'string') {
    notes = notes.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
  }

  let ing = prod.ingredients || []
  if (typeof ing === 'string') {
    ing = ing.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
  }

  let rawQty = Array.isArray(prod.quantityOptions)
    ? prod.quantityOptions
    : Array.isArray(prod.quantity_options)
    ? prod.quantity_options
    : []

  const qtyOpts = rawQty.map((opt, i) => ({
    id: opt.id || `opt-${i + 1}`,
    title: opt.title || `Option ${i + 1}`,
    size: opt.size || '',
    price: Number(opt.price || 0),
    badge: opt.badge || '',
    discountText: opt.discountText || opt.size || '',
  }))

  const id = prod.id || ('prod-' + Date.now())

  return {
    id: id,
    name: prod.name,
    subtitle: prod.subtitle || '',
    volume: prod.volume || '',
    price: parseFloat(prod.price) || 0,
    original_price: prod.originalPrice || prod.original_price ? parseFloat(prod.originalPrice || prod.original_price) : null,
    category: prod.category || '',
    rating: parseFloat(prod.rating) || 5.0,
    reviews_count: parseInt(prod.reviewsCount || prod.reviews_count, 10) || 0,
    badge: prod.badge || '',
    image: prod.image || gallery[0] || '',
    gallery_images: gallery,
    video_url: prod.videoUrl || prod.video_url || null,
    bg_soft: prod.bgSoft || prod.bg_soft || '#ecfdf5',
    description: prod.description || '',
    quantity_options: qtyOpts,
    nutrition: {
      ...(prod.nutrition || {}),
      calories: prod.calories || prod.nutrition?.calories || '',
      sugar: prod.sugar || prod.nutrition?.sugar || '',
      carbs: prod.carbs || prod.nutrition?.carbs || '',
      vitaminC: prod.vitaminC || prod.nutrition?.vitaminC || '',
      organic: prod.organic || prod.nutrition?.organic || '',
      quantityOptions: qtyOpts,
    },
    tasting_notes: notes,
    ingredients: ing,
    highlights: Array.isArray(prod.highlights) ? prod.highlights : [],
    seals: Array.isArray(prod.seals) ? prod.seals : [],
    stock_status: prod.stockStatus || prod.stock_status || null,
    how_to_use: prod.howToUse || {
      prepTitle: prod.prepTitle || '',
      prepStep: prod.prepStep || '',
      blendTitle: prod.blendTitle || '',
      blendStep: prod.blendStep || '',
      enjoyTitle: prod.enjoyTitle || '',
      enjoyStep: prod.enjoyStep || '',
    },
    stock_quantity: parseInt(prod.stockQuantity || prod.stock_quantity, 10) || 100,
    is_featured: Boolean(prod.isFeatured ?? prod.is_featured ?? false),
    is_active: Boolean(prod.isActive ?? prod.is_active ?? true),

    // Tamil fields
    name_ta: prod.nameTa || prod.name_ta || null,
    subtitle_ta: prod.subtitleTa || prod.subtitle_ta || null,
    category_ta: prod.categoryTa || prod.category_ta || null,
    badge_ta: prod.badgeTa || prod.badge_ta || null,
    description_ta: prod.descriptionTa || prod.description_ta || null,
    ingredients_ta: Array.isArray(prod.ingredientsTa || prod.ingredients_ta)
      ? (prod.ingredientsTa || prod.ingredients_ta)
      : null,
  }
}

const PRODUCTS_STORAGE_KEY = 'esan_products_catalog_cache'
const PRODUCTS_TIMESTAMP_KEY = 'esan_products_catalog_timestamp'

function getLocalProductsCache() {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    return null
  }
}

function setLocalProductsCache(products, timestamp) {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products))
    if (timestamp) {
      localStorage.setItem(PRODUCTS_TIMESTAMP_KEY, timestamp)
    }
  } catch {
    // ignore
  }
}

// 1. Fetch Products Directly From Supabase with Optimized Timestamp Check
export async function fetchProducts() {
  const localCached = getLocalProductsCache()
  const localTimestamp = localStorage.getItem(PRODUCTS_TIMESTAMP_KEY)

  try {
    // Step 1: Lightweight Check - Only query the latest updated_at (single row, 2 columns)
    const { data: latestRow, error: latestErr } = await supabase
      .from('products')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If no changes have been made in DB and we already have cached products, return instant cache!
    if (!latestErr && latestRow && localCached && localCached.length > 0) {
      if (localTimestamp && latestRow.updated_at === localTimestamp) {
        return localCached
      }
    }

    // Step 2: Fresh fetch only when updated or first visit
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('Supabase fetch error, checking fallback:', error.message)
      return localCached && localCached.length > 0 ? localCached : INITIAL_PRODUCTS
    }

    if (data && data.length > 0) {
      const formatted = data.map(formatProductFromDb)
      const newestTs = latestRow?.updated_at || (data.length > 0 ? data[data.length - 1].updated_at : null)
      setLocalProductsCache(formatted, newestTs)
      return formatted
    }

    // If table exists but has 0 records, seed from INITIAL_PRODUCTS automatically
    if (data && data.length === 0) {
      const seeded = await seedProductsIfEmpty()
      return seeded && seeded.length > 0 ? seeded : INITIAL_PRODUCTS
    }

    return localCached && localCached.length > 0 ? localCached : INITIAL_PRODUCTS
  } catch (err) {
    console.error('Error in fetchProducts:', err)
    return localCached && localCached.length > 0 ? localCached : INITIAL_PRODUCTS
  }
}

// 2. Create Product in Supabase
export async function createProduct(productData) {
  const row = formatProductForDb(productData)
  saveLocalTamilCache(row.id, productData)
  saveLocalQuantityCache(row.id, productData.quantityOptions || row.quantity_options)

  let { data, error } = await supabase
    .from('products')
    .insert([row])
    .select()
    .single()

  if (error && isMissingColumnError(error)) {
    console.warn('Columns not yet created in Supabase schema. Saving base fields and caching locally:', error.message)
    const baseRow = { ...row }
    delete baseRow.name_ta
    delete baseRow.subtitle_ta
    delete baseRow.category_ta
    delete baseRow.badge_ta
    delete baseRow.description_ta
    delete baseRow.ingredients_ta
    delete baseRow.highlights
    delete baseRow.seals
    delete baseRow.stock_status
    delete baseRow.how_to_use
    delete baseRow.quantity_options

    const retry = await supabase
      .from('products')
      .insert([baseRow])
      .select()
      .single()

    if (retry.error) {
      console.error('Failed to create product base fields in Supabase:', retry.error)
      throw retry.error
    }
    data = retry.data
  } else if (error) {
    console.error('Failed to create product in Supabase:', error)
    throw error
  }

  const res = formatProductFromDb(data)
  return {
    ...res,
    quantityOptions: productData.quantityOptions || res.quantityOptions,
    nameTa: productData.nameTa || productData.name_ta || res.nameTa,
    name_ta: productData.nameTa || productData.name_ta || res.name_ta,
    subtitleTa: productData.subtitleTa || productData.subtitle_ta || res.subtitleTa,
    subtitle_ta: productData.subtitleTa || productData.subtitle_ta || res.subtitle_ta,
    categoryTa: productData.categoryTa || productData.category_ta || res.categoryTa,
    category_ta: productData.categoryTa || productData.category_ta || res.category_ta,
    badgeTa: productData.badgeTa || productData.badge_ta || res.badgeTa,
    badge_ta: productData.badgeTa || productData.badge_ta || res.badge_ta,
    descriptionTa: productData.descriptionTa || productData.description_ta || res.descriptionTa,
    description_ta: productData.descriptionTa || productData.description_ta || res.description_ta,
    highlights: productData.highlights || res.highlights,
    seals: productData.seals || res.seals,
    stockStatus: productData.stockStatus || res.stockStatus,
    howToUse: productData.howToUse || res.howToUse,
  }
}

// 3. Update Product in Supabase
export async function updateProduct(id, productData) {
  const row = formatProductForDb({ ...productData, id })
  saveLocalTamilCache(id, productData)
  saveLocalQuantityCache(id, productData.quantityOptions || row.quantity_options)

  let { data, error } = await supabase
    .from('products')
    .update(row)
    .eq('id', id)
    .select()
    .single()

  if (error && isMissingColumnError(error)) {
    console.warn('Columns not yet created in Supabase schema. Updating base fields and caching locally:', error.message)
    const baseRow = { ...row }
    delete baseRow.name_ta
    delete baseRow.subtitle_ta
    delete baseRow.category_ta
    delete baseRow.badge_ta
    delete baseRow.description_ta
    delete baseRow.ingredients_ta
    delete baseRow.highlights
    delete baseRow.seals
    delete baseRow.stock_status
    delete baseRow.how_to_use
    delete baseRow.quantity_options

    const retry = await supabase
      .from('products')
      .update(baseRow)
      .eq('id', id)
      .select()
      .single()

    if (retry.error) {
      console.error('Failed to update product base fields in Supabase:', retry.error)
      throw retry.error
    }
    data = retry.data
  } else if (error) {
    console.error('Failed to update product in Supabase:', error)
    throw error
  }

  const res = formatProductFromDb(data)
  return {
    ...res,
    quantityOptions: productData.quantityOptions || res.quantityOptions,
    nameTa: productData.nameTa || productData.name_ta || res.nameTa,
    name_ta: productData.nameTa || productData.name_ta || res.name_ta,
    subtitleTa: productData.subtitleTa || productData.subtitle_ta || res.subtitleTa,
    subtitle_ta: productData.subtitleTa || productData.subtitle_ta || res.subtitle_ta,
    categoryTa: productData.categoryTa || productData.category_ta || res.categoryTa,
    category_ta: productData.categoryTa || productData.category_ta || res.category_ta,
    badgeTa: productData.badgeTa || productData.badge_ta || res.badgeTa,
    badge_ta: productData.badgeTa || productData.badge_ta || res.badge_ta,
    descriptionTa: productData.descriptionTa || productData.description_ta || res.descriptionTa,
    description_ta: productData.descriptionTa || productData.description_ta || res.description_ta,
    highlights: productData.highlights || res.highlights,
    seals: productData.seals || res.seals,
    stockStatus: productData.stockStatus || res.stockStatus,
    howToUse: productData.howToUse || res.howToUse,
  }
}


// 4. Delete Product in Supabase
export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete product from Supabase:', error)
    throw error
  }

  return true
}

// Helper: Seed initial products into Supabase if table is empty
export async function seedProductsIfEmpty() {
  try {
    const rows = INITIAL_PRODUCTS.map(formatProductForDb)
    let { data, error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' })
      .select()

    if (error && isMissingColumnError(error)) {
      const baseRows = rows.map((r) => {
        const copy = { ...r }
        delete copy.name_ta
        delete copy.subtitle_ta
        delete copy.category_ta
        delete copy.badge_ta
        delete copy.description_ta
        delete copy.ingredients_ta
        return copy
      })
      const retry = await supabase
        .from('products')
        .upsert(baseRows, { onConflict: 'id' })
        .select()
      data = retry.data
    }

    if (data && data.length > 0) {
      return data.map(formatProductFromDb)
    }
  } catch (e) {
    // Ignore seeding error
  }
  return null
}
