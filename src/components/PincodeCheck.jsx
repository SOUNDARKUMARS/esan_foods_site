import { useState } from 'react'
import { MapPin, Truck, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'
import { checkServiceability } from '../services/shiprocket'

/**
 * Reusable Pincode Serviceability Check component.
 *
 * @param {Object} props
 * @param {number} [props.weight=0.5] - Package weight in kg
 * @param {number} [props.cod=0] - COD flag (0 or 1)
 * @param {Function} [props.onResult] - Callback when serviceability check completes
 * @param {string} [props.className] - Optional custom CSS classes
 * @param {boolean} [props.compact=false] - Compact layout flag
 */
export default function PincodeCheck({
  weight = 0.5,
  cod = 0,
  onResult = null,
  className = '',
  compact = false,
}) {
  const [pincode, setPincode] = useState('')
  const [lastCheckedPincode, setLastCheckedPincode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [hasChecked, setHasChecked] = useState(false)

  const handleInputChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(numericValue)
    if (error) setError(null)
  }

  const handleCheck = async (e) => {
    if (e) e.preventDefault()

    const cleanPincode = pincode.trim()
    if (cleanPincode.length !== 6) {
      setError('Please enter a valid 6-digit postal code.')
      return
    }

    setLoading(true)
    setError(null)
    setHasChecked(true)
    setLastCheckedPincode(cleanPincode)

    try {
      const couriers = await checkServiceability(cleanPincode, weight, cod)
      const isArray = Array.isArray(couriers)
      const courierList = isArray ? couriers : couriers?.data || []
      const isServiceable = courierList.length > 0

      let cheapestRate = null
      let fastestDays = null
      let fastestEtd = null
      let courierName = null

      if (isServiceable) {
        // Find cheapest courier
        const sortedByRate = [...courierList].sort(
          (a, b) => Number(a.rate || 0) - Number(b.rate || 0)
        )
        cheapestRate = Number(sortedByRate[0].rate || 0)
        courierName = sortedByRate[0].name || sortedByRate[0].courier_name || ''

        // Find fastest courier
        const sortedBySpeed = [...courierList].sort(
          (a, b) => Number(a.days || 999) - Number(b.days || 999)
        )
        fastestDays = sortedBySpeed[0].days ?? null
        fastestEtd = sortedBySpeed[0].etd || null
      }

      const summary = {
        pincode: cleanPincode,
        serviceable: isServiceable,
        couriers: courierList,
        cheapestRate,
        fastestDays,
        fastestEtd,
        courierName,
      }

      setResult(summary)
      if (onResult) onResult(summary)
    } catch (err) {
      const message = err.message || 'Unable to check delivery serviceability. Please try again.'
      setError(message)
      setResult(null)
      if (onResult) onResult({ pincode: cleanPincode, serviceable: false, error: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50/70 ${compact ? 'p-3' : 'p-4'} transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-slate-800">
          <Truck className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Delivery Availability
          </span>
        </div>
        {lastCheckedPincode && !loading && (
          <span className="text-xs font-medium text-slate-500">
            Checked: {lastCheckedPincode}
          </span>
        )}
      </div>

      <form onSubmit={handleCheck} className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Enter 6-digit Pincode"
            value={pincode}
            onChange={handleInputChange}
            disabled={loading}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 disabled:opacity-60 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || pincode.length !== 6}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 min-w-[76px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <span>Check</span>
          )}
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-2.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
          <span>Verifying courier coverage for pincode {pincode}...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-3 flex items-start gap-2 text-xs text-slate-800 bg-slate-100 border border-slate-300 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-slate-800">{error}</p>
          </div>
        </div>
      )}

      {/* Serviceable result */}
      {hasChecked && !loading && !error && result && result.serviceable && (
        <div className="mt-3 bg-white border border-emerald-700/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-medium text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Serviceable to pincode {result.pincode}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-500 block text-[11px]">Shipping Rate</span>
              <strong className="text-slate-900 font-semibold text-sm">
                {result.cheapestRate !== null ? `₹${result.cheapestRate.toFixed(2)}` : 'Standard'}
              </strong>
            </div>

            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-500 block text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Estimated Delivery
              </span>
              <strong className="text-slate-900 font-semibold text-sm">
                {result.fastestDays !== null
                  ? `${result.fastestDays} ${result.fastestDays === 1 ? 'day' : 'days'}`
                  : result.fastestEtd
                  ? result.fastestEtd
                  : 'Fast Dispatch'}
              </strong>
            </div>
          </div>

          {result.courierName && (
            <p className="text-[11px] text-slate-500 text-right pt-0.5">
              Fulfilled via {result.courierName}
            </p>
          )}
        </div>
      )}

      {/* Not serviceable result */}
      {hasChecked && !loading && !error && result && !result.serviceable && (
        <div className="mt-3 bg-white border border-slate-300 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-800 font-medium text-xs">
            <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Delivery is currently not available to {result.pincode}.</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 pl-6">
            Please try another destination postal code or contact support.
          </p>
        </div>
      )}
    </div>
  )
}
