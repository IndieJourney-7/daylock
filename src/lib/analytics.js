/**
 * Analytics Service (Frontend — Direct Supabase)
 * Computes stats, trends, streaks, heatmaps for user & admin dashboards.
 * Bypasses backend API so analytics + exports work even without backend.
 */

import { supabase } from './supabase'

// ════════════════════════════════════════════════════════════════
//  USER ANALYTICS
// ════════════════════════════════════════════════════════════════

/**
 * Full analytics for the current user across all their rooms.
 * Returns overview, streaks, weekly/monthly trends, room breakdown, heatmap, records.
 */
export async function getUserAnalytics() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. All attendance records with room info
  const { data: records, error } = await supabase
    .from('attendance')
    .select('id, room_id, date, status, submitted_at, reviewed_at, note, room:rooms(id, name, emoji)')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  const all = records || []

  // 2. All user's rooms
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, name, emoji')
    .eq('user_id', user.id)

  // ── Stats ──
  const totalDays = all.length
  const approved  = all.filter(r => r.status === 'approved').length
  const rejected  = all.filter(r => r.status === 'rejected').length
  const missed    = all.filter(r => r.status === 'missed').length
  const pending   = all.filter(r => r.status === 'pending_review').length
  const overallRate = totalDays > 0 ? Math.round((approved / totalDays) * 100) : 0

  // ── Streaks ──
  const approvedDates = all.filter(r => r.status === 'approved').map(r => r.date).sort()
  const { currentStreak, bestStreak } = computeStreaks(approvedDates)

  // ── Trends ──
  const weeklyTrend  = computeWeeklyTrend(all, 12)
  const monthlyTrend = computeMonthlyTrend(all, 6)

  // ── Room breakdown ──
  const roomBreakdown = (rooms || []).map(room => {
    const recs = all.filter(r => r.room_id === room.id)
    const app  = recs.filter(r => r.status === 'approved').length
    return {
      roomId: room.id, name: room.name, emoji: room.emoji,
      total: recs.length, approved: app,
      rejected: recs.filter(r => r.status === 'rejected').length,
      missed: recs.filter(r => r.status === 'missed').length,
      rate: recs.length > 0 ? Math.round((app / recs.length) * 100) : 0
    }
  })

  // ── Heatmap ──
  const heatmap = computeHeatmap(all, 90)

  // ── Status distribution (donut) ──
  const statusDistribution = [
    { name: 'Approved', value: approved, color: '#22c55e' },
    { name: 'Rejected', value: rejected, color: '#ef4444' },
    { name: 'Missed',   value: missed,   color: '#f59e0b' },
    { name: 'Pending',  value: pending,  color: '#6366f1' },
  ].filter(s => s.value > 0)

  return {
    overview: { totalDays, approved, rejected, missed, pending, overallRate },
    streaks: { currentStreak, bestStreak },
    weeklyTrend, monthlyTrend,
    roomBreakdown, heatmap, statusDistribution,
    totalRooms: (rooms || []).length,
    records: all
  }
}

/**
 * Full analytics for a user in a specific room.
 */
