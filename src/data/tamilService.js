/**
 * tamilService.js
 * Comprehensive Tamil language and transliteration service for Esan Foods.
 * Includes Google Input Tools transliterator, curated beverage terminology,
 * and helpers for bilingual UI rendering and database schema sync.
 */

/**
 * Transliterate a single English phrase to Tamil via Google Input Tools API.
 */
async function transliteratePhrase(en, signal) {
  const url =
    `https://inputtools.google.com/request?itc=ta-t-i0-und&num=1&text=` +
    encodeURIComponent(en)

  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return ''
    const data = await res.json()
    return data?.[0] === 'SUCCESS' ? data?.[1]?.[0]?.[1]?.[0] || '' : ''
  } catch (e) {
    return ''
  }
}

/**
 * Transliterate the full English name to Tamil.
 * Comma-separated parts (e.g. "Guava Juice, Esan Foods") are each
 * converted so the Tamil name covers the whole English label.
 */
export async function transliterateToTamil(text, signal) {
  const en = String(text || '').trim()
  if (!en) return ''

  const parts = en.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 1) {
    return transliteratePhrase(en, signal)
  }

  const taParts = await Promise.all(parts.map((p) => transliteratePhrase(p, signal)))
  const joined = taParts.filter(Boolean).join(', ')
  return joined || transliteratePhrase(en, signal)
}

/**
 * Authentic, culturally natural Tamil translations for default catalog items
 */
