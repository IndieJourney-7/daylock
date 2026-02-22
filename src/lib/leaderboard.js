/**
 * Leaderboard Service (Frontend — Direct Supabase)
 * Computes real rankings from attendance data.
 * No backend needed.
 */

import { supabase } from './supabase'

/**
 * Compute streaks from sorted date strings
 */
function computeStreaks(sortedDates) {
  if (!sortedDates.length) return { currentStreak: 0, bestStreak: 0 }

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const lastDate  = sortedDates[sortedDates.length - 1]
  const isActive  = lastDate === today || lastDate === yesterday

  let bestStreak = 1, tempStreak = 1
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    if ((new Date(sortedDates[i + 1]) - new Date(sortedDates[i])) / 86400000 === 1) tempStreak++
    else { if (tempStreak > bestStreak) bestStreak = tempStreak; tempStreak = 1 }
  }
  if (tempStreak > bestStreak) bestStreak = tempStreak

  let currentStreak = 1
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    if ((new Date(sortedDates[i + 1]) - new Date(sortedDates[i])) / 86400000 === 1) currentStreak++
    else break
  }

  return { currentStreak: isActive ? currentStreak : 0, bestStreak }
}

export const leaderboardService = {
  /**
   * Get global leaderboard — real stats from attendance + profiles
   */
  async getGlobal({ sortBy = 'discipline_score', period = 'all', limit = 50 } = {}) {
    // 1. Try the leaderboard_view first (most efficient)
    if (period === 'all') {
      const { data: viewData, error: viewErr } = await supabase
        .from('leaderboard_view')
        .select('*')
        .order(sortBy, { ascending: false, nullsFirst: false })
        .limit(limit)

      if (!viewErr && viewData?.length > 0) {
        return viewData.map((row, i) => ({
          rank: i + 1,
          user_id: row.user_id,
          display_name: row.name || 'Anonymous',
          avatar_url: row.avatar_url,
          discipline_score: row.discipline_score || 0,
          current_streak: row.current_streak || 0,
          longest_streak: row.longest_streak || 0,
          attendance_rate: row.attendance_rate || 0,
          total_approved: row.total_approved || 0,
          total_days: row.total_submissions || 0,
          achievements_count: row.achievements_count || 0
        }))
      }
    }

    // 2. Fallback / period-filtered: compute from raw attendance
    let attendanceQuery = supabase
      .from('attendance')
      .select('user_id, date, status')

    if (period === 'week') {
      const fromDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      attendanceQuery = attendanceQuery.gte('date', fromDate)
    } else if (period === 'month') {
      const now = new Date()
      const fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      attendanceQuery = attendanceQuery.gte('date', fromDate)
    }

    const { data: attendance, error: attErr } = await attendanceQuery
    if (attErr) throw new Error(attErr.message)

    // Aggregate per user
    const userMap = {}
    for (const rec of (attendance || [])) {
      if (!userMap[rec.user_id]) {
        userMap[rec.user_id] = { approved: 0, total: 0, approvedDates: [] }
      }
      userMap[rec.user_id].total++
      if (rec.status === 'approved') {
        userMap[rec.user_id].approved++
        userMap[rec.user_id].approvedDates.push(rec.date)
      }
    }

    const userIds = Object.keys(userMap)
    if (userIds.length === 0) {
      // No attendance — show all users with zero stats
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .limit(limit)

      return (allProfiles || []).map((p, i) => ({
        rank: i + 1,
        user_id: p.id,
        display_name: p.name || 'Anonymous',
        avatar_url: p.avatar_url,
        discipline_score: 0, current_streak: 0, longest_streak: 0,
        attendance_rate: 0, total_approved: 0, total_days: 0
      }))
    }

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, current_streak, longest_streak, total_discipline_points')
      .in('id', userIds)

    const profileMap = {}
    for (const p of (profiles || [])) profileMap[p.id] = p

    // Build leaderboard entries
    const entries = userIds.map(uid => {
      const stats = userMap[uid]
      const profile = profileMap[uid] || {}
      const sortedDates = stats.approvedDates.sort()
      const streaks = computeStreaks(sortedDates)
      const rate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

      // Discipline score: use DB value if available, otherwise compute from attendance
      const dbScore = profile.total_discipline_points || 0
      const computedScore = (stats.approved * 10) + (streaks.currentStreak * 5)
      const score = dbScore > 0 ? dbScore : computedScore

      return {
        user_id: uid,
        display_name: profile.name || 'Anonymous',
        avatar_url: profile.avatar_url,
        discipline_score: score,
        current_streak: profile.current_streak || streaks.currentStreak,
        longest_streak: profile.longest_streak || streaks.bestStreak,
        attendance_rate: rate,
        total_approved: stats.approved,
        total_days: stats.total
      }
    })

    // Sort
    entries.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))

    return entries.slice(0, limit).map((e, i) => ({ rank: i + 1, ...e }))
  },

  /**
   * Get room-specific leaderboard
   */
  async getForRoom(roomId) {
    // Try view first
    const { data: viewData, error: viewErr } = await supabase
      .from('room_leaderboard_view')
      .select('*')
      .eq('room_id', roomId)
      .order('attendance_rate', { ascending: false, nullsFirst: false })
      .limit(20)

    if (!viewErr && viewData?.length > 0) {
      return viewData.map((row, i) => ({
        rank: i + 1,
        user_id: row.user_id,
        display_name: row.name || 'Anonymous',
        avatar_url: row.avatar_url,
        attendance_rate: row.attendance_rate || 0,
        approved_count: row.approved_count || 0,
        total_count: row.total_count || 0,
        current_streak: row.current_streak || 0,
        total_days: row.total_count || 0
      }))
    }

    // Fallback: compute from raw data
    const { data: attendance } = await supabase
      .from('attendance')
      .select('user_id, status')
      .eq('room_id', roomId)

    const userMap = {}
    for (const r of (attendance || [])) {
      if (!userMap[r.user_id]) userMap[r.user_id] = { approved: 0, total: 0 }
      userMap[r.user_id].total++
      if (r.status === 'approved') userMap[r.user_id].approved++
    }

    const userIds = Object.keys(userMap)
    if (userIds.length === 0) return []

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, current_streak')
      .in('id', userIds)

    const profileMap = {}
    for (const p of (profiles || [])) profileMap[p.id] = p

    return userIds
      .map(uid => {
        const stats = userMap[uid]
        const p = profileMap[uid] || {}
        return {
          user_id: uid,
          display_name: p.name || 'Anonymous',
          avatar_url: p.avatar_url,
          approved_count: stats.approved,
          total_count: stats.total,
          total_days: stats.total,
          attendance_rate: stats.total > 0 ? Math.round(stats.approved / stats.total * 100) : 0,
          current_streak: p.current_streak || 0
        }
      })
      .sort((a, b) => b.attendance_rate - a.attendance_rate)
      .map((r, i) => ({ rank: i + 1, ...r }))
  },

  /**
   * Get current user's rank
   */
  async getMyRank() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { rank: 0, total: 0 }

    // Try to get all leaderboard data
    const entries = await leaderboardService.getGlobal({ sortBy: 'discipline_score', period: 'all', limit: 500 })
    const idx = entries.findIndex(e => e.user_id === user.id)
    return { rank: idx >= 0 ? idx + 1 : entries.length + 1, total: entries.length }
  },

  /** Get rank badge info */
  getRankBadge(rank) {
    if (rank === 1) return { icon: '👑', label: '1st', color: 'text-yellow-500' }
    if (rank === 2) return { icon: '🥈', label: '2nd', color: 'text-gray-400' }
    if (rank === 3) return { icon: '🥉', label: '3rd', color: 'text-amber-600' }
    return { icon: '', label: `#${rank}`, color: 'text-gray-500' }
  },

  SORT_OPTIONS: [
    { value: 'discipline_score', label: 'Discipline Score' },
    { value: 'current_streak', label: 'Current Streak' },
    { value: 'attendance_rate', label: 'Attendance Rate' }
  ],

  PERIOD_OPTIONS: [
    { value: 'all', label: 'All Time' },
    { value: 'month', label: 'This Month' },
    { value: 'week', label: 'This Week' }
  ]
}
