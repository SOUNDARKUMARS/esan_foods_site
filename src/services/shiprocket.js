import { supabase } from '../lib/supabase'

/**
 * Invokes the deployed Supabase Edge Function 'shiprocket'.
 * Throws when Supabase invoke returns an error or when response data contains an error.
 *
 * @param {string} action - Action name ('serviceability', 'createOrder', 'track')
 * @param {Object} payload - Action-specific payload
 * @returns {Promise<any>}
 */
async function invokeShiprocket(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke('shiprocket', {
    body: {
      action,
      ...payload,
    },
  })

  if (error) {
    const errorMsg = error.message || 'Failed to communicate with Shiprocket service'
    throw new Error(errorMsg)
  }

  if (data && data.error) {
    const dataErrorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
    throw new Error(dataErrorMsg)
  }

  return data
}

/**
 * Check courier serviceability for a destination pincode.
 *
 * @param {string|number} deliveryPincode - 6-digit destination postal code
 * @param {number} weight - Package weight in kilograms
 * @param {number|boolean} cod - Cash on delivery indicator (0 or 1)
 * @returns {Promise<Array<{courier_id: number, name: string, rate: number, etd: string, days: number}>>}
 */
export async function checkServiceability(deliveryPincode, weight, cod = 0) {
  const cleanPincode = String(deliveryPincode || '').trim()
  const cleanWeight = Number(weight) > 0 ? Number(weight) : 0.5
  const cleanCod = cod === 1 || cod === true ? 1 : 0

  if (!cleanPincode || cleanPincode.length !== 6) {
    throw new Error('Please provide a valid 6-digit pincode.')
  }

  return await invokeShiprocket('serviceability', {
    deliveryPincode: cleanPincode,
    weight: cleanWeight,
    cod: cleanCod,
  })
}

/**
 * Create a new shipment order in Shiprocket.
 *
 * @param {Object} order - Order payload matching Shiprocket specification
 * @returns {Promise<{shiprocket_order_id: string|number, shipment_id: number, awb_code: string}>}
 */
export async function createShipment(order) {
  if (!order || typeof order !== 'object') {
    throw new Error('Order payload is required to create a shipment.')
  }

  return await invokeShiprocket('createOrder', {
    order,
  })
}

/**
 * Track an existing shipment by AWB code.
 *
 * @param {string} awb - Air Waybill number
 * @returns {Promise<any>} Tracking events and shipment details
 */
export async function trackShipment(awb) {
  const cleanAwb = String(awb || '').trim()
  if (!cleanAwb) {
    throw new Error('AWB number is required for tracking.')
  }

  return await invokeShiprocket('track', {
    awb: cleanAwb,
  })
}