export const TAMIL_PRODUCT_TRANSLATIONS = {
  'guava-juice': {
    name: 'கொய்யா பழச்சாறு',
    subtitle: '100% தூய இயற்கை கொய்யா அமிர்தம்',
    category: '100% தூய பழச்சாறு',
    badge: 'அதிகம் விற்பனையாகும்',
    description: 'மரத்திலிருந்தே பழுத்த இளஞ்சிவப்பு கொய்யாப்பழங்களில் இருந்து தயாரிக்கப்பட்ட தூய சுவையான இயற்கை பானம். வைட்டமின் சி மற்றும் இயற்கை நார்ச்சத்து நிறைந்தது.',
    tastingNotes: ['இளஞ்சிவப்பு கொய்யா சுவை', 'மென்மையான எலுமிச்சை தொடுதல்', 'சுவையான இயற்கை பினிஷ்'],
    ingredients: ['இயற்கை கொய்யா விழுது', 'சுத்திகரிக்கப்பட்ட நீர்', 'இயற்கை தேன்/அகாவே', 'எலுமிச்சை சாறு'],
  },
  'coconut-water': {
    name: 'இயற்கை இளநீர்',
    subtitle: 'பசுமையான இளம் தேங்காய் நீரேற்றம்',
    category: 'உடல் நீரேற்றம்',
    badge: 'எலக்ட்ரோலைட் நிறைந்தது',
    description: 'பச்சை இளம் தேங்காய்களிலிருந்து உடனடியாக பிரித்தெடுக்கப்பட்ட புத்துணர்ச்சியூட்டும் இயற்கை இளநீர். சர்க்கரை சேர்க்கப்படாத 5 அத்தியாவசிய எலக்ட்ரோலைட்டுகள் நிறைந்தது.',
    tastingNotes: ['இயற்கை இனிப்பு', 'தேங்காய் மணமும் சுவையும்', 'அதிவேக நீரேற்றம்'],
    ingredients: ['100% தூய இயற்கை இளநீர்', 'இயற்கை வைட்டமின் சி'],
  },
  'soursop-juice': {
    name: 'முள்ளாத்தா பழச்சாறு (சவர்சாப்)',
    subtitle: 'புதிய குவானபானா பழச்சாறு',
    category: 'பாரம்பரிய பழங்கள்',
    badge: 'சூப்பர்பழம்',
    description: 'அரிய பாரம்பரிய முள்ளாத்தா பழத்திலிருந்து தயாரிக்கப்பட்ட சுவையான கிரீமி இயற்கை பானம். செரிமானத்திற்கும் நோய் எதிர்ப்பு சக்திக்கும் உகந்தது.',
    tastingNotes: ['அன்னாசி-ஸ்ட்ராபெரி கலந்த சுவை', 'கிரீமி மென்மை', 'புத்துணர்ச்சியூட்டும் அமிலத்தன்மை'],
    ingredients: ['இயற்கை முள்ளாத்தா விழுது', 'சுத்திகரிக்கப்பட்ட கார நீர்', 'இயற்கை இனிப்பூட்டி'],
  },
  'strawberry-sparkling': {
    name: 'ஸ்பார்க்ளிங் ஸ்ட்ராபெரி',
    subtitle: 'இயற்கை ஸ்ட்ராபெரி சோடா பானம்',
    category: 'ஸ்பார்க்ளிங் பழச்சாறு',
    badge: 'குறைந்த கலோரி',
    description: 'உண்மையான ஸ்ட்ராபெர்ரி பழங்களின் புத்துணர்ச்சியூட்டும் சுவை. மிதமான நுரை குமிழ்களுடன் உங்கள் தாகத்தை தணிக்கும் சிறந்த இயற்கை குளிர்பானம்.',
    tastingNotes: ['புதிய ஸ்ட்ராபெரி இனிப்பு', 'சுறுசுறுப்பான சோடா குமிழ்கள்', 'குளிர்ந்த புத்துணர்ச்சி'],
    ingredients: ['இயற்கை ஸ்ட்ராபெரி சாறு', 'ஸ்பார்க்ளிங் நீர்', 'இயற்கை எலுமிச்சை சாறு'],
  },
  'passion-juice': {
    name: 'பாஷன் பழச்சாறு',
    subtitle: 'தித்திக்கும் வெப்பமண்டல பழச்சாறு',
    category: '100% தூய பழச்சாறு',
    badge: 'பிரீமியம் சுவை',
    description: 'அடர்ந்த இனிப்பு மற்றும் புளிப்பு சுவை கொண்ட தூய பாஷன் பழச்சாறு. வைட்டமின் ஏ மற்றும் சி சத்துக்கள் அடங்கிய உற்சாக பானம்.',
    tastingNotes: ['வெப்பமண்டல பாஷன் பழம்', 'புளிப்பு கலந்த இனிப்பு', 'நீடித்த நறுமணம்'],
    ingredients: ['இயற்கை பாஷன் பழ விழுது', 'சுத்திகரிக்கப்பட்ட நீர்', 'இயற்கை கரும்பு சர்க்கரை'],
  },
  'mango-zing': {
    name: 'தங்க மாம்பழச்சாறு (மேங்கோ ஜிங்)',
    subtitle: 'அல்போன்சா மாம்பழ அமிர்தம்',
    category: '100% தூய பழச்சாறு',
    badge: 'மக்களின் விருப்பம்',
    description: 'சூரிய ஒளியில் கனிந்த தங்க நிற அல்போன்சா மாம்பழங்களின் தித்திக்கும் சுவை. லேசான இஞ்சி மற்றும் எலுமிச்சை தொடுதலுடன் தயாரிக்கப்பட்டது.',
    tastingNotes: ['அல்போன்சா மாம்பழ சுவை', 'லேசான இஞ்சி காரம்', 'மென்மையான இனிப்பு'],
    ingredients: ['அல்போன்சா மாம்பழ விழுது', 'இஞ்சி சாறு', 'எலுமிச்சை சாறு', 'சுத்திகரிக்கப்பட்ட நீர்'],
  },
}

/**
 * Common phrase dictionary for UI components in Tamil
 */