export async function getUserRoomAnalytics(roomId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Room info
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('id, name, emoji')
    .eq('id', roomId)
    .eq('user_id', user.id)
    .single()

  if (roomErr || !room) throw new Error('Room not found')

  // 2. Attendance
  const { data: records, error } = await supabase
    .from('attendance')
    .select('id, room_id, date, status, submitted_at, reviewed_at, note')
    .eq('user_id', user.id)
    .eq('room_id', roomId)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  const all = records || []

  // ── Stats ──
  const totalDays = all.length
  const approved  = all.filter(r => r.status === 'approved').length
  const rejected  = all.filter(r => r.status === 'rejected').length
  const missed    = all.filter(r => r.status === 'missed').length
  const pending   = all.filter(r => r.status === 'pending_review').length
  const rate = totalDays > 0 ? Math.round((approved / totalDays) * 100) : 0

  // ── Streaks ──
  const approvedDates = all.filter(r => r.status === 'approved').map(r => r.date).sort()
  const { currentStreak, bestStreak } = computeStreaks(approvedDates)

  // ── Trends ──
  const weeklyTrend  = computeWeeklyTrend(all, 12)
  const monthlyTrend = computeMonthlyTrend(all, 6)
  const heatmap      = computeHeatmap(all, 90)

  // ── Status distribution ──
  const statusDistribution = [
    { name: 'Approved', value: approved, color: '#22c55e' },
    { name: 'Rejected', value: rejected, color: '#ef4444' },
    { name: 'Missed',   value: missed,   color: '#f59e0b' },
    { name: 'Pending',  value: pending,  color: '#6366f1' },
  ].filter(s => s.value > 0)

  return {
    room,
    overview: { totalDays, approved, rejected, missed, pending, rate },
    streaks: { currentStreak, bestStreak },
    weeklyTrend, monthlyTrend, heatmap, statusDistribution,
    records: all
  }
}

// ════════════════════════════════════════════════════════════════
//  ADMIN ANALYTICS
// ════════════════════════════════════════════════════════════════

/**
 * Full analytics for an admin across all managed rooms/users.
 * Uses RLS — admin can see attendance for rooms they manage via room_invites.
 */
export async function getAdminAnalytics() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Rooms this admin manages (accepted invites)
  const { data: invites, error: invErr } = await supabase
    .from('room_invites')
    .select('room_id, room:rooms(id, name, emoji, user_id)')
    .eq('admin_id', user.id)
    .eq('status', 'accepted')

  if (invErr) throw new Error(invErr.message)
  if (!invites || invites.length === 0) {
    return {
      overview: { totalRecords: 0, approved: 0, rejected: 0, missed: 0, pendingReview: 0, overallRate: 0 },
      totalRooms: 0, totalUsers: 0,
      userPerformance: [], roomStats: [],
      weeklyTrend: [], statusDistribution: [], records: []
    }
  }

  const roomIds = invites.map(i => i.room_id)
  const roomMap = {}
  const userIds = new Set()
  for (const inv of invites) {
    if (inv.room) {
      roomMap[inv.room.id] = inv.room
      if (inv.room.user_id) userIds.add(inv.room.user_id)
    }
  }

  // 2. All attendance across managed rooms (RLS allows admin to read)
  const { data: records, error } = await supabase
    .from('attendance')
    .select('id, room_id, user_id, date, status, submitted_at, reviewed_at, note')
    .in('room_id', roomIds)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)

  // 3. Get profiles for users in these rooms (MUST come before enrichment)
  const allUserIds = [...new Set((records || []).map(r => r.user_id))]
  const profileMap = {}
  if (allUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', allUserIds)
    for (const p of (profiles || [])) profileMap[p.id] = p
  }

  // Enrich records with room & user info for exports
  const all = (records || []).map(r => ({
    ...r,
    room: roomMap[r.room_id] || null,
    user: profileMap[r.user_id] || null
  }))

  // ── Overview ──
  const totalRecords = all.length
  const approved     = all.filter(r => r.status === 'approved').length
  const rejected     = all.filter(r => r.status === 'rejected').length
  const missed       = all.filter(r => r.status === 'missed').length
  const pendingReview = all.filter(r => r.status === 'pending_review').length
  const overallRate  = totalRecords > 0 ? Math.round((approved / totalRecords) * 100) : 0

  // ── Per-user performance ──
  const userGroups = {}
  for (const rec of all) {
    if (!userGroups[rec.user_id]) {
      userGroups[rec.user_id] = { user: profileMap[rec.user_id], records: [] }
    }
    userGroups[rec.user_id].records.push(rec)
  }

  const userPerformance = Object.values(userGroups).map(({ user: u, records: recs }) => {
    const total = recs.length
    const app = recs.filter(r => r.status === 'approved').length
    const rej = recs.filter(r => r.status === 'rejected').length
    const mis = recs.filter(r => r.status === 'missed').length
    const rate = total > 0 ? Math.round((app / total) * 100) : 0
    const approvedDates = recs.filter(r => r.status === 'approved').map(r => r.date).sort()
    const { currentStreak, bestStreak } = computeStreaks(approvedDates)

    return {
      userId: u?.id || recs[0]?.user_id,
      name: u?.name || u?.email || 'Unknown',
      avatar_url: u?.avatar_url,
      total, approved: app, rejected: rej, missed: mis, rate,
      currentStreak, bestStreak
    }
  }).sort((a, b) => b.rate - a.rate)

  // ── Per-room stats ──
  const roomStats = Object.values(roomMap).map(room => {
    const recs = all.filter(r => r.room_id === room.id)
    const app  = recs.filter(r => r.status === 'approved').length
    const ownerProfile = profileMap[room.user_id]
    return {
      roomId: room.id, name: room.name, emoji: room.emoji,
      userName: ownerProfile?.name || ownerProfile?.email || 'Unknown',
      total: recs.length, approved: app,
      rate: recs.length > 0 ? Math.round((app / recs.length) * 100) : 0
    }
  })

  // ── Weekly trend ──
  const weeklyTrend = computeWeeklyTrend(all, 12)

  // ── Status distribution ──
  const statusDistribution = [
    { name: 'Approved', value: approved, color: '#22c55e' },
    { name: 'Rejected', value: rejected, color: '#ef4444' },
    { name: 'Missed',   value: missed,   color: '#f59e0b' },
    { name: 'Pending',  value: pendingReview, color: '#6366f1' },
  ].filter(s => s.value > 0)

  return {
    overview: { totalRecords, approved, rejected, missed, pendingReview, overallRate },
    totalRooms: roomIds.length,
    totalUsers: Object.keys(userGroups).length,
    userPerformance, roomStats, weeklyTrend, statusDistribution,
    records: all
  }
}

