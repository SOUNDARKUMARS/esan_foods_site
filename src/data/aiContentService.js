/**
 * aiContentService.js
 * AI Content Generation Service using OpenRouter and GLM 5.3 Flash (z-ai/glm-5.3-flash)
 * Crafts authentic, human-touch artisanal product descriptions and metadata
 * tailored specifically for Esan Foods (herbal foods, traditional powders, cold-pressed oils).
 */

export const GLM_MODEL = 'z-ai/glm-5.3-flash'

/**
 * Resolves the active OpenRouter API key from env or localStorage
 */
export function getOpenRouterApiKey() {
  try {
    const custom = localStorage.getItem('esan_openrouter_api_key')
    if (custom && custom.trim()) return custom.trim()
  } catch (e) {
    // ignore
  }

  return (
    import.meta.env?.VITE_OPENROUTER_API_KEY ||
    import.meta.env?.OPENROUTER_API_KEY ||
    (typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY) ||
    ''
  )
}

/**
 * Allows user or admin to update key in local storage if desired
 */
export function setCustomOpenRouterApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem('esan_openrouter_api_key', key.trim())
    } else {
      localStorage.removeItem('esan_openrouter_api_key')
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Palette options mapped to botanical types for harmonious visuals
 */
const HARMONIOUS_PALETTES = [
  { name: 'Mint Cream', bgSoft: '#ecfdf5', color: '#059669' }, // Green herbs, moringa, curry leaf, neem
  { name: 'Amber Glow', bgSoft: '#fffbeb', color: '#d97706' }, // Turmeric, ginger, honey, jaggery
  { name: 'Rose Glow', bgSoft: '#fff1f2', color: '#e11d48' },  // Hibiscus, beetroot, rose petal
  { name: 'Sky Mist', bgSoft: '#f0f9ff', color: '#0284c7' },   // Tender coconut, cooling drinks
  { name: 'Pure Coconut', bgSoft: '#f8fafc', color: '#475569' },// Ashwagandha, seeds, roots
  { name: 'Golden Sun', bgSoft: '#fefce8', color: '#ca8a04' }, // Sesame oil, ghee, dal powders
  { name: 'Lavender Herb', bgSoft: '#faf5ff', color: '#7c3aed' }, // Triphala, brahmi, specialized flowers
]

/**
 * Extracts non-empty, user-typed fields from current editor state so AI knows what to preserve and polish.
 */
export function extractUserTypedFields(prod) {
  if (!prod || typeof prod !== 'object') return null
  const fields = {}

  // Name
  if (prod.name && prod.name.trim()) {
    fields.name = prod.name.trim()
  }

  // Price & Original Price
  if (prod.price !== '' && prod.price !== null && prod.price !== undefined) {
    const p = parseFloat(prod.price)
    if (!isNaN(p) && p > 0) fields.price = p
  }
  if (prod.originalPrice !== '' && prod.originalPrice !== null && prod.originalPrice !== undefined) {
    const op = parseFloat(prod.originalPrice)
    if (!isNaN(op) && op > 0) fields.originalPrice = op
  }

  // Volume
  if (prod.volume && prod.volume.trim()) {
    fields.volume = prod.volume.trim()
  }

  // Category
  if (prod.category && prod.category.trim() && prod.category !== 'All' && prod.category !== 'All Products') {
    fields.category = prod.category.trim()
  }

  // Subtitle
  if (prod.subtitle && prod.subtitle.trim() && prod.subtitle !== 'இயற்கை பானம்') {
    fields.subtitle = prod.subtitle.trim()
  }

  // Badge
  if (prod.badge && prod.badge.trim()) {
    fields.badge = prod.badge.trim()
  }

  // Description
  if (prod.description && prod.description.trim()) {
    fields.description = prod.description.trim()
  }

  // Ingredients
  if (Array.isArray(prod.ingredients) && prod.ingredients.length > 0) {
    const valid = prod.ingredients.map((s) => String(s || '').trim()).filter(Boolean)
    if (valid.length > 0) fields.ingredients = valid
  }

  // Tasting Notes
  if (Array.isArray(prod.tastingNotes) && prod.tastingNotes.length > 0) {
    const valid = prod.tastingNotes.map((s) => String(s || '').trim()).filter(Boolean)
    if (valid.length > 0) fields.tastingNotes = valid
  }

  // Highlights
  if (Array.isArray(prod.highlights) && prod.highlights.length > 0) {
    const valid = prod.highlights.map((s) => String(s || '').trim()).filter(Boolean)
    if (valid.length > 0) fields.highlights = valid
  }

  // Quantity Options
  if (Array.isArray(prod.quantityOptions)) {
    if (prod.quantityOptions.length === 0) {
      fields.quantityOptions = '0 options (Customer purchases directly with quantity stepper at base unit price)'
    } else {
      fields.quantityOptions = prod.quantityOptions.map((o) => ({
        title: o.title || '',
        size: o.size || '',
        price: o.price || 0,
        badge: o.badge || '',
        discountText: o.discountText || '',
      }))
    }
  }

  // How to use
  const howToUse = {}
  if (prod.prepStep && prod.prepStep.trim()) howToUse.prep = `${prod.prepTitle ? prod.prepTitle + ': ' : ''}${prod.prepStep.trim()}`
  if (prod.blendStep && prod.blendStep.trim()) howToUse.mixOrBlend = `${prod.blendTitle ? prod.blendTitle + ': ' : ''}${prod.blendStep.trim()}`
  if (prod.enjoyStep && prod.enjoyStep.trim()) howToUse.enjoy = `${prod.enjoyTitle ? prod.enjoyTitle + ': ' : ''}${prod.enjoyStep.trim()}`
  if (Object.keys(howToUse).length > 0) fields.howToUse = howToUse

  // Nutrition
  const nut = {}
  const nutSrc = prod.nutrition || prod
  if (nutSrc.calories && String(nutSrc.calories).trim()) nut.calories = String(nutSrc.calories).trim()
  if (nutSrc.sugar && String(nutSrc.sugar).trim()) nut.sugar = String(nutSrc.sugar).trim()
  if (nutSrc.carbs && String(nutSrc.carbs).trim()) nut.carbs = String(nutSrc.carbs).trim()
  if (nutSrc.vitaminC && String(nutSrc.vitaminC).trim()) nut.vitaminC = String(nutSrc.vitaminC).trim()
  if (nutSrc.organic && String(nutSrc.organic).trim()) nut.organic = String(nutSrc.organic).trim()
  if (Object.keys(nut).length > 0) fields.nutrition = nut

  // Tamil fields
  if (prod.name_ta && prod.name_ta.trim() && prod.name_ta !== 'தமிழ் பெயர்') fields.name_ta = prod.name_ta.trim()
  if (prod.subtitle_ta && prod.subtitle_ta.trim() && prod.subtitle_ta !== 'இயற்கை பானம்') fields.subtitle_ta = prod.subtitle_ta.trim()
  if (prod.description_ta && prod.description_ta.trim()) fields.description_ta = prod.description_ta.trim()

  return Object.keys(fields).length > 0 ? fields : null
}

/**
 * Generate complete artisanal product content using OpenRouter GLM 5.3 Flash
 *
 * @param {string} productName - The raw name entered by admin (e.g. "Moringa Leaf Powder")
 * @param {Object|Array} [options={}] - Options or list of available categories
 * @param {Array<string>} [options.availableCategories=[]] - List of current store categories
 * @param {string} [options.userNotes=''] - Natural language instructions from the admin
 * @param {Object} [options.existingProduct=null] - Currently entered field values in editor
 * @param {AbortSignal} [signal] - Optional fetch abort signal
 * @returns {Promise<Object>} Structured product data ready for editorProduct state
 */
export async function generateProductContentWithAi(
  productName,
  options = {},
  signal
) {
  const cleanName = String(productName || '').trim()
  if (!cleanName) {
    throw new Error('Please enter a product name first before generating content.')
  }

  // Backward compatibility if second argument is just an array of categories
  const availableCategories = Array.isArray(options)
    ? options
    : options?.availableCategories || []
  const userNotes = (typeof options === 'object' && !Array.isArray(options) ? options?.userNotes : '') || ''
  const existingProduct = (typeof options === 'object' && !Array.isArray(options) ? options?.existingProduct : null) || null
  const userTypedFields = extractUserTypedFields(existingProduct)

  const apiKey = getOpenRouterApiKey()
  if (!apiKey) {
    throw new Error('OpenRouter API Key not found. Please verify your .env file or settings.')
  }

  const catListStr = availableCategories && availableCategories.length > 0
    ? availableCategories.filter((c) => c && c !== 'All' && c !== 'All Products').join(', ')
    : 'Herbal Leaf Powders, Organic Foods, Natural Superfoods, Traditional Health Mix, Wellness Blends'

  const systemPrompt = `You are a master traditional herbalist, artisanal food artisan, and authentic copywriter for "Esan Foods" (ஏசன் ஃபுட்ஸ்) — a heritage Tamil Nadu herbal wellness brand dedicated to 100% pure native foods, stone-ground herbal powders, traditional health mixes, and pure natural nutrition.

CRITICAL VOICE & TONE GUIDELINES:
- Write with a warm, genuine "HUMAN TOUCH". Write like a passionate organic farmer, traditional village elder, or grandmother sharing trusted wellness wisdom.
- AVOID generic corporate AI clichés, empty buzzwords (like "cutting-edge", "game-changing", "revolutionary"), or robotic marketing fluff.
- Be sensory, evocative, grounded in nature and time-tested South Indian traditions.
- Highlight natural harvesting, shade-drying or stone-ground processing, pure aroma, real earthy taste, and genuine health benefits.
- You must return ONLY a single, valid JSON object with NO preamble and NO conversational filler.

OUTPUT JSON SCHEMA:
{
  "name": string (clean refined English product title),
  "subtitle": string (poetic, warm, benefit-rich subtitle, 8-15 words),
  "category": string (If the product fits an existing category from: [${catListStr}], use that exact name. If it DOES NOT fit any of them, create an appropriate, natural new category name, e.g. "Cold-Pressed Oils", "Forest Honey", "Herbal Juices", "Traditional Lehyams"),
  "category_ta": string (Tamil translation for category),
  "isNewCategory": boolean (true if a new category was created because none of the existing ones fit, false otherwise),
  "volume": string (e.g. "250g", "100g", "500g", "500ml"),
  "price": number (realistic price in Indian Rupees ₹, e.g. 199, 249, 299, 349),
  "originalPrice": number (realistic original MRP ₹, approx 15-30% higher than price, e.g. 299, 349, 399),
  "badge": string (e.g. "100% Organic", "Bestseller", "Farm Fresh", "Immunity Booster", "Heritage Recipe"),
  "stockStatus": string (e.g. "In Stock • Fresh Batch Ships Today"),
  "description": string (2-3 soulful paragraphs describing how the herb/food is grown, traditional low-heat or stone-ground method, rich aroma and taste, how it nourishes the body, and 100% promise of zero preservatives, chemicals or artificial colors),
  "quantityOptions": [
    {
      "id": string (e.g. "opt-1"),
      "title": string (e.g. "Single Item" or "250g Glass Jar"),
      "size": string (e.g. "250g"),
      "price": number (in ₹),
      "badge": string (e.g. "POPULAR", "BEST VALUE", or ""),
      "discountText": string (e.g. "Save 10%" or "")
    }
  ],
  "tastingNotes": [string, string, string] (3-4 sensory notes e.g. "Earthy & Nutty", "Fresh Shade-Dried Aroma", "Smooth Stone-Ground Finish"),
  "ingredients": [string, string] (2-4 pure ingredients with botanical details where appropriate),
  "highlights": [string, string, string, string] (4 clear, punchy benefit bullet points),
  "seals": [
    { "title": string (3-4 words), "desc": string (3-5 words) },
    { "title": string, "desc": string },
    { "title": string, "desc": string },
    { "title": string, "desc": string }
  ],
  "nutrition": {
    "calories": string (e.g. "32 kcal per 10g"),
    "sugar": string (e.g. "0g Added Sugar"),
    "carbs": string (e.g. "4.2g"),
    "vitaminC": string (e.g. "High Natural Plant Antioxidants"),
    "organic": string (e.g. "100% Certified Herbal")
  },
  "howToUse": {
    "prepTitle": string (e.g. "1. Scoop & Measure"),
    "prepStep": string (e.g. "Take 1 leveled teaspoon (approx. 5g) of powder."),
    "blendTitle": string (e.g. "2. Stir or Blend"),
    "blendStep": string (e.g. "Mix thoroughly into a glass of warm water, fresh buttermilk, or your morning smoothie."),
    "enjoyTitle": string (e.g. "3. Daily Nourishment"),
    "enjoyStep": string (e.g. "Consume daily on an empty stomach for sustained natural energy and holistic vitality.")
  },
  "name_ta": string (authentic Tamil translation of product name in proper Tamil script),
  "subtitle_ta": string (evocative Tamil subtitle in natural, fluent Tamil),
  "badge_ta": string (Tamil badge e.g. "100% தூய இயற்கை" or "அதிகம் விற்பனையாகும்"),
  "description_ta": string (detailed, culturally natural Tamil description explaining heritage and health benefits),
  "ingredients_ta": [string, string] (ingredients translated in Tamil)
}`

  let existingFieldsPrompt = ''
  if (userTypedFields) {
    existingFieldsPrompt = `
EXISTING USER-ENTERED FIELDS (CRITICAL: DO NOT DISCARD OR OVERWRITE — REWRITE & REFINE NICELY):
The user has already entered the following content in some fields:
${JSON.stringify(userTypedFields, null, 2)}

MANDATORY RULES FOR EXISTING USER FIELDS:
1. DO NOT OVERWRITE OR DISCARD: The user explicitly entered these values. You must NOT overwrite or erase them with generic unrelated text.
2. REWRITE & POLISH NICELY BASED ON USER'S POINTS:
   - Extract the key points, ideas, ingredients, health benefits, or notes from what the user already typed.
   - Beautifully rewrite, enhance, and polish them with a warm human touch in the authentic Esan Foods voice.
   - For example: if the user typed rough notes in description (e.g. "good for joint pain and natural energy, pure native harvest"), polish that exact concept into rich, soulful artisanal prose celebrating those specific benefits.
   - If the user entered specific ingredients: PRESERVE those ingredients and refine them with authentic botanical touches.
   - If the user specified a price (₹${userTypedFields.price || ''}), original price, volume ("${userTypedFields.volume || ''}"), or category: KEEP these exact values in your output JSON.
   - If the user specified 0 package options, set "quantityOptions": [].
   - If the user specified custom package options, KEEP those options and refine their titles and discount labels.
3. FILL UNFILLED FIELDS: For any fields the user left blank or unprovided, generate complete, authentic content that naturally connects with the user's provided points.
`
  }

  const userPrompt = `Generate complete, human-touch product details for this herbal food product:
Product Name: "${cleanName}"
Store Brand: Esan Foods (ஏசன் ஃபுட்ஸ்)
Available Store Categories: ${catListStr}
${userNotes ? `Admin Notes & Specific Instructions:\n"""${userNotes}"""\n` : ''}
${existingFieldsPrompt}
CRITICAL RULES FOR ADMIN INSTRUCTIONS:
1. Category: Check the available store categories: [${catListStr}].
   - If this product fits one of them, use that exact name, and set "isNewCategory": false.
   - If this product does NOT fit any of them, create an appropriate new category name (e.g. "Pure Honey", "Cold-Pressed Oils", "Traditional Sweets"), translate it to Tamil in "category_ta", and set "isNewCategory": true.
2. Packaging & Quantity Options:
${userNotes ? `   - If the Admin specified packaging options in the notes above (e.g. "only 2 package options: 250g for ₹220 and 500g for ₹400"), YOU MUST STRICTLY GENERATE ONLY THOSE SPECIFIED OPTIONS in the "quantityOptions" array! Do NOT add standard options if custom packages were given.` : (userTypedFields?.quantityOptions ? '   - Respect the user-configured packaging options above.' : '   - Generate standard calibrated quantity options: Single Item, Pack of 6 (~10% off), Pack of 12 (~15% off).')}
3. Incorporate any specific instructions, ingredients, prices, or health claims mentioned in Admin Notes and Existing Fields naturally into the content.
4. Voice: Warm, authentic, human-touch South Indian wellness tradition.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://esanfoods.com',
      'X-Title': 'Esan Foods Admin AI Assistant',
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    let errBody = ''
    try {
      errBody = await res.text()
    } catch (e) {}
    throw new Error(
      `OpenRouter request failed (${res.status} ${res.statusText}): ${errBody || 'Unknown error'}`
    )
  }

  const json = await res.json()
  const rawContent = json?.choices?.[0]?.message?.content
  if (!rawContent) {
    throw new Error('AI returned an empty response. Please try again.')
  }

  // Parse JSON, handling potential markdown fences if present
  let parsed = null
  try {
    parsed = JSON.parse(rawContent)
  } catch (err) {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    try {
      parsed = JSON.parse(cleaned)
    } catch (err2) {
      const start = rawContent.indexOf('{')
      const end = rawContent.lastIndexOf('}')
      if (start !== -1 && end > start) {
        parsed = JSON.parse(rawContent.slice(start, end + 1))
      } else {
        throw new Error('Could not parse AI response as JSON: ' + err2.message)
      }
    }
  }

  const userHasZeroOpts = Boolean(
    userTypedFields?.quantityOptions &&
    typeof userTypedFields.quantityOptions === 'string' &&
    userTypedFields.quantityOptions.includes('0 options')
  )

  // Sanitize numeric prices (honoring user-entered price if user explicitly entered one)
  const cleanPrice = userTypedFields?.price || parseFloat(String(parsed.price || '').replace(/[^0-9.]/g, '')) || 249
  let cleanOriginalPrice = userTypedFields?.originalPrice || parseFloat(String(parsed.originalPrice || '').replace(/[^0-9.]/g, ''))
  if (!cleanOriginalPrice || cleanOriginalPrice <= cleanPrice) {
    cleanOriginalPrice = Math.round(cleanPrice * 1.25)
  }

  const volume = userTypedFields?.volume || parsed.volume || '250g'

  // Quantity options handling: support 0 options or custom options specified in prompt/editor
  let quantityOptions = []
  if (userHasZeroOpts && (!Array.isArray(parsed.quantityOptions) || parsed.quantityOptions.length === 0)) {
    quantityOptions = []
  } else if (Array.isArray(parsed.quantityOptions) && parsed.quantityOptions.length > 0) {
    quantityOptions = parsed.quantityOptions.map((opt, i) => {
      const optPrice = parseFloat(String(opt.price || '').replace(/[^0-9.]/g, '')) || cleanPrice
      return {
        id: opt.id || `opt-${i + 1}`,
        title: opt.title || `Option ${i + 1}`,
        size: opt.size || volume,
        price: optPrice,
        badge: opt.badge || '',
        discountText: opt.discountText || '',
      }
    })
  } else if (userHasZeroOpts) {
    quantityOptions = []
  } else {
    // Generate calibrated quantity options with bulk discounts
    quantityOptions = [
      {
        id: 'opt-1',
        title: 'Single Item',
        size: volume,
        price: cleanPrice,
        badge: '',
        discountText: '',
      },
      {
        id: 'opt-2',
        title: 'Pack of 6',
        size: 'Save 10%',
        price: Number((cleanPrice * 6 * 0.9).toFixed(2)),
        badge: 'POPULAR',
        discountText: 'Save 10%',
      },
      {
        id: 'opt-3',
        title: 'Pack of 12',
        size: 'Save 15%',
        price: Number((cleanPrice * 12 * 0.85).toFixed(2)),
        badge: 'BEST VALUE',
        discountText: 'Save 15%',
      },
    ]
  }

  // If first quantity option has a price, ensure cleanPrice reflects it
  const primaryPrice = (quantityOptions.length > 0 && quantityOptions[0]?.price > 0)
    ? quantityOptions[0].price
    : cleanPrice

  // Validate or fallback color and bgSoft
  let chosenColor = parsed.color || '#059669'
  let chosenBgSoft = parsed.bgSoft || '#ecfdf5'
  const matchedPalette = HARMONIOUS_PALETTES.find(
    (p) => p.color.toLowerCase() === chosenColor.toLowerCase()
  )
  if (!matchedPalette && (!chosenColor.startsWith('#') || chosenColor.length < 7)) {
    chosenColor = '#059669'
    chosenBgSoft = '#ecfdf5'
  }

  // Ensure seals is always an array of 4 items
  let seals = Array.isArray(parsed.seals) ? parsed.seals : []
  const defaultSeals = [
    { title: '100% Natural', desc: 'Pure Native Herbs' },
    { title: 'Zero Chemicals', desc: 'No Preservatives' },
    { title: 'Stone Ground', desc: 'Nutrient-Rich Milling' },
    { title: 'Guaranteed Quality', desc: 'Authentic Heritage' },
  ]
  while (seals.length < 4) {
    seals.push(defaultSeals[seals.length])
  }
  seals = seals.slice(0, 4).map((s, idx) => ({
    title: s?.title || defaultSeals[idx].title,
    desc: s?.desc || defaultSeals[idx].desc,
  }))

  return {
    name: parsed.name || cleanName,
    subtitle: parsed.subtitle || '',
    category: parsed.category || availableCategories[0] || 'Herbal Leaf Powders',
    isNewCategory: Boolean(parsed.isNewCategory),
    volume: volume,
    price: primaryPrice,
    originalPrice: cleanOriginalPrice,
    badge: parsed.badge || '100% Natural',
    stockStatus: parsed.stockStatus || 'In Stock • Ships Today',
    description: parsed.description || '',
    quantityOptions: quantityOptions,
    tastingNotes: Array.isArray(parsed.tastingNotes) && parsed.tastingNotes.length > 0
      ? parsed.tastingNotes
      : ['Pure Herbal Essence', 'Natural Aroma', 'Stone-Ground Texture'],
    ingredients: Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0
      ? parsed.ingredients
      : [`100% Pure ${cleanName}`, 'Natural Heritage Harvest'],
    highlights: Array.isArray(parsed.highlights) && parsed.highlights.length > 0
      ? parsed.highlights
      : [
          'Stone-ground at low heat to preserve raw vitamins',
          'Zero synthetic colors, flavors, or chemical preservatives',
          'Sourced from native organic farms in Tamil Nadu',
          'Rich in authentic natural antioxidants and minerals',
        ],
    seals: seals,
    nutrition: {
      calories: parsed.nutrition?.calories || '32 kcal',
      sugar: parsed.nutrition?.sugar || '0g (Natural)',
      carbs: parsed.nutrition?.carbs || '4.5g',
      vitaminC: parsed.nutrition?.vitaminC || 'High Antioxidant Value',
      organic: parsed.nutrition?.organic || '100% Certified Herbal',
    },
    howToUse: {
      prepTitle: parsed.howToUse?.prepTitle || '1. Scoop & Measure',
      prepStep: parsed.howToUse?.prepStep || 'Take 1 leveled teaspoon (approx. 5g) of powder.',
      blendTitle: parsed.howToUse?.blendTitle || '2. Mix or Blend',
      blendStep: parsed.howToUse?.blendStep || 'Mix smoothly into warm water, tender coconut water, or buttermilk.',
      enjoyTitle: parsed.howToUse?.enjoyTitle || '3. Daily Vitality',
      enjoyStep: parsed.howToUse?.enjoyStep || 'Consume every morning for sustained natural energy and holistic wellness.',
    },
    // Tamil localization fields
    name_ta: parsed.name_ta || '',
    nameTa: parsed.name_ta || '',
    subtitle_ta: parsed.subtitle_ta || '',
    subtitleTa: parsed.subtitle_ta || '',
    category_ta: parsed.category_ta || '',
    categoryTa: parsed.category_ta || '',
    badge_ta: parsed.badge_ta || '',
    badgeTa: parsed.badge_ta || '',
    description_ta: parsed.description_ta || '',
    descriptionTa: parsed.description_ta || '',
    ingredients_ta: Array.isArray(parsed.ingredients_ta) ? parsed.ingredients_ta : [],
    ingredientsTa: Array.isArray(parsed.ingredients_ta) ? parsed.ingredients_ta : [],
  }
}
