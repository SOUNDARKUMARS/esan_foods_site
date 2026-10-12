import { supabase } from '../lib/supabase'
import { REVIEWS, FAQS, BENEFITS } from './mockData'

export const DEFAULT_SITE_CONTENT = {
  hero: {
    badgeReviewScore: '4.9/5',
    badgeReviewCount: '18,130 (Reviews)',
    headlineLine1: 'FEEL THE',
    headlineHighlight: 'NATURAL PURITY',
    headlineLine2: 'IN EVERY SERVING',
    subtext:
      'Authentic traditional herbal powders and natural wellness foods crafted from pure organic botanicals to nourish and energize your daily life.',
    metaPill1: '100% Herbal Foods',
    metaPill2Val: '100%',
    metaPill2Sub: 'Natural & Organic',
    trustItem1: 'Non-GMO Verified',
    trustItem2: 'Zero Preservatives & Additives',
    trustItem3: 'Traditional Heritage Recipe',
    badgeTopRightEmoji: '🌿',
    badgeTopRightBold: '100% Natural',
    badgeTopRightLight: 'Pure Herbal Leaf',
    badgeBottomLeftEmoji: '🍃',
    badgeBottomLeftBold: 'Traditional Recipe',
    badgeBottomLeftLight: 'No Preservatives',
    heroImage: '', // empty defaults to local hero_cans.jpg
  },
  ctaBanner: {
    tagline: 'Eat Pure, Live Healthy.',
    headline: 'Ready To Nourish Your Health?',
    subheadline:
      'Experience Traditional Wellness, Clean Natural Ingredients, And Pure Nutrition.',
    buttonText: 'Order Now',
    shippingNotice: 'Free Express Shipping On Orders Over ₹50',
    backgroundImage: '', // empty defaults to citrusBanner
  },
  featuredProductId: 'tinned-passion',
  testimonials: REVIEWS,
  faqs: FAQS,
  whyLove: BENEFITS,
}

const SITE_CONTENT_STORAGE_KEY = 'esan_site_content_cache'
const SITE_CONTENT_TIMESTAMP_KEY = 'esan_site_content_timestamp'
const DB_BACKUP_CATEGORY_ID = '__esan_cms_site_content__'

function getLocalSiteContent() {
  try {
    const raw = localStorage.getItem(SITE_CONTENT_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Could not read site content cache:', e)
  }
  return null
}

export function getInitialSiteContent() {
  const cached = getLocalSiteContent()
  return cached ? formatContentFromDb(cached) : DEFAULT_SITE_CONTENT
}

function getLocalSiteTimestamp() {
  try {
    return localStorage.getItem(SITE_CONTENT_TIMESTAMP_KEY) || null
  } catch {
    return null
  }
}

function setLocalSiteContent(content, updatedAt = null) {
  try {
    localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(content))
    if (updatedAt) {
      localStorage.setItem(SITE_CONTENT_TIMESTAMP_KEY, updatedAt)
    }
  } catch (e) {
    console.warn('Could not save site content cache:', e)
  }
}

