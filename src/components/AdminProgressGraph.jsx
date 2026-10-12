import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  BarChart3,
  Calendar,
  IndianRupee,
  PackageCheck,
  Truck,
  Clock,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'

function getOrderDateString(order) {
  if (order.createdAt) {
    try {
      return new Date(order.createdAt).toISOString().split('T')[0]
    } catch {
      // fallback
    }
  }
  if (order.date) {
    return order.date.split(' ')[0]
  }
  return new Date().toISOString().split('T')[0]
}

function getCurvedPath(points) {
  if (!points || points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export default function AdminProgressGraph({ orders = [] }) {
  const [timeRange, setTimeRange] = useState('7d') // '7d' | '30d' | 'all'
  const [metric, setMetric] = useState('revenue') // 'revenue' | 'orders'
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // 1. Compute timeline data points strictly from real orders
  const chartData = useMemo(() => {
    const today = new Date()
    const points = []

    if (timeRange === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dayOrders = orders.filter((o) => getOrderDateString(o) === dateStr)
        const dayRevenue = dayOrders
          .filter((o) => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0)

        points.push({
          dateStr,
          label,
          revenue: dayRevenue,
          ordersCount: dayOrders.length,
          orders: dayOrders,
        })
      }
    } else if (timeRange === '30d') {
      // 30 days grouped in 5-day intervals or daily
      for (let i = 29; i >= 0; i -= (i > 0 && i % 4 === 0 ? 4 : 5)) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dayOrders = orders.filter((o) => getOrderDateString(o) === dateStr)
        const dayRevenue = dayOrders
          .filter((o) => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0)

        points.push({
          dateStr,
          label,
          revenue: dayRevenue,
          ordersCount: dayOrders.length,
          orders: dayOrders,
        })
      }
    } else {
      // All history from orders
      if (orders.length === 0) {
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(today.getDate() - i)
          points.push({
            dateStr: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: 0,
            ordersCount: 0,
            orders: [],
          })
        }
      } else {
        // Group all orders by date
        const dateMap = {}
        orders.forEach((o) => {
          const d = getOrderDateString(o)
          if (!dateMap[d]) dateMap[d] = []
          dateMap[d].push(o)
        })
        const sortedDates = Object.keys(dateMap).sort()
        sortedDates.forEach((dStr) => {
          const dayOrders = dateMap[dStr]
          const d = new Date(dStr)
          const label = isNaN(d.getTime())
            ? dStr
            : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const dayRevenue = dayOrders
            .filter((o) => o.status !== 'Cancelled')
            .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
          points.push({
            dateStr: dStr,
            label,
            revenue: dayRevenue,
            ordersCount: dayOrders.length,
            orders: dayOrders,
          })
        })
        // Ensure at least 2 points for a curve
        if (points.length === 1) {
          const dPrev = new Date(points[0].dateStr)
          dPrev.setDate(dPrev.getDate() - 1)
          points.unshift({
            dateStr: dPrev.toISOString().split('T')[0],
            label: dPrev.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: 0,
            ordersCount: 0,
            orders: [],
          })
        }
      }
    }

    return points
  }, [orders, timeRange])

  // 2. Calculations for SVG rendering
  const width = 680
  const height = 240
  const padLeft = 55
  const padRight = 25
  const padTop = 25
  const padBottom = 40
  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom

  const maxVal = useMemo(() => {
    const vals = chartData.map((p) => (metric === 'revenue' ? p.revenue : p.ordersCount))
    const highest = Math.max(...vals, 0)
    // Avoid flat zero baseline
    return highest === 0 ? (metric === 'revenue' ? 20 : 5) : highest * 1.15
  }, [chartData, metric])

  const coordinates = useMemo(() => {
    if (chartData.length === 0) return []
    return chartData.map((p, idx) => {
      const val = metric === 'revenue' ? p.revenue : p.ordersCount
      const x = padLeft + (idx / Math.max(chartData.length - 1, 1)) * plotWidth
      const y = padTop + plotHeight - (val / maxVal) * plotHeight
      return { x, y, data: p, val }
    })
  }, [chartData, metric, maxVal, plotWidth, plotHeight, padLeft, padTop])

  const curvePath = useMemo(() => getCurvedPath(coordinates), [coordinates])
  const areaPath = useMemo(() => {
    if (coordinates.length === 0) return ''
    const bottom = padTop + plotHeight
    return `${curvePath} L ${coordinates[coordinates.length - 1].x} ${bottom} L ${coordinates[0].x} ${bottom} Z`
  }, [curvePath, coordinates, padTop, plotHeight])

  // 3. Overall Order Fulfillment Progress Lifecycle
  const totalOrders = orders.length
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length
  const shippedCount = orders.filter((o) => o.status === 'Shipped').length
  const processingCount = orders.filter((o) => o.status === 'Processing').length
  const cancelledCount = orders.filter((o) => o.status === 'Cancelled').length

  const fulfillmentRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0
  const inTransitRate = totalOrders > 0 ? Math.round((shippedCount / totalOrders) * 100) : 0
  const processingRate = totalOrders > 0 ? Math.round((processingCount / totalOrders) * 100) : 0

  const totalPeriodRevenue = chartData.reduce((sum, p) => sum + p.revenue, 0)
  const totalPeriodOrders = chartData.reduce((sum, p) => sum + p.ordersCount, 0)

  // Horizontal guide ticks
  const yTicks = [
    { label: metric === 'revenue' ? '₹0' : '0', y: padTop + plotHeight },
    {
      label: metric === 'revenue' ? `₹${Math.round(maxVal / 2)}` : Math.round(maxVal / 2),
      y: padTop + plotHeight / 2,
    },
    {
      label: metric === 'revenue' ? `₹${Math.round(maxVal)}` : Math.round(maxVal),
      y: padTop,
    },
  ]

  return (
    <div className="admin-progress-card animate-fade-in">
      {/* Header with Title and Interactive Controls */}
      <div className="admin-progress-header">
        <div className="progress-title-group">
          <div className="progress-title-badge">
            <BarChart3 size={18} />
            <span>Store Performance Analytics</span>
          </div>
          <h3 className="progress-main-title">Sales & Order Growth Progress</h3>
          <p className="progress-subtitle">
            Live metrics and fulfillment trajectory compiled in real-time from Supabase orders
          </p>
        </div>

        <div className="progress-controls-row">
          {/* Metric Toggle */}
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${metric === 'revenue' ? 'active' : ''}`}
              onClick={() => setMetric('revenue')}
            >
              <IndianRupee size={13} />
              <span>Revenue</span>
            </button>
            <button
              type="button"
              className={`segmented-btn ${metric === 'orders' ? 'active' : ''}`}
              onClick={() => setMetric('orders')}
            >
              <ShoppingBag size={13} />
              <span>Orders</span>
            </button>
          </div>

          {/* Time Range Pills */}
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${timeRange === '7d' ? 'active' : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button
              type="button"
              className={`segmented-btn ${timeRange === '30d' ? 'active' : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
            <button
              type="button"
              className={`segmented-btn ${timeRange === 'all' ? 'active' : ''}`}
              onClick={() => setTimeRange('all')}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Body: Interactive Chart + Fulfillment Funnel */}
      <div className="admin-progress-body">
        {/* Left: SVG Area / Line Chart */}
        <div className="progress-chart-container">
          <div className="chart-quick-stats-strip">
            <div className="quick-stat-item">
              <span className="stat-muted">Period {metric === 'revenue' ? 'Revenue' : 'Volume'}</span>
              <strong className="stat-highlight">
                {metric === 'revenue' ? `₹${totalPeriodRevenue.toFixed(2)}` : `${totalPeriodOrders} Orders`}
              </strong>
            </div>
            <div className="quick-stat-item">
              <span className="stat-muted">Database Source</span>
              <span className="stat-badge-live">
                <span className="live-pulse-dot"></span> Live Sync
              </span>
            </div>
          </div>

          <div className="chart-svg-wrapper">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="progress-svg-chart"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="progressAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#10b981" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glowShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#059669" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Horizontal Grid Lines */}
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={tick.y}
                    x2={width - padRight}
                    y2={tick.y}
                    stroke="var(--admin-border, rgba(0, 0, 0, 0.08))"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 10}
                    y={tick.y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--color-text-muted, #64748b)"
                    fontWeight="500"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* Area Gradient Fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#progressAreaGradient)" />
              )}

              {/* Smooth Spline Curve Line */}
              {curvePath && (
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glowShadow)"
                />
              )}

              {/* Interactive Data Dots & Hover Hitboxes */}
              {coordinates.map((pt, idx) => {
                const isHovered = hoveredPoint?.data.dateStr === pt.data.dateStr
                return (
                  <g key={idx}>
                    {/* Hover hotspot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="16"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Visual dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : pt.val > 0 ? 4.5 : 3}
                      fill={isHovered ? '#047857' : pt.val > 0 ? '#10b981' : '#cbd5e1'}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2.5 : 2}
                      style={{ transition: 'all 0.15s ease' }}
                    />
                    {/* X-axis date labels */}
                    <text
                      x={pt.x}
                      y={height - 12}
                      textAnchor="middle"
                      fontSize="10.5"
                      fill="var(--color-text-muted, #64748b)"
                      fontWeight={isHovered ? '700' : '500'}
                    >
                      {pt.data.label}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="chart-hover-tooltip"
                style={{
                  left: `${(hoveredPoint.x / width) * 100}%`,
                  top: `${(hoveredPoint.y / height) * 100}%`,
                }}
              >
                <div className="tooltip-date">{hoveredPoint.data.label}</div>
                <div className="tooltip-value">
                  {metric === 'revenue'
                    ? `₹${hoveredPoint.data.revenue.toFixed(2)}`
                    : `${hoveredPoint.data.ordersCount} Order${hoveredPoint.data.ordersCount === 1 ? '' : 's'}`}
                </div>
                <div className="tooltip-sub">
                  {hoveredPoint.data.ordersCount} order{hoveredPoint.data.ordersCount === 1 ? '' : 's'} placed
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Lifecycle & Fulfillment Progress Funnel */}
        <div className="progress-funnel-card">
          <div className="funnel-header">
            <h4 className="funnel-title">Order Lifecycle Progress</h4>
            <span className="funnel-badge">{totalOrders} Total</span>
          </div>

          {/* Fulfillment Rate Bar */}
          <div className="fulfillment-rate-box">
            <div className="fulfillment-rate-top">
              <span>Fulfillment Completion</span>
              <strong className="text-forest">{fulfillmentRate}%</strong>
            </div>
            <div className="multi-step-progress-track">
              {/* Delivered Segment */}
              <div
                className="segment-delivered"
                style={{ width: `${fulfillmentRate}%` }}
                title={`Delivered: ${deliveredCount}`}
              ></div>
              {/* Shipped Segment */}
              <div
                className="segment-shipped"
                style={{ width: `${inTransitRate}%` }}
                title={`Shipped: ${shippedCount}`}
              ></div>
              {/* Processing Segment */}
              <div
                className="segment-processing"
                style={{ width: `${processingRate}%` }}
                title={`Processing: ${processingCount}`}
              ></div>
            </div>
          </div>

          {/* Pipeline Stages Breakdown */}
          <div className="pipeline-stages-list">
            <div className="stage-row">
              <div className="stage-info">
                <span className="stage-icon-dot bg-blue"></span>
                <span className="stage-name">Placed & Processing</span>
              </div>
              <strong className="stage-count">{processingCount}</strong>
            </div>

            <div className="stage-row">
              <div className="stage-info">
                <span className="stage-icon-dot bg-amber"></span>
                <span className="stage-name">In Transit / Shipped</span>
              </div>
              <strong className="stage-count">{shippedCount}</strong>
            </div>

            <div className="stage-row">
              <div className="stage-info">
                <span className="stage-icon-dot bg-green"></span>
                <span className="stage-name">Delivered (Fulfilled)</span>
              </div>
              <strong className="stage-count text-forest">{deliveredCount}</strong>
            </div>

            {cancelledCount > 0 && (
              <div className="stage-row">
                <div className="stage-info">
                  <span className="stage-icon-dot bg-red"></span>
                  <span className="stage-name">Cancelled</span>
                </div>
                <strong className="stage-count text-muted">{cancelledCount}</strong>
              </div>
            )}
          </div>

          {/* Real Conversion Metric Footer */}
          <div className="funnel-footer-metrics">
            <div className="footer-metric-pill">
              <Clock size={13} />
              <span>Pending Delivery: <strong>{processingCount + shippedCount}</strong></span>
            </div>
            <div className="footer-metric-pill">
              <PackageCheck size={13} />
              <span>Total Fulfilled: <strong>{deliveredCount}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