export const TAMIL_UI_DICTIONARY = {
  // Categories
  'All Products': 'அனைத்து பொருட்கள்',
  'All Flavors': 'அனைத்து பொருட்கள்',
  'Herbal Leaf Powders': 'மூலிகைப் பொடிகள்',
  'Organic Foods': 'இயற்கை உணவுகள்',
  'Natural Superfoods': 'இயற்கை மூலிகைகள்',
  'Wellness Blends': 'ஆரோக்கிய கலவைகள்',
  '100% Pure Juice': '100% தூய இயற்கை',
  'Sparkling Fruit': 'இயற்கை பழங்கள்',
  'Tropical & Exotic': 'பாரம்பரிய மூலிகைகள்',
  'Hydration Boost': 'இயற்கை ஆரோக்கியம்',

  // UI labels & badges
  'Best Seller': 'அதிகம் விற்பனையாகும்',
  'Electrolyte Rich': 'எலக்ட்ரோலைட் நிறைந்தது',
  'Superfruit': 'சூப்பர்பழம்',
  'Low Calorie': 'குறைந்த கலோரி',
  'Organic': 'இயற்கை',
  'Shop Collections': 'பொருட்களை காண்க',
  'Add to Box': 'கூடையில் சேர்க்க',
  'Add to Cart': 'கூடையில் சேர்க்க',
  'Quick View': 'விரைவு பார்வை',
  'Discover Collections': 'எங்கள் தயாரிப்புகள்',
  'Nutritional Facts': 'ஊட்டச்சத்து தகவல்கள்',
  'Overview': 'விளக்கம்',
  'Ingredients': 'பொருட்கள்',
  'Nutrition': 'ஊட்டச்சத்து',
  'Single Item': 'ஒற்றை பாட்டில்',
  'Pack of 6': '6 பாட்டில்கள்',
  'Pack of 12': '12 பாட்டில்கள்',
  'Save 10%': '10% சேமிப்பு',
  'Save 15%': '15% சேமிப்பு',
  '100% Natural': '100% இயற்கை',
  'No Preservatives': 'பாதுகாப்பு ரசாயனங்கள் இல்லை',
  'Fresh Express': 'விரைவு டெலிவரி',
  'Satisfaction': 'உத்தரவாதமான தரம்',
  'Order Now': 'இப்போதே ஆர்டர் செய்க',
}

/**
 * Curated beverage and fruit dictionary for natural, authentic Tamil terms
 */
export const BEVERAGE_DICTIONARY = {
  'orange juice': 'ஆரஞ்சு பழச்சாறு',
  'orange': 'ஆரஞ்சு',
  'apple juice': 'ஆப்பிள் பழச்சாறு',
  'apple': 'ஆப்பிள்',
  'mango juice': 'மாம்பழச்சாறு',
  'mango zing': 'தங்க மாம்பழச்சாறு (மேங்கோ ஜிங்)',
  'mango': 'மாம்பழம்',
  'guava juice': 'கொய்யா பழச்சாறு',
  'guava': 'கொய்யா',
  'coconut water': 'இயற்கை இளநீர்',
  'tender coconut': 'இளநீர்',
  'coconut': 'தேங்காய்',
  'soursop juice': 'முள்ளாத்தா பழச்சாறு (சவர்சாப்)',
  'soursop': 'முள்ளாத்தா பழம்',
  'strawberry sparkling': 'ஸ்பார்க்ளிங் ஸ்ட்ராபெரி',
  'strawberry juice': 'ஸ்ட்ராபெரி பழச்சாறு',
  'strawberry': 'ஸ்ட்ராபெரி',
  'passion juice': 'பாஷன் பழச்சாறு',
  'passion fruit': 'பாஷன் பழம்',
  'watermelon juice': 'தர்பூசணி சாறு',
  'watermelon': 'தர்பூசணி',
  'pineapple juice': 'அன்னாசி பழச்சாறு',
  'pineapple': 'அன்னாசி',
  'lemon juice': 'எலுமிச்சை சாறு',
  'lemonade': 'எலுமிச்சை பழச்சாறு',
  'lemon': 'எலுமிச்சை',
  'grape juice': 'திராட்சை பழச்சாறு',
  'grape': 'திராட்சை',
  'pomegranate juice': 'மாதுளை பழச்சாறு',
  'pomegranate': 'மாதுளை',
  'fresh organic blend': 'புதிய இயற்கை கலவை',
  'organic blend': 'இயற்கை கலவை',
  'pure juice': 'தூய பழச்சாறு',
  'fruit juice': 'பழச்சாறு',
  'fresh juice': 'புதிய பழச்சாறு',
  '100% pure juice': '100% தூய பழச்சாறு',
  'organic': 'இயற்கை',
  'natural': 'இயற்கை',
  'fresh': 'புதிய',
  'best seller': 'அதிகம் விற்பனையாகும்',
  'electrolyte rich': 'எலக்ட்ரோலைட் நிறைந்தது',
  'superfruit': 'சூப்பர்பழம்',
  'low calorie': 'குறைந்த கலோரி',
  'sparkling fruit': 'ஸ்பார்க்ளிங் பழச்சாறு',
  'tropical & exotic': 'பாரம்பரிய பழங்கள்',
  'hydration boost': 'உடல் நீரேற்றம்',
  'cold pressed': 'குளிர் அழுத்தப்பட்ட',
}

