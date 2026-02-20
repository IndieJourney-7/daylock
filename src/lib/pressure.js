/**
 * Pressure System - Core Utilities
 * Handles streak identity, dynamic messages, discipline points,
 * countdown calculations, and miss confrontation logic.
 * 
 * All calculations are client-side from existing attendance data.
 */

// ============================================================
// STREAK IDENTITY SYSTEM
// Users earn identity phases based on consecutive approved days
// ============================================================

export const STREAK_PHASES = [
  { min: 0,   max: 0,   label: 'Start Today',   emoji: '⚡', color: 'text-gray-400',    bg: 'bg-gray-500/20',    border: 'border-gray-500/30' },
  { min: 1,   max: 2,   label: 'Newcomer',       emoji: '🌱', color: 'text-green-400',   bg: 'bg-green-500/20',   border: 'border-green-500/30' },
  { min: 3,   max: 6,   label: 'Building',       emoji: '🔨', color: 'text-blue-400',    bg: 'bg-blue-500/20',    border: 'border-blue-500/30' },
  { min: 7,   max: 13,  label: 'Committed',      emoji: '💪', color: 'text-purple-400',  bg: 'bg-purple-500/20',  border: 'border-purple-500/30' },
  { min: 14,  max: 29,  label: 'Warrior',        emoji: '⚔️', color: 'text-orange-400',  bg: 'bg-orange-500/20',  border: 'border-orange-500/30' },
  { min: 30,  max: 59,  label: 'Disciplined',    emoji: '🎯', color: 'text-yellow-400',  bg: 'bg-yellow-500/20',  border: 'border-yellow-500/30' },
  { min: 60,  max: 99,  label: 'Elite',          emoji: '🏆', color: 'text-amber-400',   bg: 'bg-amber-500/20',   border: 'border-amber-500/30' },
  { min: 100, max: Infinity, label: 'Legend',     emoji: '👑', color: 'text-red-400',     bg: 'bg-red-500/20',     border: 'border-red-500/30' },
]

/**
 * Get user's streak identity phase based on current streak count
 */
export function getStreakPhase(streak) {
  const s = Math.max(0, streak || 0)
  return STREAK_PHASES.find(p => s >= p.min && s <= p.max) || STREAK_PHASES[0]
}

/**
 * Get progress to next phase (0–100)
 */
export function getPhaseProgress(streak) {
  const s = Math.max(0, streak || 0)
  const current = getStreakPhase(s)
  if (current.max === Infinity) return 100 // Max phase
  const range = current.max - current.min + 1
  const progress = s - current.min
  return Math.min(100, Math.round((progress / range) * 100))
}

/**
 * Get next phase (or null if at max)
 */
export function getNextPhase(streak) {
  const current = getStreakPhase(streak)
  const idx = STREAK_PHASES.indexOf(current)
  if (idx >= STREAK_PHASES.length - 1) return null
  return STREAK_PHASES[idx + 1]
}

/**
 * Get days remaining until next phase
 */
export function getDaysToNextPhase(streak) {
  const s = Math.max(0, streak || 0)
  const next = getNextPhase(s)
  if (!next) return 0
  return next.min - s
}

// ============================================================
// DISCIPLINE POINTS SYSTEM
// Calculated from attendance history
// ============================================================

export const POINT_VALUES = {
  APPROVED:       10,   // Successfully marked attendance
  STREAK_BONUS:   2,    // Per day of active streak (compounding)
  ON_TIME_BONUS:  3,    // Submitted within first half of window
  MISSED:        -15,   // Missed a day
  REJECTED:       -5,   // Proof got rejected
  REFLECTION:     5,    // Wrote a reflection after miss
}

/**
 * Calculate discipline points from attendance records
 * @param {Array} attendanceRecords - All attendance records for user
 * @param {number} currentStreak - Current consecutive day streak
 * @returns {{ total, breakdown, level, title }}
 */
export function calculateDisciplinePoints(attendanceRecords = [], currentStreak = 0) {
  let total = 0
  const breakdown = {
    approved: 0,
    streakBonus: 0,
    onTimeBonus: 0,
    missed: 0,
    rejected: 0,
    reflections: 0,
  }

  attendanceRecords.forEach(record => {
    switch (record.status) {
      case 'approved':
        total += POINT_VALUES.APPROVED
        breakdown.approved += POINT_VALUES.APPROVED
        break
      case 'missed':
        total += POINT_VALUES.MISSED
        breakdown.missed += POINT_VALUES.MISSED
        // Check if they wrote a reflection (note on a missed record)
        if (record.note && record.note.length > 20) {
          total += POINT_VALUES.REFLECTION
          breakdown.reflections += POINT_VALUES.REFLECTION
        }
        break
      case 'rejected':
        total += POINT_VALUES.REJECTED
        breakdown.rejected += POINT_VALUES.REJECTED
        break
      default:
        break
    }
  })

  // Streak bonus (compounding)
  const streakBonus = currentStreak * POINT_VALUES.STREAK_BONUS
  total += streakBonus
  breakdown.streakBonus = streakBonus

  // Ensure minimum 0
  total = Math.max(0, total)

  // Determine discipline level
  const level = getDisciplineLevel(total)

  return { total, breakdown, ...level }
}

