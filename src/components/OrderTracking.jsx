import { useState, useEffect, useCallback } from 'react'
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCw,
  MapPin,
  Calendar,
} from 'lucide-react'
import { trackShipment } from '../services/shiprocket'

/**
 * Normalizes varied Shiprocket response schemas into a unified activity list.
 */
function normalizeActivities(data) {
  if (!data) return []
  if (Array.isArray(data)) return data

  const possibleArrays = [
    data?.tracking_data?.shipment_track_activities,
    data?.shipment_track_activities,
    data?.scans,
    data?.activities,
    data?.tracking_data?.shipment_track,
    data?.track_activities,
  ]

  for (const arr of possibleArrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.map((item) => ({
        date: item.date || item.Date || item.timestamp || item.created_at || '',
        location: item.location || item.Location || item.city || '',
        status: item.activity || item.Activity || item.status || item.current_status || 'In Transit',
      }))
    }
  }

  return []
}

/**
 * Order tracking view component displaying shipment status and vertical timeline.
 *
 * @param {Object} props
 * @param {string|null} props.awb - Shiprocket Air Waybill number
 * @param {string} [props.orderId] - Order ID for reference
 * @param {string} [props.shippingStatus] - Stored database shipping status
 * @param {string} [props.className] - Optional custom CSS classes
 */
export default function OrderTracking({
  awb = null,
  orderId = '',
  shippingStatus = null,
  className = '',
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activities, setActivities] = useState([])
  const [currentStatus, setCurrentStatus] = useState(shippingStatus || 'Processing')

  const [reloadIndex, setReloadIndex] = useState(0)

  useEffect(() => {
    let isCancelled = false
    if (!awb) {
      return
    }

    const timer = setTimeout(() => {
      setLoading(true)
      setError(null)
      trackShipment(awb)
        .then((data) => {
          if (isCancelled) return
          const list = normalizeActivities(data)
          setActivities(list)
          const statusFromData =
            data?.tracking_data?.track_status ||
            data?.tracking_data?.shipment_status ||
            data?.current_status ||
            (list[0]?.status ? list[0].status : null)
          if (statusFromData) {
            setCurrentStatus(String(statusFromData))
          }
        })
        .catch((err) => {
          if (isCancelled) return
          console.error('Shipment tracking error:', err)
          setError(err.message || 'Unable to retrieve shipment tracking details at this moment.')
        })
        .finally(() => {
          if (!isCancelled) {
            setLoading(false)
          }
        })
    }, 0)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [awb, reloadIndex])

  const fetchTracking = useCallback(() => {
    setReloadIndex((prev) => prev + 1)
  }, [])

  // Friendly state when no AWB has been created yet
  if (!awb) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-slate-50/70 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-200/70 text-slate-600 shrink-0">
            <Package className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-slate-800">
              Shipment not created yet
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Our fulfillment team is preparing your authentic natural food package. Real-time carrier tracking will become available once the shipment is dispatched.
            </p>
            {orderId && (
              <span className="inline-block mt-2 text-[11px] font-medium text-slate-400">
                Order Reference: #{orderId}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* Tracking Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Shipment Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AWB: <span className="font-mono font-medium text-slate-800">{awb}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            {currentStatus}
          </span>
          <button
            type="button"
            onClick={fetchTracking}
            disabled={loading}
            title="Refresh tracking data"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && activities.length === 0 && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
          <span>Fetching real-time tracking events...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-3 flex items-start gap-2 text-xs text-slate-800 bg-slate-100 border border-slate-300 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-slate-800">{error}</p>
            <button
              type="button"
              onClick={fetchTracking}
              className="mt-1 text-[11px] font-semibold text-emerald-800 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Vertical Timeline */}
      {!loading && activities.length > 0 && (
        <div className="mt-4 pl-1">
          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((event, idx) => {
              const isLatest = idx === 0
              return (
                <div key={idx} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      isLatest
                        ? 'border-emerald-700 ring-2 ring-emerald-700/20'
                        : 'border-slate-400'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLatest ? 'bg-emerald-700' : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  {/* Event content */}
                  <div>
                    <h5
                      className={`text-xs font-semibold leading-snug ${
                        isLatest ? 'text-emerald-900' : 'text-slate-700'
                      }`}
                    >
                      {event.status}
                    </h5>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{event.location}</span>
                        </span>
                      )}
                      {event.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{event.date}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* When AWB exists but activities array is still empty */}
      {!loading && !error && activities.length === 0 && (
        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Air Waybill Assigned ({awb})</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 pl-6">
            Package has been manifest with Shiprocket. In-transit scan updates will be visible as soon as the courier scans the parcel.
          </p>
        </div>
      )}
    </div>
  )
}
