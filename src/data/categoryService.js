import { supabase } from '../lib/supabase'

export const DEFAULT_CATEGORIES = [
  { id: 'herbal-powders', name: 'Herbal Leaf Powders', name_ta: 'மூலிகைப் பொடிகள்' },
  { id: 'organic-foods', name: 'Organic Foods', name_ta: 'இயற்கை உணவுகள்' },
  { id: 'natural-superfoods', name: 'Natural Superfoods', name_ta: 'இயற்கை சத்துணவுகள்' },
  { id: 'health-mix', name: 'Traditional Health Mix', name_ta: 'பாரம்பரிய சத்துமாவு' },
  { id: 'wellness-blends', name: 'Wellness Blends', name_ta: 'ஆரோக்கிய கலவைகள்' },
]

const LOCAL_STORAGE_KEY = 'esan_custom_categories'

function getLocalCategories() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalCategories(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

export const SQL_CATEGORIES_MIGRATION = `-- ========================================================
-- Esan Foods: Categories Table Schema for Supabase
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_ta TEXT,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row-Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for storefront)
CREATE POLICY "Allow public read on categories"
ON public.categories FOR SELECT
USING (true);

-- Allow public / admin insert, update, delete
CREATE POLICY "Allow public insert on categories"
ON public.categories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on categories"
ON public.categories FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on categories"
ON public.categories FOR DELETE
USING (true);

-- Insert standard herbal food categories
INSERT INTO public.categories (id, name, name_ta, display_order)
VALUES
  ('herbal-leaf-powders', 'Herbal Leaf Powders', 'மூலிகைப் பொடிகள்', 1),
  ('organic-foods', 'Organic Foods', 'இயற்கை உணவுகள்', 2),
  ('natural-superfoods', 'Natural Superfoods', 'இயற்கை சத்துணவுகள்', 3),
  ('traditional-health-mix', 'Traditional Health Mix', 'பாரம்பரிய சத்துமாவு', 4),
  ('wellness-blends', 'Wellness Blends', 'ஆரோக்கிய கலவைகள்', 5)
ON CONFLICT (name) DO NOTHING;
`

/**
 * Fetch all categories.
 * 1. Tries to query Supabase `categories` table.
 * 2. If table doesn't exist yet, aggregates unique categories from active `products` + local storage + defaults.
 */
export async function fetchCategories(products = []) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .neq('id', '__esan_cms_site_content__')
      .order('display_order', { ascending: true })

    if (!error && Array.isArray(data) && data.length > 0) {
      // Merge any extra product categories that might not be in the table yet
      const tableNames = new Set(data.map((c) => c.name.toLowerCase()))
      const extras = []
      products.forEach((p) => {
        if (p.category && !tableNames.has(p.category.toLowerCase())) {
          extras.push({
            id: p.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: p.category,
            name_ta: p.category_ta || p.categoryTa || '',
          })
          tableNames.add(p.category.toLowerCase())
        }
      })
      return [...data, ...extras]
    }
  } catch (err) {
    // Table doesn't exist yet, fall back gracefully
  }

  // Fallback: merge products + local storage + defaults
  const localList = getLocalCategories()
  const map = new Map()

  DEFAULT_CATEGORIES.forEach((c) => map.set(c.name.toLowerCase(), c))
  localList.forEach((c) => map.set(c.name.toLowerCase(), c))

  products.forEach((p) => {
    if (p.category) {
      const key = p.category.toLowerCase()
      if (!map.has(key)) {
        map.set(key, {
          id: p.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: p.category,
          name_ta: p.category_ta || p.categoryTa || '',
        })
      }
    }
  })

  return Array.from(map.values())
}

/**
 * Add a new category.
 * Saves to Supabase `categories` table (if present) and updates local persistence.
 */
export async function addCategory(categoryName, categoryNameTa = '') {
  if (!categoryName || !categoryName.trim()) {
    throw new Error('Category name cannot be empty')
  }

  const cleanName = categoryName.trim()
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-') || `cat-${Date.now()}`
  const newCat = {
    id: slug,
    name: cleanName,
    name_ta: categoryNameTa.trim() || '',
    display_order: 99,
  }

  // 1. Save to local storage cache
  const local = getLocalCategories()
  if (!local.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
    saveLocalCategories([...local, newCat])
  }

  // 2. Try to insert into Supabase `categories` table
  try {
    const { data, error } = await supabase.from('categories').insert([
      {
        id: slug,
        name: cleanName,
        name_ta: categoryNameTa.trim() || null,
      },
    ])
    if (error && !error.message?.includes('schema cache')) {
      console.warn('Note inserting to categories table:', error)
    }
  } catch (err) {
    // If table doesn't exist yet, local cache handles it seamlessly
  }

  return newCat
}

/**
 * Rename/update an existing category.
 * Also updates all products in Supabase that currently use the old category name!
 */
export async function updateCategoryName(oldName, newName, newNameTa = '', currentProducts = []) {
  if (!oldName || !newName || !newName.trim()) return

  const cleanNewName = newName.trim()

  // 1. Update in local storage
  const local = getLocalCategories()
  const updatedLocal = local.map((c) =>
    c.name.toLowerCase() === oldName.toLowerCase()
      ? { ...c, name: cleanNewName, name_ta: newNameTa || c.name_ta }
      : c
  )
  saveLocalCategories(updatedLocal)

  // 2. Update in Supabase `categories` table
  try {
    await supabase
      .from('categories')
      .update({ name: cleanNewName, name_ta: newNameTa || null })
      .ilike('name', oldName)
  } catch (err) {
    // Ignore if table missing
  }

  // 3. Update all products having oldName to newName in Supabase
  try {
    await supabase
      .from('products')
      .update({
        category: cleanNewName,
        category_ta: newNameTa || null,
      })
      .eq('category', oldName)
  } catch (err) {
    console.warn('Failed to bulk-update products category in DB:', err)
  }
}

/**
 * Delete a category.
 */
export async function removeCategory(categoryName) {
  if (!categoryName) return

  // 1. Remove from local storage
  const local = getLocalCategories()
  saveLocalCategories(local.filter((c) => c.name.toLowerCase() !== categoryName.toLowerCase()))

  // 2. Remove from Supabase categories table
  try {
    await supabase.from('categories').delete().ilike('name', categoryName)
  } catch (err) {
    // Ignore
  }
}