/**
 * Synchronous instant Tamil translation helper for known terms
 */
export function getTamilInstantTranslation(text) {
  if (!text) return ''
  const trimmed = String(text).trim()
  if (TAMIL_UI_DICTIONARY[trimmed]) return TAMIL_UI_DICTIONARY[trimmed]
  
  const lower = trimmed.toLowerCase()
  if (BEVERAGE_DICTIONARY[lower]) return BEVERAGE_DICTIONARY[lower]

  // Check product IDs
  if (TAMIL_PRODUCT_TRANSLATIONS[lower]?.name) return TAMIL_PRODUCT_TRANSLATIONS[lower].name
  return ''
}

/**
 * High-accuracy translation from English to Tamil.
 * Prioritizes curated beverage dictionary, then Google Translate API,
 * then Google Input Tools transliteration, and falls back to original text.
 */
export async function translateToTamil(text, signal) {
  const en = String(text || '').trim()
  if (!en) return ''

  // 1. Instant dictionary check
  const instant = getTamilInstantTranslation(en)
  if (instant) return instant

  // 2. Google Translate free API for authentic Tamil grammar/meaning
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ta&dt=t&q=` +
      encodeURIComponent(en)
    const res = await fetch(url, { signal })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data?.[0])) {
        const fullTranslation = data[0]
          .map((chunk) => chunk?.[0] || '')
          .join('')
          .trim()
        if (fullTranslation && !/^[A-Za-z0-9\s.,!?-]+$/.test(fullTranslation)) {
          return fullTranslation
        }
      }
    }
  } catch (err) {
    // Continue to transliteration fallback
  }

  // 3. Fallback to Google Input Tools transliteration
  try {
    const translit = await transliterateToTamil(en, signal)
    if (translit) return translit
  } catch (err) {
    // Continue to fallback
  }

  return en
}

/**
 * Intelligent helper to auto-translate or transliterate a product for the Admin panel.
 * Tries the authentic dictionary first; falls back to Google Translate and Input Tools.
 */
export async function autoTranslateProduct(prod) {
  if (!prod) return {}

  // Check predefined catalog translations
  const known = TAMIL_PRODUCT_TRANSLATIONS[prod.id]

  let nameTa = prod.nameTa || prod.name_ta || known?.name || ''
  let subtitleTa = prod.subtitleTa || prod.subtitle_ta || known?.subtitle || ''
  let descriptionTa = prod.descriptionTa || prod.description_ta || known?.description || ''
  let categoryTa = prod.categoryTa || prod.category_ta || known?.category || TAMIL_UI_DICTIONARY[prod.category] || ''
  let badgeTa = prod.badgeTa || prod.badge_ta || known?.badge || TAMIL_UI_DICTIONARY[prod.badge] || ''

  // Translate with Google Translate + dictionary if empty
  if (!nameTa && prod.name) {
    nameTa = await translateToTamil(prod.name)
  }
  if (!subtitleTa && prod.subtitle) {
    subtitleTa = await translateToTamil(prod.subtitle)
  }
  if (!categoryTa && prod.category) {
    categoryTa = TAMIL_UI_DICTIONARY[prod.category] || (await translateToTamil(prod.category))
  }
  if (!badgeTa && prod.badge) {
    badgeTa = TAMIL_UI_DICTIONARY[prod.badge] || (await translateToTamil(prod.badge))
  }
  if (!descriptionTa && prod.description) {
    descriptionTa = await translateToTamil(prod.description)
  }

  return {
    name_ta: nameTa,
    nameTa,
    subtitle_ta: subtitleTa,
    subtitleTa,
    description_ta: descriptionTa,
    descriptionTa,
    category_ta: categoryTa,
    categoryTa,
    badge_ta: badgeTa,
    badgeTa,
    ingredients_ta: known?.ingredients || [],
    ingredientsTa: known?.ingredients || [],
  }
}

/**
 * Get the localized product name based on current language ('en' | 'ta')
 */
export function getProductName(product, lang = 'en') {
  if (!product) return ''
  if (lang === 'ta') {
    return (
      product.nameTa ||
      product.name_ta ||
      TAMIL_PRODUCT_TRANSLATIONS[product.id]?.name ||
      getTamilInstantTranslation(product.name) ||
      product.name
    )
  }
  return product.name
}

/**
 * Get the localized product subtitle based on current language
 */
export function getProductSubtitle(product, lang = 'en') {
  if (!product) return ''
  if (lang === 'ta') {
    return (
      product.subtitleTa ||
      product.subtitle_ta ||
      TAMIL_PRODUCT_TRANSLATIONS[product.id]?.subtitle ||
      getTamilInstantTranslation(product.subtitle) ||
      product.subtitle
    )
  }
  return product.subtitle
}

/**
 * Get the localized product description
 */
export function getProductDescription(product, lang = 'en') {
  if (!product) return ''
  if (lang === 'ta') {
    return (
      product.descriptionTa ||
      product.description_ta ||
      TAMIL_PRODUCT_TRANSLATIONS[product.id]?.description ||
      getTamilInstantTranslation(product.description) ||
      product.description
    )
  }
  return product.description
}

/**
 * Get the localized product category
 */
export function getProductCategory(categoryOrProduct, lang = 'en') {
  const cat = typeof categoryOrProduct === 'string'
    ? categoryOrProduct
    : (categoryOrProduct?.category || '')

  if (lang === 'ta') {
    if (typeof categoryOrProduct === 'object') {
      if (categoryOrProduct?.categoryTa || categoryOrProduct?.category_ta) {
        return categoryOrProduct.categoryTa || categoryOrProduct.category_ta
      }
      if (categoryOrProduct?.id && TAMIL_PRODUCT_TRANSLATIONS[categoryOrProduct.id]?.category) {
        return TAMIL_PRODUCT_TRANSLATIONS[categoryOrProduct.id].category
      }
    }
    return TAMIL_UI_DICTIONARY[cat] || getTamilInstantTranslation(cat) || cat
  }
  return cat
}

/**
 * Get the localized product badge
 */
export function getProductBadge(badgeOrProduct, lang = 'en') {
  const b = typeof badgeOrProduct === 'string'
    ? badgeOrProduct
    : (badgeOrProduct?.badge || '')

  if (lang === 'ta') {
    if (typeof badgeOrProduct === 'object') {
      if (badgeOrProduct?.badgeTa || badgeOrProduct?.badge_ta) {
        return badgeOrProduct.badgeTa || badgeOrProduct.badge_ta
      }
      if (badgeOrProduct?.id && TAMIL_PRODUCT_TRANSLATIONS[badgeOrProduct.id]?.badge) {
        return TAMIL_PRODUCT_TRANSLATIONS[badgeOrProduct.id].badge
      }
    }
    return TAMIL_UI_DICTIONARY[b] || getTamilInstantTranslation(b) || b
  }
  return b
}

/**
 * SQL migration query to run in Supabase SQL editor to create the Tamil columns
 */
export const SQL_MIGRATION = `-- Run this in your Supabase SQL Editor:
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name_ta TEXT,
ADD COLUMN IF NOT EXISTS subtitle_ta TEXT,
ADD COLUMN IF NOT EXISTS description_ta TEXT,
ADD COLUMN IF NOT EXISTS category_ta TEXT,
ADD COLUMN IF NOT EXISTS badge_ta TEXT,
ADD COLUMN IF NOT EXISTS ingredients_ta TEXT[],
ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT ARRAY['Cold-Extracted Purity', 'Zero Synthetic Additives', 'Traditional Wellness Heritage']::text[],
ADD COLUMN IF NOT EXISTS seals JSONB DEFAULT '[{"title":"100% Natural","desc":"Pure Herbal Ingredients"},{"title":"No Preservatives","desc":"Zero Artificial Colors"},{"title":"Fresh Express","desc":"Direct Farm Shipping"},{"title":"Satisfaction","desc":"Guaranteed Quality"}]'::jsonb,
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'In Stock • Ships Today',
ADD COLUMN IF NOT EXISTS how_to_use JSONB DEFAULT '{"prepTitle":"1. Prep","prepStep":"","blendTitle":"2. Blend","blendStep":"","enjoyTitle":"3. Enjoy","enjoyStep":""}'::jsonb;

-- Update initial rows with authentic Tamil translations:
UPDATE products SET 
  name_ta = 'கொய்யா பழச்சாறு', 
  subtitle_ta = '100% தூய இயற்கை கொய்யா அமிர்தம்', 
  category_ta = '100% தூய பழச்சாறு', 
  badge_ta = 'அதிகம் விற்பனையாகும்',
  description_ta = 'மரத்திலிருந்தே பழுத்த இளஞ்சிவப்பு கொய்யாப்பழங்களில் இருந்து தயாரிக்கப்பட்ட தூய சுவையான இயற்கை பானம். வைட்டமின் சி மற்றும் இயற்கை நார்ச்சத்து நிறைந்தது.'
WHERE id = 'guava-juice';

UPDATE products SET 
  name_ta = 'இயற்கை இளநீர்', 
  subtitle_ta = 'பசுமையான இளம் தேங்காய் நீரேற்றம்', 
  category_ta = 'உடல் நீரேற்றம்', 
  badge_ta = 'எலக்ட்ரோலைட் நிறைந்தது',
  description_ta = 'பச்சை இளம் தேங்காய்களிலிருந்து உடனடியாக பிரித்தெடுக்கப்பட்ட புத்துணர்ச்சியூட்டும் இயற்கை இளநீர். சர்க்கரை சேர்க்கப்படாத 5 அத்தியாவசிய எலக்ட்ரோலைட்டுகள் நிறைந்தது.'
WHERE id = 'coconut-water';

UPDATE products SET 
  name_ta = 'முள்ளாத்தா பழச்சாறு (சவர்சாப்)', 
  subtitle_ta = 'புதிய குவானபானா பழச்சாறு', 
  category_ta = 'பாரம்பரிய பழங்கள்', 
  badge_ta = 'சூப்பர்பழம்',
  description_ta = 'அரிய பாரம்பரிய முள்ளாத்தா பழத்திலிருந்து தயாரிக்கப்பட்ட சுவையான கிரீமி இயற்கை பானம். செரிமானத்திற்கும் நோய் எதிர்ப்பு சக்திக்கும் உகந்தது.'
WHERE id = 'soursop-juice';

UPDATE products SET 
  name_ta = 'ஸ்பார்க்ளிங் ஸ்ட்ராபெரி', 
  subtitle_ta = 'இயற்கை ஸ்ட்ராபெரி சோடா பானம்', 
  category_ta = 'ஸ்பார்க்ளிங் பழச்சாறு', 
  badge_ta = 'குறைந்த கலோரி',
  description_ta = 'உண்மையான ஸ்ட்ராபெர்ரி பழங்களின் புத்துணர்ச்சியூட்டும் சுவை. மிதமான நுரை குமிழ்களுடன் உங்கள் தாகத்தை தணிக்கும் சிறந்த இயற்கை குளிர்பானம்.'
WHERE id = 'strawberry-sparkling';

UPDATE products SET 
  name_ta = 'பாஷன் பழச்சாறு', 
  subtitle_ta = 'தித்திக்கும் வெப்பமண்டல பழச்சாறு', 
  category_ta = '100% தூய பழச்சாறு', 
  badge_ta = 'பிரீமியம் சுவை',
  description_ta = 'அடர்ந்த இனிப்பு மற்றும் புளிப்பு சுவை கொண்ட தூய பாஷன் பழச்சாறு. வைட்டமின் ஏ மற்றும் சி சத்துக்கள் அடங்கிய உற்சாக பானம்.'
WHERE id = 'passion-juice';

UPDATE products SET 
  name_ta = 'தங்க மாம்பழச்சாறு (மேங்கோ ஜிங்)', 
  subtitle_ta = 'அல்போன்சா மாம்பழ அமிர்தம்', 
  category_ta = '100% தூய பழச்சாறு', 
  badge_ta = 'மக்களின் விருப்பம்',
  description_ta = 'சூரிய ஒளியில் கனிந்த தங்க நிற அல்போன்சா மாம்பழங்களின் தித்திக்கும் சுவை. லேசான இஞ்சி மற்றும் எலுமிச்சை தொடுதலுடன் தயாரிக்கப்பட்டது.'
WHERE id = 'mango-zing';
`
