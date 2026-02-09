/**
 * User Analytics Page
 * Room picker → per-room detailed dashboard
 * Each room gets its own streaks, charts, heatmap, export
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


/* ═══════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

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

function StatCard({ value, label, color = 'text-accent' }) {
  return (
    <Card className="p-4 text-center">
      <p className={`text-2xl md:text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
    </Card>
  )
}

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
        {levels.map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}
        <span className="text-gray-600 text-xs">More</span>
      </div>
    </div>
  )
}

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

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
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


/* ═══════════════════════════════════════════════════════════════
   ROOM DETAIL VIEW — full charts for one room
   ═══════════════════════════════════════════════════════════════ */

function RoomDetail({ roomId, onBack }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    if (!user?.id || !roomId) return
    setLoading(true)
    api.analytics.userRoom(roomId)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user?.id, roomId])

  const handleExportPDF = () => {
    if (!data) return
    setExporting('pdf')
    try {
      const exportData = {
        overview: { ...data.overview, overallRate: data.overview.rate, totalDays: data.overview.totalDays },
        streaks: data.streaks,
        roomBreakdown: [{ ...data.room, total: data.overview.totalDays, approved: data.overview.approved, rate: data.overview.rate }],
        records: data.records?.map(r => ({ ...r, room: data.room }))
      }
      exportToPDF(exportData, `${data.room.emoji} ${data.room.name}`, `daylock-${data.room.name.toLowerCase().replace(/\s+/g, '-')}-report`)
    } catch (e) { console.error('PDF export failed:', e) }
    finally { setTimeout(() => setExporting(null), 1000) }
  }

  const handleExportExcel = () => {
    if (!data) return
    setExporting('excel')
    try {
      const rows = (data.records || []).map(r => ({ ...r, roomName: data.room.name }))
      exportToExcel(rows, `daylock-${data.room.name.toLowerCase().replace(/\s+/g, '-')}-report`)
    } catch (e) { console.error('Excel export failed:', e) }
    finally { setTimeout(() => setExporting(null), 1000) }
  }

  if (loading) return <LoadingSkeleton />

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <Icon name="x" className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">Failed to load</h3>
        <p className="text-gray-500 text-sm mb-4">{error || 'Room not found'}</p>
        <Button variant="secondary" onClick={onBack}>Back to rooms</Button>
      </div>
    )
  }

  if (data.overview.totalDays === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-charcoal-500/50 flex items-center justify-center mx-auto mb-4 text-3xl">
          {data.room.emoji}
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">{data.room.name}</h3>
        <p className="text-gray-500 text-sm mb-4">No attendance data yet. Start marking attendance to see analytics.</p>
        <Button variant="secondary" onClick={onBack}>Back to rooms</Button>
      </div>
    )
  }

  const { overview, streaks, weeklyTrend, monthlyTrend, heatmap, statusDistribution } = data

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-charcoal-500/30 hover:bg-charcoal-500/50 transition-colors"
          >
            <Icon name="chevronLeft" className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-charcoal-500/50 flex items-center justify-center text-2xl">
              {data.room.emoji}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{data.room.name}</h2>
              <p className="text-gray-500 text-sm">{overview.totalDays} days tracked</p>
            </div>
          </div>
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

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard value={overview.totalDays} label="Total Days" />
        <StatCard value={overview.approved} label="Approved" color="text-green-400" />
        <StatCard value={`${streaks.currentStreak}d`} label="Current Streak" color="text-accent" />
        <StatCard value={`${streaks.bestStreak}d`} label="Best Streak" color="text-yellow-400" />
      </div>

      {/* ── Progress Ring + Status Donut ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 flex flex-col items-center justify-center">
          <ProgressRing
            value={overview.rate}
            size={140}
            strokeWidth={12}
            label="Attendance Rate"
            sublabel={`${overview.approved} of ${overview.totalDays} days approved`}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-white font-semibold mb-4 text-center">Status Breakdown</h3>
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value"
                >
                  {statusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend formatter={(v) => <span className="text-gray-400 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No data</p>
          )}
        </Card>
      </div>

      {/* ── Weekly Trend ── */}
      <Card className="p-6">
        <h3 className="text-white font-semibold mb-4">Weekly Attendance Rate</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={weeklyTrend}>
            <defs>
              <linearGradient id={`grad-${roomId}`} x1="0" y1="0" x2="0" y2="1">
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
              stroke="#3b82f6" fill={`url(#grad-${roomId})`} strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Monthly Breakdown ── */}
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

      {/* ── Heatmap ── */}
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

      {/* ── Recent Attendance Log ── */}
      {data.records?.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-white font-semibold mb-4">Recent Attendance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-charcoal-400/10">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data.records.slice(-20).reverse().map((rec) => {
                  const statusColors = {
                    approved: 'text-green-400 bg-green-400/10',
                    rejected: 'text-red-400 bg-red-400/10',
                    missed: 'text-yellow-400 bg-yellow-400/10',
                    pending_review: 'text-indigo-400 bg-indigo-400/10'
                  }
                  return (
                    <tr key={rec.id} className="border-b border-charcoal-400/5 hover:bg-charcoal-500/10">
                      <td className="py-2.5 pr-4 text-gray-300">{rec.date}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[rec.status] || 'text-gray-400'}`}>
                          {rec.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500 text-xs">
                        {rec.submitted_at ? new Date(rec.submitted_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {data.records.length > 20 && (
            <p className="text-gray-600 text-xs mt-3 text-center">
              Showing last 20 of {data.records.length} records. Export for full history.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   ROOM PICKER — grid of rooms with quick stats
   ═══════════════════════════════════════════════════════════════ */

function RoomPicker({ rooms, onSelect }) {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-charcoal-500/50 flex items-center justify-center mx-auto mb-4">
          <Icon name="rooms" className="w-10 h-10 text-gray-500" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">No rooms yet</h3>
        <p className="text-gray-500 text-sm">Create a room and start marking attendance to see your analytics.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => {
        const rateColor = room.rate >= 75 ? 'text-green-400' : room.rate >= 50 ? 'text-yellow-400' : 'text-red-400'
        const barColor = room.rate >= 75 ? '#22c55e' : room.rate >= 50 ? '#f59e0b' : '#ef4444'

        return (
          <Card
            key={room.roomId}
            className="p-5 cursor-pointer hover:bg-charcoal-500/20 hover:border-charcoal-400/20 transition-all duration-200 group"
            onClick={() => onSelect(room.roomId)}
          >
            {/* Room header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-charcoal-500/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {room.emoji}
                </div>
                <div>
                  <p className="text-white font-semibold">{room.name}</p>
                  <p className="text-gray-500 text-xs">{room.total} days tracked</p>
                </div>
              </div>
              <Icon name="chevronRight" className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 bg-charcoal-600 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${room.rate}%`, backgroundColor: barColor }}
                />
              </div>
              <span className={`text-sm font-bold ${rateColor}`}>{room.rate}%</span>
            </div>

            {/* Mini stats row */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-400/80">{room.approved} approved</span>
              <span className="text-gray-600">{room.total - room.approved} other</span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE — loads room list, then drill-down
   ═══════════════════════════════════════════════════════════════ */

export default function UserAnalytics() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)

  // Fetch room list with quick stats from the combined endpoint
  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    api.analytics.user()
      .then(d => {
        setRooms(d.roomBreakdown || [])
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user?.id])

  // If a room is selected, show full detail
  if (selectedRoom) {
    return (
      <div className="max-w-5xl mx-auto">
        <RoomDetail roomId={selectedRoom} onBack={() => setSelectedRoom(null)} />
      </div>
    )
  }

  // Room picker view
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">My Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Select a room to see your detailed progress</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-charcoal-600 rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <Icon name="x" className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-1">Failed to load</h3>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      ) : (
        <RoomPicker rooms={rooms} onSelect={setSelectedRoom} />
      )}
    </div>
  )
}
