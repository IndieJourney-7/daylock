/**
 * Leaderboard Service (Frontend — Direct Supabase)
 * Computes real rankings from attendance data.
 * No backend needed.
 */

import { supabase } from './supabase'

/**
 * Get display name from profile — name or email username
 */
function displayName(profile) {
  if (profile?.name) return profile.name
  if (profile?.email) return profile.email.split('@')[0]
  return 'Anonymous'
}

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
   * Get global leaderboard — real stats computed from attendance + profiles.
   * 
   * Discipline Score formula:
   *   approved_days × 10   (volume — rewards showing up)
   * + attendance_rate × 0.5 (consistency — rewards quality)
   * + current_streak × 5   (momentum — rewards active streaks)
   * + longest_streak × 2   (history — rewards past dedication)
   */
  async getGlobal({ sortBy = 'discipline_score', period = 'all', limit = 50 } = {}) {
    // 1. Fetch all attendance (with optional period filter)
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

    // 2. Aggregate per user
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

    // 3. Get ALL profiles (so even users with 0 attendance appear)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')

    const profileMap = {}
    for (const p of (allProfiles || [])) profileMap[p.id] = p

    // Merge: users with attendance + users without
    const allUserIds = new Set([
      ...Object.keys(userMap),
      ...(allProfiles || []).map(p => p.id)
    ])

    // 4. Build leaderboard entries with real computed scores
    const entries = [...allUserIds].map(uid => {
      const stats = userMap[uid] || { approved: 0, total: 0, approvedDates: [] }
      const profile = profileMap[uid] || {}
      const sortedDates = [...stats.approvedDates].sort()
      const streaks = computeStreaks(sortedDates)
      const rate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 1000) / 10 : 0

      // Discipline Score = volume + consistency + momentum + history
      const score = Math.round(
        (stats.approved * 10) +
        (rate * 0.5) +
        (streaks.currentStreak * 5) +
        (streaks.bestStreak * 2)
      )

      return {
        user_id: uid,
        display_name: displayName(profile),
        avatar_url: profile.avatar_url,
        discipline_score: score,
        current_streak: streaks.currentStreak,
        longest_streak: streaks.bestStreak,
        attendance_rate: rate,
        total_approved: stats.approved,
        total_days: stats.total
      }
    })

    // 5. Sort and rank
    entries.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))

    return entries.slice(0, limit).map((e, i) => ({ rank: i + 1, ...e }))
  },

  /**
   * Get room-specific leaderboard — computed from raw attendance data
   */
  async getForRoom(roomId) {
    const { data: attendance } = await supabase
      .from('attendance')
      .select('user_id, date, status')
      .eq('room_id', roomId)

    const userMap = {}
    for (const r of (attendance || [])) {
      if (!userMap[r.user_id]) userMap[r.user_id] = { approved: 0, total: 0, approvedDates: [] }
      userMap[r.user_id].total++
      if (r.status === 'approved') {
        userMap[r.user_id].approved++
        userMap[r.user_id].approvedDates.push(r.date)
      }
    }

    const userIds = Object.keys(userMap)
    if (userIds.length === 0) return []

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds)

    const profileMap = {}
    for (const p of (profiles || [])) profileMap[p.id] = p

    return userIds
      .map(uid => {
        const stats = userMap[uid]
        const p = profileMap[uid] || {}
        const sortedDates = [...stats.approvedDates].sort()
        const streaks = computeStreaks(sortedDates)
        const rate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 1000) / 10 : 0
        return {
          user_id: uid,
          display_name: displayName(p),
          avatar_url: p.avatar_url,
          approved_count: stats.approved,
          total_count: stats.total,
          total_days: stats.total,
          attendance_rate: rate,
          current_streak: streaks.currentStreak,
          longest_streak: streaks.bestStreak,
          discipline_score: Math.round(
            (stats.approved * 10) + (rate * 0.5) + (streaks.currentStreak * 5) + (streaks.bestStreak * 2)
          )
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