/**
 * Get discipline level from total points
 */
export function getDisciplineLevel(points) {
  if (points >= 500) return { level: 5, title: 'Iron Will',      levelColor: 'text-red-400' }
  if (points >= 300) return { level: 4, title: 'Unshakeable',    levelColor: 'text-amber-400' }
  if (points >= 150) return { level: 3, title: 'Consistent',     levelColor: 'text-yellow-400' }
  if (points >= 50)  return { level: 2, title: 'Progressing',    levelColor: 'text-blue-400' }
  if (points >= 10)  return { level: 1, title: 'Getting Started', levelColor: 'text-green-400' }
  return { level: 0, title: 'Unranked', levelColor: 'text-gray-400' }
}

// ============================================================
// COUNTDOWN TIMER UTILITIES
// Calculate time remaining until room closes/opens
// ============================================================

/**
 * Get countdown data for a room
 * @param {Object} room - Room with time_start, time_end
 * @returns {{ isOpen, timeRemaining, totalSeconds, urgencyLevel, label }}
 */
export function getRoomCountdown(room) {
  if (!room?.time_start || !room?.time_end) {
    return { isOpen: false, timeRemaining: null, totalSeconds: 0, urgencyLevel: 'none', label: 'No schedule' }
  }

  const now = new Date()
  const [startH, startM] = room.time_start.slice(0, 5).split(':').map(Number)
  const [endH, endM] = room.time_end.slice(0, 5).split(':').map(Number)

  // Create Date objects for start and end today
  const startTime = new Date(now)
  startTime.setHours(startH, startM, 0, 0)
  
  const endTime = new Date(now)
  endTime.setHours(endH, endM, 0, 0)

  // Handle midnight crossing
  if (endTime <= startTime) {
    if (now < endTime) {
      startTime.setDate(startTime.getDate() - 1)
    } else {
      endTime.setDate(endTime.getDate() + 1)
    }
  }

  const isOpen = now >= startTime && now <= endTime
  
  if (isOpen) {
    // Time until room closes
    const totalSeconds = Math.max(0, Math.floor((endTime - now) / 1000))
    const urgencyLevel = getUrgencyLevel(totalSeconds)
    return {
      isOpen: true,
      timeRemaining: formatCountdown(totalSeconds),
      totalSeconds,
      urgencyLevel,
      label: 'Closes in'
    }
  } else {
    // Time until room opens
    let nextStart = new Date(startTime)
    if (now > endTime) {
      nextStart.setDate(nextStart.getDate() + 1)
    }
    const totalSeconds = Math.max(0, Math.floor((nextStart - now) / 1000))
    return {
      isOpen: false,
      timeRemaining: formatCountdown(totalSeconds),
      totalSeconds,
      urgencyLevel: 'locked',
      label: 'Opens in'
    }
  }
}

/**
 * Get urgency level based on seconds remaining
 */
function getUrgencyLevel(seconds) {
  if (seconds <= 300)  return 'critical'   // < 5 min
  if (seconds <= 900)  return 'high'       // < 15 min
  if (seconds <= 1800) return 'medium'     // < 30 min
  return 'low'                             // > 30 min
}

/**
 * Format seconds into countdown string
 */
