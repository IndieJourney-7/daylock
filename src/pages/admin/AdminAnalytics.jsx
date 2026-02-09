/**
 * Admin Analytics Page
 * Multi-user / multi-room performance dashboard for admins
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Card, Button, Icon, Badge } from '../../components/ui'
import { useAuth } from '../../contexts'
import { api } from '../../lib'
import { exportAdminPDF, exportToExcel } from '../../lib/exportUtils'

// ── Circular Progress ──
function ProgressRing({ value = 0, size = 100, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  const color = value >= 75 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} stroke="#1f2937" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{value}%</span>
      </div>
    </div>
  )
}

// ── User Performance Row ──
function UserRow({ user, rank, onClick }) {
  const rateColor = user.rate >= 75 ? 'text-green-400' : user.rate >= 50 ? 'text-yellow-400' : 'text-red-400'
  const barColor = user.rate >= 75 ? '#22c55e' : user.rate >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 md:p-4 hover:bg-charcoal-500/20 rounded-xl transition-colors cursor-pointer group">
      {/* Rank */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        rank <= 3 ? 'bg-accent/20 text-accent' : 'bg-charcoal-500/50 text-gray-500'
      }`}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-charcoal-500/50 flex items-center justify-center text-sm flex-shrink-0">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <span className="text-gray-400">{user.name?.[0]?.toUpperCase() || '?'}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{user.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-charcoal-600 rounded-full h-1.5 max-w-[120px]">
            <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${user.rate}%`, backgroundColor: barColor }} />
          </div>
          <span className={`text-xs font-semibold ${rateColor}`}>{user.rate}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-xs">
        <div className="text-center">
          <p className="text-green-400 font-bold">{user.approved}</p>
          <p className="text-gray-600">Done</p>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-bold">{user.rejected + user.missed}</p>
          <p className="text-gray-600">Miss</p>
        </div>
        <div className="text-center">
          <p className="text-accent font-bold">{user.currentStreak}d</p>
          <p className="text-gray-600">Streak</p>
        </div>
      </div>

      {/* Arrow indicator */}
      <Icon name="chevronRight" className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
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
function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-charcoal-600 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-charcoal-600 rounded-xl" />)}
      </div>
      <div className="h-72 bg-charcoal-600 rounded-xl" />
    </div>
  )
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6366f1', '#3b82f6', '#ec4899']

export default function AdminAnalytics() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    api.analytics.admin()
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleExportPDF = () => {
    if (!data) return
    setExporting('pdf')
    try { exportAdminPDF(data, user?.email || 'Admin') }
    catch (e) { console.error(e) }
    finally { setTimeout(() => setExporting(null), 1000) }
  }

  const handleExportExcel = () => {
    if (!data) return
    setExporting('excel')
    try {
      const rows = (data.records || []).map(r => ({
        ...r,
        roomName: r.room?.name || '-',
        userName: r.user?.name || r.user?.email || '-'
      }))
      exportToExcel(rows, 'daylock-admin-report')
    } catch (e) { console.error(e) }
    finally { setTimeout(() => setExporting(null), 1000) }
  }

  if (loading) return <Skeleton />

  if (error) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <Icon name="x" className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-white font-semibold">Failed to load analytics</p>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    )
  }

  if (!data || !data.totalUsers) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-charcoal-500/50 flex items-center justify-center mx-auto mb-4">
          <Icon name="rooms" className="w-10 h-10 text-gray-500" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">No data yet</h3>
        <p className="text-gray-500 text-sm">Accept room invites to start seeing analytics here.</p>
      </div>
    )
  }

  const { overview, userPerformance, roomStats, weeklyTrend, statusDistribution } = data

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Admin Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data.totalUsers} user{data.totalUsers !== 1 ? 's' : ''} across {data.totalRooms} room{data.totalRooms !== 1 ? 's' : ''}
          </p>
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
        <Card className="p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-accent">{data.totalUsers}</p>
          <p className="text-gray-500 text-xs mt-1">Users</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-green-400">{overview.approved}</p>
          <p className="text-gray-500 text-xs mt-1">Approved</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-red-400">{overview.rejected + overview.missed}</p>
          <p className="text-gray-500 text-xs mt-1">Rejected / Missed</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-yellow-400">{overview.pendingReview}</p>
          <p className="text-gray-500 text-xs mt-1">Pending Review</p>
        </Card>
      </div>

      {/* ── Overall Rate + Status Donut ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 flex flex-col items-center justify-center">
          <ProgressRing value={overview.overallRate} size={140} strokeWidth={12} />
          <p className="text-white font-semibold mt-3">Overall Compliance</p>
          <p className="text-gray-500 text-xs">{overview.approved} of {overview.totalRecords} records approved</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-white font-semibold mb-3 text-center">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusDistribution} cx="50%" cy="50%"
                innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value"
              >
                {statusDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={(v) => <span className="text-gray-400 text-xs">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── User Leaderboard ── */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">User Performance</h3>
          <p className="text-gray-600 text-xs">Click a user for detailed report</p>
        </div>
        <div className="divide-y divide-charcoal-400/10">
          {userPerformance.map((u, i) => (
            <UserRow
              key={u.userId}
              user={u}
              rank={i + 1}
              onClick={() => navigate(`/admin/analytics/user/${u.userId}`)}
            />
          ))}
        </div>
      </Card>

      {/* ── Weekly Trend ── */}
      <Card className="p-6">
        <h3 className="text-white font-semibold mb-4">Weekly Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={weeklyTrend}>
            <defs>
              <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="rate" name="Compliance" stroke="#8b5cf6" fill="url(#adminGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Room Stats ── */}
      {roomStats?.length > 0 && (
        <Card className="p-6">
          <h3 className="text-white font-semibold mb-4">Room Performance</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, roomStats.length * 50)}>
            <BarChart data={roomStats} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} unit="%" />
              <YAxis
                type="category" dataKey="name" width={100}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '...' : v}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="rate" name="Rate" radius={[0, 6, 6, 0]}>
                {roomStats.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── Room Detail Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roomStats.map((room, i) => (
          <Card key={room.roomId} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-charcoal-500/50 flex items-center justify-center text-xl">
                {room.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium text-sm truncate">{room.name}</p>
                <p className="text-gray-500 text-xs truncate">{room.userName}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 bg-charcoal-600 rounded-full h-2 mr-3">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${room.rate}%`, backgroundColor: COLORS[i % COLORS.length] }}
                />
              </div>
              <span className="text-white text-sm font-semibold">{room.rate}%</span>
            </div>
            <p className="text-gray-600 text-xs mt-2">{room.approved}/{room.total} approved</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