/**
 * Full analytics for a specific user, scoped to rooms this admin manages.
 */
export async function getAdminUserAnalytics(targetUserId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Rooms admin manages
  const { data: invites } = await supabase
    .from('room_invites')
    .select('room_id, room:rooms(id, name, emoji, user_id)')
    .eq('admin_id', user.id)
    .eq('status', 'accepted')

  if (!invites?.length) return null

  // Filter to rooms that belong to this target user
  const userRooms = invites.filter(i => i.room?.user_id === targetUserId).map(i => i.room)
  if (userRooms.length === 0) return null
  const roomIds = userRooms.map(r => r.id)

  // 2. Attendance
  const { data: records, error } = await supabase
    .from('attendance')
    .select('id, room_id, user_id, date, status, submitted_at, reviewed_at, note, room:rooms(id, name, emoji)')
    .eq('user_id', targetUserId)
    .in('room_id', roomIds)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  const all = records || []

  // 3. Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url')
    .eq('id', targetUserId)
    .single()

  // ── Stats ──
  const totalDays = all.length
  const approved  = all.filter(r => r.status === 'approved').length
  const rejected  = all.filter(r => r.status === 'rejected').length
  const missed    = all.filter(r => r.status === 'missed').length
  const pending   = all.filter(r => r.status === 'pending_review').length
  const overallRate = totalDays > 0 ? Math.round((approved / totalDays) * 100) : 0

  const approvedDates = all.filter(r => r.status === 'approved').map(r => r.date).sort()
  const { currentStreak, bestStreak } = computeStreaks(approvedDates)

  const weeklyTrend  = computeWeeklyTrend(all, 12)
  const monthlyTrend = computeMonthlyTrend(all, 6)
  const heatmap      = computeHeatmap(all, 90)

  const roomBreakdown = userRooms.map(room => {
    const recs = all.filter(r => r.room_id === room.id)
    const app  = recs.filter(r => r.status === 'approved').length
    return {
      roomId: room.id, name: room.name, emoji: room.emoji,
      total: recs.length, approved: app,
      rejected: recs.filter(r => r.status === 'rejected').length,
      missed: recs.filter(r => r.status === 'missed').length,
      rate: recs.length > 0 ? Math.round((app / recs.length) * 100) : 0
    }
  })

  const statusDistribution = [
    { name: 'Approved', value: approved, color: '#22c55e' },
    { name: 'Rejected', value: rejected, color: '#ef4444' },
    { name: 'Missed',   value: missed,   color: '#f59e0b' },
    { name: 'Pending',  value: pending,  color: '#6366f1' },
  ].filter(s => s.value > 0)

  return {
    user: profile,
    overview: { totalDays, approved, rejected, missed, pending, overallRate },
    streaks: { currentStreak, bestStreak },
    weeklyTrend, monthlyTrend, roomBreakdown, heatmap, statusDistribution,
    totalRooms: userRooms.length,
    records: all
  }
}


