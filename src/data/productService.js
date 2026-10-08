import { supabase } from '../lib/supabase'
import { PRODUCTS as INITIAL_PRODUCTS } from './mockData'

// Transform database row (snake_case) to client model (camelCase + backward compat)
export function formatProductFromDb(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle || '',
    volume: row.volume || '330ml',
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    original_price: row.original_price,
    category: row.category || '100% Pure Juice',
    rating: Number(row.rating) || 5.0,
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
    stockQuantity: row.stock_quantity ?? 100,
    stock_quantity: row.stock_quantity,
    isFeatured: row.is_featured ?? false,
    is_featured: row.is_featured,
    isActive: row.is_active ?? true,
    is_active: row.is_active,
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

  const id = prod.id || ('drink-' + Date.now())

  return {
    id: id,
    name: prod.name,
    subtitle: prod.subtitle || '',
    volume: prod.volume || '330ml',
    price: parseFloat(prod.price) || 0,
    original_price: prod.originalPrice || prod.original_price ? parseFloat(prod.originalPrice || prod.original_price) : null,
    category: prod.category || '100% Pure Juice',
    rating: parseFloat(prod.rating) || 5.0,
    reviews_count: parseInt(prod.reviewsCount || prod.reviews_count, 10) || 0,
    badge: prod.badge || '',
    image: prod.image || gallery[0] || '',
    gallery_images: gallery,
    video_url: prod.videoUrl || prod.video_url || null,
    color: prod.color || '#059669',
    bg_soft: prod.bgSoft || prod.bg_soft || '#ecfdf5',
    description: prod.description || '',
    nutrition: prod.nutrition || {
      calories: '90 kcal',
      sugar: '10g',
      carbs: '20g',
      vitaminC: '100% DV',
      organic: '100% Certified',
    },
    tasting_notes: notes,
    ingredients: ing,
    stock_quantity: parseInt(prod.stockQuantity || prod.stock_quantity, 10) || 100,
    is_featured: Boolean(prod.isFeatured ?? prod.is_featured ?? false),
    is_active: Boolean(prod.isActive ?? prod.is_active ?? true),
  }
}

// 1. Fetch All Products Directly From Supabase
export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('Supabase fetch error, checking fallback:', error.message)
      return INITIAL_PRODUCTS
    }

    if (data && data.length > 0) {
      return data.map(formatProductFromDb)
    }

    // If table exists but has 0 records, seed from INITIAL_PRODUCTS automatically
    if (data && data.length === 0) {
      const seeded = await seedProductsIfEmpty()
      return seeded && seeded.length > 0 ? seeded : INITIAL_PRODUCTS
    }

    return INITIAL_PRODUCTS
  } catch (err) {
    console.error('Error in fetchProducts:', err)
    return INITIAL_PRODUCTS
  }
}

// 2. Create Product in Supabase
export async function createProduct(productData) {
  const row = formatProductForDb(productData)
  const { data, error } = await supabase
    .from('products')
    .insert([row])
    .select()
    .single()

  if (error) {
    console.error('Failed to create product in Supabase:', error)
    throw error
  }

  return formatProductFromDb(data)
}

// 3. Update Product in Supabase
export async function updateProduct(id, productData) {
  const row = formatProductForDb({ ...productData, id })
  const { data, error } = await supabase
    .from('products')
    .update(row)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update product in Supabase:', error)
    throw error
  }

  return formatProductFromDb(data)
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
    const { data, error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' })
      .select()

    if (!error && data) {
      return data.map(formatProductFromDb)
    }
  } catch (e) {
    // Ignore seeding error
  }
  return null
}
