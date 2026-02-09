/**
 * User Analytics Page
 * Visual progress dashboard — streaks, charts, heatmap, export
 */

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Card, Button, Icon } from '../components/ui'
import { useAuth } from '../contexts'
import { api } from '../lib'
import { exportToPDF, exportToExcel } from '../lib/exportUtils'

// ── Circular Progress Ring ──
function ProgressRing({ value = 0, size = 120, strokeWidth = 10, label, sublabel }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  const color = value >= 75 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={radius} stroke="#1f2937" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx={size/2} cy={size/2} r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{value}%</span>
        </div>
      </div>
      {label && <p className="text-white text-sm font-medium mt-2">{label}</p>}
      {sublabel && <p className="text-gray-500 text-xs">{sublabel}</p>}
    </div>
  )
}

// ── Stat Card ──
function StatCard({ icon, value, label, trend, color = 'text-accent' }) {
  return (
    <Card className="p-4 text-center">
      <p className={`text-2xl md:text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
        </p>
      )}
    </Card>
  )
}

// ── Heatmap ──
function Heatmap({ data }) {
  const levels = ['bg-charcoal-600', 'bg-red-500/40', 'bg-yellow-500/40', 'bg-green-500/60']
  
  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {data.map((d, i) => (
          <div
            key={i}
            className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm ${levels[d.level]} transition-colors`}
            title={`${d.date}: ${d.approved}/${d.total} approved`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-gray-600 text-xs">Less</span>
        {levels.map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-gray-600 text-xs">More</span>
      </div>
    </div>
  )
}

// ── Custom Tooltip ──
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-charcoal-800 border border-charcoal-400/20 rounded-lg p-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── Loading ──
function AnalyticsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-charcoal-600 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-charcoal-600 rounded-xl" />)}
      </div>
      <div className="h-64 bg-charcoal-600 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 bg-charcoal-600 rounded-xl" />
        <div className="h-64 bg-charcoal-600 rounded-xl" />
      </div>
    </div>
  )
}

const DONUT_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6366f1']

export default function UserAnalytics() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    api.analytics.user()
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleExportPDF = () => {
    if (!data) return
    setExporting('pdf')
    try { exportToPDF(data, user?.email || 'User') }
    catch (e) { console.error('PDF export failed:', e) }
    finally { setTimeout(() => setExporting(null), 1000) }
  }

  const handleExportExcel = () => {
    if (!data) return
    setExporting('excel')
    try { exportToExcel(data.records || []) }
    catch (e) { console.error('Excel export failed:', e) }
    finally { setTimeout(() => setExporting(null), 1000) }
  }

  if (loading) return <AnalyticsSkeleton />

  if (error) {
    return (
      <div className="max-w-5xl mx-auto text-center py-12">
        <Icon name="x" className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">Failed to load analytics</h3>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    )
  }

  if (!data || data.overview?.totalDays === 0) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-charcoal-500/50 flex items-center justify-center mx-auto mb-4">
          <Icon name="calendar" className="w-10 h-10 text-gray-500" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">No data yet</h3>
        <p className="text-gray-500 text-sm">Start marking attendance in your rooms to see analytics here.</p>
      </div>
    )
  }

  const { overview, streaks, weeklyTrend, monthlyTrend, roomBreakdown, heatmap, statusDistribution } = data

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">My Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track your progress and consistency</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportPDF} disabled={exporting === 'pdf'}>
            {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button variant="secondary" onClick={handleExportExcel} disabled={exporting === 'excel'}>
            {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
          </Button>
        </div>
      </div>

      {/* ── Top Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard value={overview.totalDays} label="Total Days" />
        <StatCard value={overview.approved} label="Approved" color="text-green-400" />
        <StatCard value={`${streaks.currentStreak}d`} label="Current Streak" color="text-accent" />
        <StatCard value={`${streaks.bestStreak}d`} label="Best Streak" color="text-yellow-400" />
      </div>

      {/* ── Progress Ring + Status Donut ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall rate */}
        <Card className="p-6 flex flex-col items-center justify-center">
          <ProgressRing
            value={overview.overallRate}
            size={140}
            strokeWidth={12}
            label="Overall Attendance"
            sublabel={`${overview.approved} of ${overview.totalDays} days`}
          />
        </Card>

        {/* Status donut */}
        <Card className="p-6">
          <h3 className="text-white font-semibold mb-4 text-center">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {statusDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Weekly Trend ── */}
      <Card className="p-6">
        <h3 className="text-white font-semibold mb-4">Weekly Attendance Rate</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={weeklyTrend}>
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone" dataKey="rate" name="Rate"
              stroke="#3b82f6" fill="url(#rateGradient)" strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Monthly Bar Chart ── */}
      <Card className="p-6">
        <h3 className="text-white font-semibold mb-4">Monthly Breakdown</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend formatter={(v) => <span className="text-gray-400 text-xs">{v}</span>} />
            <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4,4,0,0]} />
            <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4,4,0,0]} />
            <Bar dataKey="missed" name="Missed" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Room Breakdown + Heatmap ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Room pie chart */}
        {roomBreakdown.length > 0 && (
          <Card className="p-6">
            <h3 className="text-white font-semibold mb-4">Room Performance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={roomBreakdown}
                  cx="50%" cy="50%"
                  outerRadius={75}
                  dataKey="approved"
                  nameKey="name"
                  label={({ name, rate }) => `${name} ${rate}%`}
                >
                  {roomBreakdown.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {roomBreakdown.map((r, i) => (
                <div key={r.roomId} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <span className="text-gray-400 text-xs">{r.emoji} {r.name} ({r.rate}%)</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Heatmap */}
        <Card className="p-6">
          <h3 className="text-white font-semibold mb-4">Activity (Last 90 Days)</h3>
          <Heatmap data={heatmap} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-green-400 font-bold">{heatmap.filter(d => d.level === 3).length}</p>
              <p className="text-gray-600 text-xs">Perfect days</p>
            </div>
            <div>
              <p className="text-yellow-400 font-bold">{heatmap.filter(d => d.level === 2).length}</p>
              <p className="text-gray-600 text-xs">Partial days</p>
            </div>
            <div>
              <p className="text-red-400 font-bold">{heatmap.filter(d => d.level === 1).length}</p>
              <p className="text-gray-600 text-xs">Missed days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Room Detail Cards ── */}
      {roomBreakdown.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">Room Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roomBreakdown.map(room => (
              <Card key={room.roomId} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-charcoal-500/50 flex items-center justify-center text-xl">
                    {room.emoji}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{room.name}</p>
                    <p className="text-gray-500 text-xs">{room.total} days tracked</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 bg-charcoal-600 rounded-full h-2 mr-3">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${room.rate}%`,
                        backgroundColor: room.rate >= 75 ? '#22c55e' : room.rate >= 50 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <span className="text-white text-sm font-semibold">{room.rate}%</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