function formatCountdown(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`
  }
  return `${seconds}s`
}

// ============================================================
// DYNAMIC MESSAGES SYSTEM
// Context-aware motivational/pressure messages
// ============================================================

const MESSAGES = {
  // When room is open and user hasn't submitted
  OPEN_NO_SUBMIT: [
    { text: "The clock is ticking. Your discipline is being measured right now.", urgency: 'high' },
    { text: "Every second you wait, your streak gets more fragile.", urgency: 'medium' },
    { text: "Winners don't wait. Prove it now.", urgency: 'high' },
    { text: "This window won't open again. Act now or face consequences.", urgency: 'critical' },
    { text: "Your admin is watching. Don't give them a reason to doubt you.", urgency: 'medium' },
    { text: "Discipline isn't about motivation. It's about doing it anyway.", urgency: 'low' },
    { text: "The gap between who you are and who you want to be closes right here.", urgency: 'medium' },
  ],

  // When room is closing soon (< 15 min)
  CLOSING_SOON: [
    { text: "⚠️ FINAL WARNING: This room closes soon. Submit NOW.", urgency: 'critical' },
    { text: "You have minutes, not hours. Don't blow this.", urgency: 'critical' },
    { text: "Last chance. Miss this and your streak dies.", urgency: 'critical' },
    { text: "The window is slamming shut. Move.", urgency: 'critical' },
  ],

  // When user has a streak going
  STREAK_ACTIVE: [
    { text: "Don't break the chain. {streak} days of proof that you're different.", urgency: 'medium' },
    { text: "{streak} days strong. One miss erases the momentum.", urgency: 'medium' },
    { text: "Your {streak}-day streak is watching. Don't betray it.", urgency: 'low' },
    { text: "{streak} days of evidence that you can do this. Keep going.", urgency: 'low' },
  ],

  // When user just missed (confrontation)
  JUST_MISSED: [
    { text: "You missed. That's not a small thing. Your streak is gone.", urgency: 'critical' },
    { text: "Yesterday, you chose comfort over commitment. What will today be?", urgency: 'high' },
    { text: "A miss isn't just one day—it's proof that old habits are still stronger.", urgency: 'high' },
    { text: "Your admin was notified. Your record was updated. The evidence is permanent.", urgency: 'critical' },
  ],

  // When streak is at risk (missed recently, streak broken)
  STREAK_BROKEN: [
    { text: "You were at {lastStreak} days. Now you're at 0. Let that sink in.", urgency: 'critical' },
    { text: "The fall from {lastStreak} to 0 happened because of one choice.", urgency: 'high' },
    { text: "Recovery starts now. But the record remembers everything.", urgency: 'medium' },
  ],

  // Milestone celebrations
  MILESTONE: [
    { text: "🔥 {streak} DAYS! You've earned the title: {phase}.", urgency: 'low' },
    { text: "New identity unlocked: {phase} {emoji}. The journey shaped you.", urgency: 'low' },
  ],

  // Morning / not yet open
  ROOM_LOCKED: [
    { text: "Room locked. Your window opens in {countdown}. Be ready.", urgency: 'low' },
    { text: "Prepare your proof. The room opens in {countdown}.", urgency: 'low' },
    { text: "Locked for now. Discipline means being ready BEFORE it opens.", urgency: 'low' },
  ],

  // After completing all rooms for the day
  ALL_COMPLETE: [
    { text: "All rooms complete. Today, you won. Tomorrow, prove it again.", urgency: 'low' },
    { text: "100% attendance today. That's what discipline looks like.", urgency: 'low' },
    { text: "Today's chapter is written. Make tomorrow's just as strong.", urgency: 'low' },
  ],
}

/**
 * Get a contextual pressure message
 * @param {Object} context - { isOpen, hasSubmitted, streak, lastStreak, urgencyLevel, countdown, allComplete, hasMissedRecently }
 * @returns {{ text, urgency }}
 */
export function getDynamicMessage(context = {}) {
  const {
    isOpen = false,
    hasSubmitted = false,
    streak = 0,
    lastStreak = 0,
    urgencyLevel = 'low',
    countdown = '',
    allComplete = false,
    hasMissedRecently = false,
    phase = null,
  } = context

  let pool = []

  // Priority-based message selection
  if (allComplete) {
    pool = MESSAGES.ALL_COMPLETE
  } else if (hasMissedRecently && !hasSubmitted) {
    pool = lastStreak > 3 ? MESSAGES.STREAK_BROKEN : MESSAGES.JUST_MISSED
  } else if (isOpen && !hasSubmitted) {
    if (urgencyLevel === 'critical' || urgencyLevel === 'high') {
      pool = MESSAGES.CLOSING_SOON
    } else {
      pool = MESSAGES.OPEN_NO_SUBMIT
    }
    // Mix in streak messages if applicable
    if (streak > 2) {
      pool = [...pool, ...MESSAGES.STREAK_ACTIVE]
    }
  } else if (!isOpen) {
    pool = MESSAGES.ROOM_LOCKED
  } else if (streak > 0 && hasSubmitted) {
    // Check for milestone
    const milestones = [3, 7, 14, 30, 60, 100]
    if (milestones.includes(streak)) {
      pool = MESSAGES.MILESTONE
    } else {
      pool = MESSAGES.STREAK_ACTIVE
    }
  }

  if (pool.length === 0) {
    pool = MESSAGES.OPEN_NO_SUBMIT
  }

  // Pick a random message from the pool (seeded by minute so it doesn't flash)
  const minuteSeed = new Date().getMinutes()
  const msg = pool[minuteSeed % pool.length]
  
  // Replace placeholders
  let text = msg.text
    .replace(/{streak}/g, streak)
    .replace(/{lastStreak}/g, lastStreak)
    .replace(/{countdown}/g, countdown)
    .replace(/{phase}/g, phase?.label || '')
    .replace(/{emoji}/g, phase?.emoji || '')

  return { text, urgency: msg.urgency }
}

// ============================================================
// MISS DETECTION UTILITIES
// ============================================================

/**
 * Check if user has any missed rooms today or recently
 * @param {Array} roomSummaries - Rooms with todayStatus
 * @returns {{ hasMissedToday, missedRooms, recentMissCount }}
 */
export function detectMisses(roomSummaries = []) {
  const missedRooms = roomSummaries.filter(r => r.todayStatus === 'missed')
  const rejectedRooms = roomSummaries.filter(r => r.todayStatus === 'rejected')
  
  return {
    hasMissedToday: missedRooms.length > 0,
    hasRejectedToday: rejectedRooms.length > 0,
    missedRooms,
    rejectedRooms,
    missCount: missedRooms.length,
  }
}

/**
 * Check if a reflection is required (user has unreflected misses)
 * A miss with no note or a note shorter than 20 chars needs reflection
 */
export function needsReflection(attendanceRecords = []) {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  return attendanceRecords.filter(r => 
    (r.date === today || r.date === yesterday) &&
    (r.status === 'missed' || r.status === 'rejected') &&
    (!r.note || r.note.length < 20)
  )
}

/**
 * Calculate streak from attendance history
 * @param {Array} records - attendance records sorted by date desc
 * @returns {{ current, longest, lastStreak }}
 */
export function calculateStreak(records = []) {
  if (!records.length) return { current: 0, longest: 0, lastStreak: 0 }

  // Get unique dates with approved status
  const approvedDates = [...new Set(
    records
      .filter(r => r.status === 'approved')
      .map(r => r.date)
  )].sort((a, b) => new Date(b) - new Date(a))

  if (!approvedDates.length) return { current: 0, longest: 0, lastStreak: 0 }

  let current = 0
  let longest = 0
  let lastStreak = 0
  let tempStreak = 1
  let checkDate = new Date()
  checkDate.setHours(0, 0, 0, 0)

  // Check if today or yesterday is in the list (streak is alive)
  const todayStr = checkDate.toISOString().split('T')[0]
  const yesterdayStr = new Date(checkDate - 86400000).toISOString().split('T')[0]
  const streakAlive = approvedDates[0] === todayStr || approvedDates[0] === yesterdayStr

  // Calculate current streak
  if (streakAlive) {
    current = 1
    for (let i = 1; i < approvedDates.length; i++) {
      const prev = new Date(approvedDates[i - 1])
      const curr = new Date(approvedDates[i])
      const diffDays = Math.floor((prev - curr) / 86400000)
      if (diffDays === 1) {
        current++
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1
  for (let i = 1; i < approvedDates.length; i++) {
    const prev = new Date(approvedDates[i - 1])
    const curr = new Date(approvedDates[i])
    const diffDays = Math.floor((prev - curr) / 86400000)
    if (diffDays === 1) {
      tempStreak++
    } else {
      if (tempStreak > longest) {
        longest = tempStreak
        if (!streakAlive) lastStreak = tempStreak
      }
      tempStreak = 1
    }
  }
  if (tempStreak > longest) longest = tempStreak

  // If streak is not alive, lastStreak = the last streak before breaking
  if (!streakAlive && longest > 0) {
    lastStreak = longest
  }

  return { current, longest: Math.max(longest, current), lastStreak }
}

// ============================================================
// URGENCY COLOR UTILITIES
// ============================================================

export const URGENCY_STYLES = {
  critical: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    ring: 'ring-red-500/50',
    pulse: true,
    glow: 'shadow-red-500/20',
  },
  high: {
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    ring: 'ring-orange-500/50',
    pulse: true,
    glow: 'shadow-orange-500/20',
  },
  medium: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    ring: 'ring-yellow-500/50',
    pulse: false,
    glow: '',
  },
  low: {
    text: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    ring: 'ring-accent/50',
    pulse: false,
    glow: '',
  },
  locked: {
    text: 'text-gray-500',
    bg: 'bg-charcoal-500/30',
    border: 'border-charcoal-400/20',
    ring: '',
    pulse: false,
    glow: '',
  },
  none: {
    text: 'text-gray-500',
    bg: 'bg-charcoal-500/30',
    border: 'border-charcoal-400/20',
    ring: '',
    pulse: false,
    glow: '',
  },
}

export function getUrgencyStyle(level) {
  return URGENCY_STYLES[level] || URGENCY_STYLES.none
}

export default {
  getStreakPhase,
  getPhaseProgress,
  getNextPhase,
  getDaysToNextPhase,
  calculateDisciplinePoints,
  getDisciplineLevel,
  getRoomCountdown,
  getDynamicMessage,
  detectMisses,
  needsReflection,
  calculateStreak,
  getUrgencyStyle,
  STREAK_PHASES,
  POINT_VALUES,
  URGENCY_STYLES,
}