// Convert database row or parsed JSON payload to frontend model
// If any column or field in DB is NULL, it falls back to the site's built-in default content
export function formatContentFromDb(row) {
  if (!row) return DEFAULT_SITE_CONTENT

  // 1. Hero: if null or empty in DB, use default site content
  let hero = DEFAULT_SITE_CONTENT.hero
  if (row.hero && typeof row.hero === 'object' && Object.keys(row.hero).length > 0) {
    hero = {
      ...DEFAULT_SITE_CONTENT.hero,
      ...row.hero,
    }
    // Any null or undefined field falls back to site default
    for (const key of Object.keys(DEFAULT_SITE_CONTENT.hero)) {
      if (hero[key] === null || hero[key] === undefined) {
        hero[key] = DEFAULT_SITE_CONTENT.hero[key]
      }
    }
  }

  // 2. CTA Banner: if null or empty in DB, use default site content
  let ctaBanner = DEFAULT_SITE_CONTENT.ctaBanner
  const dbCta = row.cta_banner || row.ctaBanner
  if (dbCta && typeof dbCta === 'object' && Object.keys(dbCta).length > 0) {
    ctaBanner = {
      ...DEFAULT_SITE_CONTENT.ctaBanner,
      ...dbCta,
    }
    // Any null or undefined field falls back to site default
    for (const key of Object.keys(DEFAULT_SITE_CONTENT.ctaBanner)) {
      if (ctaBanner[key] === null || ctaBanner[key] === undefined) {
        ctaBanner[key] = DEFAULT_SITE_CONTENT.ctaBanner[key]
      }
    }
  }

  // 3. Featured Product ID: if null in DB, use default site content
  const featuredProductId =
    row.featured_product_id || row.featuredProductId || DEFAULT_SITE_CONTENT.featuredProductId

  // 4. Testimonials: if null or empty array in DB, use default site content
  const testimonials =
    Array.isArray(row.testimonials) && row.testimonials.length > 0
      ? row.testimonials
      : DEFAULT_SITE_CONTENT.testimonials

  // 5. FAQs: if null or empty array in DB, use default site content
  const faqs =
    Array.isArray(row.faqs) && row.faqs.length > 0
      ? row.faqs
      : DEFAULT_SITE_CONTENT.faqs

  // 6. Why Love / Benefits: if null or empty array in DB, use default site content
  const dbWhyLove = row.why_love || row.whyLove
  const whyLove =
    Array.isArray(dbWhyLove) && dbWhyLove.length > 0
      ? dbWhyLove
      : DEFAULT_SITE_CONTENT.whyLove

  return {
    hero,
    ctaBanner,
    featuredProductId,
    testimonials,
    faqs,
    whyLove,
  }
}

function isMissingTableError(error) {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table')
  )
}

/**
 * 1. Fast & Optimized Fetch of Site Content:
 * Queries the dedicated 'site_content' table.
 * If local cache timestamp matches DB timestamp, returns instant local cache (0ms overhead, avoids redundant payloads).
 * If content in DB is NULL, it seamlessly loads from the site itself.
 */
export async function fetchSiteContent() {
  const localCached = getLocalSiteContent()
  const localTimestamp = getLocalSiteTimestamp()

  try {
    // Step 1: Lightweight Check - Only query updated_at of 'main' row (single row, 2 columns)
    const { data: metaRow, error: metaErr } = await supabase
      .from('site_content')
      .select('id, updated_at')
      .eq('id', 'main')
      .maybeSingle()

    if (!metaErr) {
      if (metaRow) {
        // Optimization: If local cache timestamp matches DB timestamp, return local version immediately!
        if (localCached && localTimestamp && metaRow.updated_at && localTimestamp === metaRow.updated_at) {
          return formatContentFromDb(localCached)
        }

        // DB has newer data or no local cache exists: fetch full row
        const { data: fullRow, error: fullErr } = await supabase
          .from('site_content')
          .select('*')
          .eq('id', 'main')
          .single()

        if (!fullErr && fullRow) {
          const formatted = formatContentFromDb(fullRow)
          setLocalSiteContent(formatted, fullRow.updated_at || metaRow.updated_at)
          return formatted
        }
      } else {
        // Table exists, but no 'main' row yet. Content comes directly from the site itself!
        return localCached ? formatContentFromDb(localCached) : DEFAULT_SITE_CONTENT
      }
    } else {
      if (isMissingTableError(metaErr)) {
        console.info(
          'ℹ️ Table "public.site_content" not found. Please execute the SQL migration in Supabase SQL Editor to enable cloud sync across all browsers.'
        )
      } else {
        console.warn('Notice querying site_content:', metaErr.message)
      }
    }
  } catch (err) {
    console.warn('Network error during site content fetch:', err)
  }

  // Backup fallback: check backup storage if available
  try {
    const { data: bRow, error: bErr } = await supabase
      .from('categories')
      .select('description, updated_at')
      .eq('id', DB_BACKUP_CATEGORY_ID)
      .maybeSingle()

    if (!bErr && bRow?.description) {
      const parsed = JSON.parse(bRow.description)
      const formatted = formatContentFromDb(parsed)
      setLocalSiteContent(formatted, bRow.updated_at)
      return formatted
    }
  } catch (_) {}

  return localCached ? formatContentFromDb(localCached) : DEFAULT_SITE_CONTENT
}

/**
 * 2. Save site content directly to dedicated 'public.site_content' table:
 * Persists immediately to local cache, then upserts the 'main' row in Supabase.
 */
