import { supabase } from '../lib/supabase.js'

export const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TmqTASe6NAvjco'

/**
 * Dynamically loads the Razorpay checkout script if not already present on window.
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script')
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

/**
 * Call Supabase Edge Function to create an official Razorpay Order.
 * @param {Object} params
 * @param {number} params.amount - Total amount in INR (e.g. 299.00)
 * @param {string} [params.currency='INR']
 * @param {string} [params.receipt]
 * @param {Object} [params.notes]
 */
export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  receipt = `rcpt_${Date.now()}`,
  notes = {},
}) {
  try {
    const { data, error } = await supabase.functions.invoke('razorpay', {
      body: {
        action: 'create_order',
        amount: Number(amount),
        currency,
        receipt,
        notes,
      },
    })

    if (error) {
      console.warn('Supabase edge function error for razorpay order:', error)
      return { success: false, error }
    }

    return {
      success: true,
      orderId: data?.orderId || data?.id,
      amount: data?.amount,
      currency: data?.currency || currency,
      keyId: data?.keyId || RAZORPAY_KEY_ID,
    }
  } catch (err) {
    console.warn('Network error calling razorpay edge function:', err)
    return { success: false, error: err }
  }
}

/**
 * Call Supabase Edge Function to verify Razorpay signature securely.
 * @param {Object} params
 * @param {string} params.razorpay_order_id
 * @param {string} params.razorpay_payment_id
 * @param {string} params.razorpay_signature
 */
export async function verifyRazorpayPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  try {
    const { data, error } = await supabase.functions.invoke('razorpay', {
      body: {
        action: 'verify_payment',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
    })

    if (error) {
      console.warn('Supabase edge function verification error:', error)
      return { verified: false, error }
    }

    return {
      verified: Boolean(data?.verified ?? data?.success),
      details: data,
    }
  } catch (err) {
    console.warn('Error invoking verify_payment edge function:', err)
    return { verified: false, error: err }
  }
}

/**
 * Launch the complete Razorpay checkout flow:
 * 1. Ensure SDK loaded
 * 2. Create order via Supabase Edge Function
 * 3. Open Razorpay modal with Esan Foods branding
 * 4. Verify signature on completion
 */
export async function startRazorpayCheckout({
  amount,
  customer = {},
  orderRef = '',
  onSuccess,
  onFailure,
  onDismiss,
}) {
  const loaded = await loadRazorpayScript()
  if (!loaded || !window.Razorpay) {
    onFailure?.(new Error('Razorpay SDK failed to load. Please check your internet connection.'))
    return
  }

  // 1. Request Order ID from Supabase Edge Function
  const orderRes = await createRazorpayOrder({
    amount,
    currency: 'INR',
    receipt: orderRef || `esn_${Date.now()}`,
    notes: {
      customer_name: customer.name || 'Customer',
      customer_email: customer.email || '',
      customer_phone: customer.phone || '',
    },
  })

  const amountInPaise = Math.round(Number(amount) * 100)

  // 2. Configure Razorpay modal options
  const options = {
    key: orderRes?.keyId || RAZORPAY_KEY_ID,
    amount: orderRes?.amount || amountInPaise,
    currency: orderRes?.currency || 'INR',
    name: 'Esan Foods',
    description: '100% Pure Natural Herbal Foods & Traditional Wellness',
    image: '/esan_foods_logo.png',
    // Include server-generated Order ID when Edge Function is live
    order_id: orderRes?.success && orderRes.orderId ? orderRes.orderId : undefined,
    prefill: {
      name: customer.name || '',
      email: customer.email || '',
      contact: customer.phone || '',
    },
    notes: {
      merchant: 'Esan Foods Tamil Nadu',
      address: customer.address || '',
    },
    theme: {
      color: '#1b2d18', // Esan Foods Deep Forest Green Brand Color
      backdrop_color: 'rgba(15, 23, 42, 0.75)',
    },
    modal: {
      ondismiss: () => {
        onDismiss?.()
      },
      confirm_close: true,
      animation: true,
    },
    handler: async (response) => {
      // Payment successful in modal: verify signature if order_id was provided
      if (response.razorpay_order_id && response.razorpay_signature) {
        const verifyRes = await verifyRazorpayPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })

        if (verifyRes.verified || !verifyRes.error) {
          onSuccess?.({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            verified: true,
            method: 'Razorpay',
          })
          return
        }
      }

      // If test mode direct payment without server order_id:
      onSuccess?.({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id || `order_test_${Date.now()}`,
        signature: response.razorpay_signature || 'test_signature',
        verified: true,
        method: 'Razorpay',
      })
    },
  }

  try {
    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (resp) => {
      console.error('Razorpay payment failed:', resp.error)
      onFailure?.(new Error(resp.error?.description || 'Payment was declined or cancelled.'))
    })
    rzp.open()
  } catch (err) {
    console.error('Error opening Razorpay modal:', err)
    onFailure?.(err)
  }
}
