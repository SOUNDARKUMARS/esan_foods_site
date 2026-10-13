import { supabase } from '../lib/supabase'

/**
 * SQL Migration script for dedicated public.user_carts table in Supabase.
 * Can be run in Supabase SQL Editor by administrators.
 */
export const SQL_CART_MIGRATION = `-- ========================================================
-- Esan Foods: Dedicated User Carts Table Schema for Supabase
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.user_carts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

-- 1. Users can view and manage their own cart
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.user_carts;
CREATE POLICY "Users can manage their own cart"
  ON public.user_carts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Admins full access
DROP POLICY IF EXISTS "Admins full access to user_carts" ON public.user_carts;
CREATE POLICY "Admins full access to user_carts"
  ON public.user_carts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
`

/**
 * Clean & sanitize cart items before DB storage
 */
function sanitizeCartItems(items) {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    cartItemId: item.cartItemId || item.product?.id,
    product: {
      id: item.product?.id,
      name: item.product?.name,
      tamilName: item.product?.tamilName || '',
      price: Number(item.product?.price ?? item.price ?? 0),
      originalPrice: item.product?.originalPrice ? Number(item.product.originalPrice) : null,
      image: item.product?.image || '',
      volume: item.product?.volume || '',
      category: item.product?.category || '',
    },
    quantity: Math.max(1, Number(item.quantity) || 1),
    selectedOption: item.selectedOption || null,
  }))
}

let hasUserCartsTable = true

/**
 * Fetch a specific user's cart from Supabase database.
 * Checks public.user_carts first, then Supabase auth user_metadata.
 * Returns an array of cart items, or [] for new/empty accounts.
 */
export async function fetchUserCart(userId) {
  if (!userId) return []

  // 1. Try public.user_carts table if available
  if (hasUserCartsTable) {
    try {
      const { data, error } = await supabase
        .from('user_carts')
        .select('items')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        hasUserCartsTable = false
      } else if (data && Array.isArray(data.items)) {
        return data.items
      }
    } catch (_) {
      hasUserCartsTable = false
    }
  }

  // 2. Try Supabase Auth user_metadata (stored directly in auth.users PostgreSQL table)
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session?.user && sessionData.session.user.id === userId) {
      const metaCart = sessionData.session.user.user_metadata?.cart
      if (Array.isArray(metaCart)) {
        return metaCart
      }
    }
  } catch (_) {
    // Non-blocking
  }

  // 3. User-scoped localStorage fallback (strictly isolated by userId)
  try {
    const scoped = localStorage.getItem(`esan_cart_${userId}`)
    if (scoped) {
      const parsed = JSON.parse(scoped)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (_) {}

  return []
}

/**
 * Save a user's cart to Supabase database.
 * Persists to public.user_carts and Supabase auth user_metadata.
 */
let saveDebounceTimer = null
export async function saveUserCart(userId, items = []) {
  if (!userId) return

  const cleanItems = sanitizeCartItems(items)

  // Immediately update user-isolated local cache
  try {
    localStorage.setItem(`esan_cart_${userId}`, JSON.stringify(cleanItems))
  } catch (_) {}

  // Debounce network DB persistence to prevent excessive writes on rapid qty clicks
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer)
  }

  saveDebounceTimer = setTimeout(async () => {
    // 1. Attempt public.user_carts table upsert if available
    if (hasUserCartsTable) {
      try {
        const { error } = await supabase.from('user_carts').upsert(
          {
            user_id: userId,
            items: cleanItems,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        if (error) {
          hasUserCartsTable = false
        }
      } catch (_) {
        hasUserCartsTable = false
      }
    }

    // 2. Persist to Supabase Auth user_metadata in database
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user && sessionData.session.user.id === userId) {
        await supabase.auth.updateUser({
          data: {
            cart: cleanItems,
          },
        })
      }
    } catch (_) {
      // Non-blocking
    }
  }, 400)
}

/**
 * Clear a user's cart in the database and local cache
 */
export async function clearUserCart(userId) {
  if (!userId) return

  try {
    localStorage.removeItem(`esan_cart_${userId}`)
  } catch (_) {}

  try {
    await supabase.from('user_carts').delete().eq('user_id', userId)
  } catch (_) {}

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session?.user && sessionData.session.user.id === userId) {
      await supabase.auth.updateUser({
        data: { cart: [] },
      })
    }
  } catch (_) {}
}