// ════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

function computeStreaks(sortedDates) {
  if (!sortedDates.length) return { currentStreak: 0, bestStreak: 0 }

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const lastDate  = sortedDates[sortedDates.length - 1]
  const isActive  = lastDate === today || lastDate === yesterday

  let bestStreak = 1
  let tempStreak = 1

  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const diff = (new Date(sortedDates[i + 1]) - new Date(sortedDates[i])) / 86400000
    if (diff === 1) tempStreak++
    else {
      if (tempStreak > bestStreak) bestStreak = tempStreak
      tempStreak = 1
    }
  }
  if (tempStreak > bestStreak) bestStreak = tempStreak

  // Current streak: count backwards from end
  let currentStreak = 1
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    if ((new Date(sortedDates[i + 1]) - new Date(sortedDates[i])) / 86400000 === 1) currentStreak++
    else break
  }

  return { currentStreak: isActive ? currentStreak : 0, bestStreak }
}

function computeWeeklyTrend(records, weeks) {
  const now = new Date()
  const trend = []

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (w * 7) - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const startStr = weekStart.toISOString().split('T')[0]
    const endStr   = weekEnd.toISOString().split('T')[0]

    const weekRecs = records.filter(r => r.date >= startStr && r.date <= endStr)
    const app   = weekRecs.filter(r => r.status === 'approved').length
    const total = weekRecs.length

    trend.push({
      week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      approved: app, total,
      rate: total > 0 ? Math.round((app / total) * 100) : 0
    })
  }
  return trend
}

function computeMonthlyTrend(records, months) {
  const now = new Date()
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const trend = []

  for (let m = months - 1; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const year  = d.getFullYear()
    const month = d.getMonth()
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endStr   = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const monthRecs = records.filter(r => r.date >= startStr && r.date <= endStr)
    const app = monthRecs.filter(r => r.status === 'approved').length

    trend.push({
      month: names[month],
      approved: app,
      rejected: monthRecs.filter(r => r.status === 'rejected').length,
      missed: monthRecs.filter(r => r.status === 'missed').length,
      total: monthRecs.length,
      rate: monthRecs.length > 0 ? Math.round((app / monthRecs.length) * 100) : 0
    })
  }
  return trend
}

function computeHeatmap(records, days) {
  const now = new Date()
  const heatmap = []

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now)
    date.setDate(now.getDate() - d)
    const dateStr = date.toISOString().split('T')[0]
    const dayRecs = records.filter(r => r.date === dateStr)
    const app   = dayRecs.filter(r => r.status === 'approved').length
    const total = dayRecs.length

    heatmap.push({
      date: dateStr,
      day: date.getDay(),
      approved: app, total,
      level: total === 0 ? 0 : app === total ? 3 : app > 0 ? 2 : 1
    })
  }
  return heatmap
}