export async function saveSiteContent(content) {
  const nowIso = new Date().toISOString()
  const payload = {
    id: 'main',
    hero: content.hero || null,
    cta_banner: content.ctaBanner || null,
    featured_product_id: content.featuredProductId || null,
    testimonials: Array.isArray(content.testimonials) ? content.testimonials : null,
    faqs: Array.isArray(content.faqs) ? content.faqs : null,
    why_love: Array.isArray(content.whyLove) ? content.whyLove : null,
    updated_at: nowIso,
  }

  // Immediate local cache update
  setLocalSiteContent(
    {
      ...payload,
      ctaBanner: payload.cta_banner,
      whyLove: payload.why_love,
    },
    nowIso
  )

  let savedSuccessfully = false

  // 1. Primary write to dedicated 'site_content' table
  try {
    const { data, error } = await supabase
      .from('site_content')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (!error && data) {
      savedSuccessfully = true
      const formatted = formatContentFromDb(data)
      setLocalSiteContent(formatted, data.updated_at || nowIso)
      return formatted
    }

    if (error) {
      if (isMissingTableError(error)) {
        console.warn(
          '⚠️ Table "public.site_content" does not exist yet. Please execute the SQL migration in Supabase SQL editor.'
        )
      } else {
        console.error('Supabase error saving to site_content:', error)
      }
    }
  } catch (err) {
    console.warn('Network error saving to site_content:', err)
  }

  // 2. Safety net backup write to categories table if site_content table does not exist yet
  if (!savedSuccessfully) {
    try {
      const serialized = JSON.stringify({
        hero: payload.hero,
        ctaBanner: payload.cta_banner,
        featuredProductId: payload.featured_product_id,
        testimonials: payload.testimonials,
        faqs: payload.faqs,
        whyLove: payload.why_love,
        updated_at: nowIso,
      })

      await supabase.from('categories').upsert({
        id: DB_BACKUP_CATEGORY_ID,
        name: DB_BACKUP_CATEGORY_ID,
        description: serialized,
        display_order: 9999,
        updated_at: nowIso,
      })
    } catch (_) {}
  }

  return formatContentFromDb(payload)
}

export const SQL_SITE_CONTENT_MIGRATION = `-- ========================================================
-- Esan Foods: Dedicated Site Content Table Schema for Supabase
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query)
-- ========================================================

-- 1. Create dedicated site_content table (all columns default to NULL)
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  hero JSONB DEFAULT NULL,
  cta_banner JSONB DEFAULT NULL,
  featured_product_id TEXT DEFAULT NULL,
  testimonials JSONB DEFAULT NULL,
  faqs JSONB DEFAULT NULL,
  why_love JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure existing columns allow NULL if previously created
DO $$
BEGIN
  ALTER TABLE public.site_content ALTER COLUMN hero DROP NOT NULL;
  ALTER TABLE public.site_content ALTER COLUMN cta_banner DROP NOT NULL;
  ALTER TABLE public.site_content ALTER COLUMN testimonials DROP NOT NULL;
  ALTER TABLE public.site_content ALTER COLUMN faqs DROP NOT NULL;
  ALTER TABLE public.site_content ALTER COLUMN why_love DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Enable Row-Level Security
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- 3. Row-Level Security Policies (Storefront & Admin access across all browsers)
DROP POLICY IF EXISTS "Allow public read on site_content" ON public.site_content;
CREATE POLICY "Allow public read on site_content"
ON public.site_content FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert on site_content" ON public.site_content;
CREATE POLICY "Allow public insert on site_content"
ON public.site_content FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on site_content" ON public.site_content;
CREATE POLICY "Allow public update on site_content"
ON public.site_content FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow public delete on site_content" ON public.site_content;
CREATE POLICY "Allow public delete on site_content"
ON public.site_content FOR DELETE
USING (true);

-- 4. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_site_content_updated_at ON public.site_content;
CREATE TRIGGER set_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.handle_site_content_updated_at();

-- 5. Enable Realtime Replication for instant multi-browser / multi-tab live sync
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'site_content'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
  END IF;
END $$;

-- 6. Insert initial row with NULL values (all content loads directly from site itself)
INSERT INTO public.site_content (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;
`
