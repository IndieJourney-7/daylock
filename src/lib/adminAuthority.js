/**
 * Admin Authority System
 * Core utilities for quality ratings, warnings, consequences, and weekly stats
 */

// ============ QUALITY RATINGS ============

export const QUALITY_LEVELS = {
  1: { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500/10', emoji: '😞' },
  2: { label: 'Below Average', color: 'text-orange-400', bg: 'bg-orange-500/10', emoji: '😐' },
  3: { label: 'Average', color: 'text-yellow-400', bg: 'bg-yellow-500/10', emoji: '🙂' },
  4: { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10', emoji: '😊' },
  5: { label: 'Excellent', color: 'text-accent', bg: 'bg-accent/10', emoji: '🔥' }
}

export function getQualityLevel(rating) {
  return QUALITY_LEVELS[rating] || QUALITY_LEVELS[3]
}

export function getAverageQuality(records) {
  const rated = records.filter(r => r.quality_rating)
  if (rated.length === 0) return null
  const sum = rated.reduce((acc, r) => acc + r.quality_rating, 0)
  return Math.round((sum / rated.length) * 10) / 10
}

// ============ WARNING TRIGGERS ============

export const WARNING_TRIGGERS = {
  CONSECUTIVE_MISSES: {
    id: 'CONSECUTIVE_MISSES',
    label: 'Consecutive Misses',
    threshold: 3,
    severity: 'warning',
    message: (count) => `${count} consecutive days missed. This pattern needs attention.`
  },
  LOW_ATTENDANCE_RATE: {
    id: 'LOW_ATTENDANCE_RATE',
    label: 'Low Attendance Rate',
    threshold: 50,
    severity: 'warning',
    message: (rate) => `Attendance rate dropped to ${rate}%. Below acceptable threshold.`
  },
  STREAK_BROKEN: {
    id: 'STREAK_BROKEN',
    label: 'Long Streak Broken',
    threshold: 7,
    severity: 'info',
    message: (streak) => `A ${streak}-day streak was broken. Consider checking in with the user.`
  },
  REPEATED_REJECTIONS: {
    id: 'REPEATED_REJECTIONS',
    label: 'Repeated Rejections',
    threshold: 3,
    severity: 'strike',
    message: (count) => `${count} proofs rejected recently. Quality standards not being met.`
  },
  LOW_QUALITY_AVG: {
    id: 'LOW_QUALITY_AVG',
    label: 'Low Quality Average',
    threshold: 2,
    severity: 'warning',
    message: (avg) => `Average quality rating is ${avg}/5. Effort may be declining.`
  },
  WEEK_WITHOUT_SUBMISSION: {
    id: 'WEEK_WITHOUT_SUBMISSION',
    label: 'No Submissions',
    threshold: 7,
    severity: 'strike',
    message: (days) => `No proof submitted in ${days} days. User may have disengaged.`
  }
}

/**
 * Detect warnings from attendance records
 * Returns array of triggered warnings
 */
export function detectWarnings(records) {
  if (!records || records.length === 0) return []
  
  const warnings = []
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date))
  
  // 1. Consecutive misses
  let consecutiveMisses = 0
  for (const record of sorted) {
    if (record.status === 'missed') consecutiveMisses++
    else break
  }
  if (consecutiveMisses >= WARNING_TRIGGERS.CONSECUTIVE_MISSES.threshold) {
    warnings.push({
      trigger: WARNING_TRIGGERS.CONSECUTIVE_MISSES,
      value: consecutiveMisses,
      message: WARNING_TRIGGERS.CONSECUTIVE_MISSES.message(consecutiveMisses),
      severity: WARNING_TRIGGERS.CONSECUTIVE_MISSES.severity
    })
  }
  
  // 2. Low attendance rate (last 14 days)
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const recentRecords = sorted.filter(r => new Date(r.date) >= twoWeeksAgo)
  if (recentRecords.length >= 5) {
    const approved = recentRecords.filter(r => r.status === 'approved').length
    const rate = Math.round((approved / recentRecords.length) * 100)
    if (rate < WARNING_TRIGGERS.LOW_ATTENDANCE_RATE.threshold) {
      warnings.push({
        trigger: WARNING_TRIGGERS.LOW_ATTENDANCE_RATE,
        value: rate,
        message: WARNING_TRIGGERS.LOW_ATTENDANCE_RATE.message(rate),
        severity: WARNING_TRIGGERS.LOW_ATTENDANCE_RATE.severity
      })
    }
  }
  
  // 3. Repeated rejections (last 7 records)
  const recentSeven = sorted.slice(0, 7)
  const rejections = recentSeven.filter(r => r.status === 'rejected').length
  if (rejections >= WARNING_TRIGGERS.REPEATED_REJECTIONS.threshold) {
    warnings.push({
      trigger: WARNING_TRIGGERS.REPEATED_REJECTIONS,
      value: rejections,
      message: WARNING_TRIGGERS.REPEATED_REJECTIONS.message(rejections),
      severity: WARNING_TRIGGERS.REPEATED_REJECTIONS.severity
    })
  }
  
  // 4. Low quality average (rated records only)
  const avgQuality = getAverageQuality(recentRecords)
  if (avgQuality !== null && avgQuality < WARNING_TRIGGERS.LOW_QUALITY_AVG.threshold) {
    warnings.push({
      trigger: WARNING_TRIGGERS.LOW_QUALITY_AVG,
      value: avgQuality,
      message: WARNING_TRIGGERS.LOW_QUALITY_AVG.message(avgQuality),
      severity: WARNING_TRIGGERS.LOW_QUALITY_AVG.severity
    })
  }
  
  // 5. Days since last submission
  if (sorted.length > 0) {
    const lastSubmission = sorted.find(r => r.status !== 'missed')
    if (lastSubmission) {
      const daysSince = Math.floor((Date.now() - new Date(lastSubmission.date).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince >= WARNING_TRIGGERS.WEEK_WITHOUT_SUBMISSION.threshold) {
        warnings.push({
          trigger: WARNING_TRIGGERS.WEEK_WITHOUT_SUBMISSION,
          value: daysSince,
          message: WARNING_TRIGGERS.WEEK_WITHOUT_SUBMISSION.message(daysSince),
          severity: WARNING_TRIGGERS.WEEK_WITHOUT_SUBMISSION.severity
        })
      }
    }
  }
  
  return warnings
}

// ============ CONSEQUENCE LEVELS ============

export const CONSEQUENCE_LEVELS = {
  warning: { level: 1, label: 'Warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '⚠️' },
  strike: { level: 2, label: 'Strike', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '⚡' },
  probation: { level: 3, label: 'Probation', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '🚨' },
  final_warning: { level: 4, label: 'Final Warning', color: 'text-red-500', bg: 'bg-red-600/10', border: 'border-red-600/20', icon: '🔴' },
  removal: { level: 5, label: 'Removal', color: 'text-red-600', bg: 'bg-red-700/10', border: 'border-red-700/20', icon: '❌' }
}

export function getNextConsequenceLevel(currentConsequences) {
  const active = (currentConsequences || []).filter(c => c.active)
  if (active.length === 0) return 'warning'
  
  const levels = Object.keys(CONSEQUENCE_LEVELS)
  const highest = active.reduce((max, c) => {
    const idx = levels.indexOf(c.level)
    return idx > max ? idx : max
  }, -1)
  
  return levels[Math.min(highest + 1, levels.length - 1)]
}

export function getConsequenceSummary(consequences) {
  const active = (consequences || []).filter(c => c.active)
  const resolved = (consequences || []).filter(c => !c.active)
  const highest = active.reduce((max, c) => {
    const config = CONSEQUENCE_LEVELS[c.level]
    return config && config.level > (max?.level || 0) ? config : max
  }, null)
  
  return { active, resolved, highest, total: (consequences || []).length }
}

// ============ WEEKLY STATS ============

export function computeWeeklyStats(records) {
  if (!records || records.length === 0) return []
  
  const weeks = {}
  for (const record of records) {
    const date = new Date(record.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const key = weekStart.toISOString().split('T')[0]
    
    if (!weeks[key]) {
      weeks[key] = { weekStart: key, total: 0, approved: 0, rejected: 0, missed: 0, qualitySum: 0, qualityCount: 0 }
    }
    
    weeks[key].total++
    if (record.status === 'approved') weeks[key].approved++
    if (record.status === 'rejected') weeks[key].rejected++
    if (record.status === 'missed') weeks[key].missed++
    if (record.quality_rating) {
      weeks[key].qualitySum += record.quality_rating
      weeks[key].qualityCount++
    }
  }
  
  return Object.values(weeks)
    .map(w => ({
      ...w,
      rate: w.total > 0 ? Math.round((w.approved / w.total) * 100) : 0,
      avgQuality: w.qualityCount > 0 ? Math.round((w.qualitySum / w.qualityCount) * 10) / 10 : null
    }))
    .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart))
}

export function computeTrend(weeklyStats) {
  if (!weeklyStats || weeklyStats.length < 2) return { direction: 'stable', change: 0 }
  
  const current = weeklyStats[0]?.rate || 0
  const previous = weeklyStats[1]?.rate || 0
  const change = current - previous
  
  if (change > 5) return { direction: 'improving', change }
  if (change < -5) return { direction: 'declining', change }
  return { direction: 'stable', change }
}

// ============ FEEDBACK TEMPLATES ============

export const FEEDBACK_TEMPLATES = {
  approve: [
    'Great effort! Keep it up.',
    'Solid proof. Standards met.',
    'Good work today!',
    'Consistent quality. Well done.',
    'Excellent submission!'
  ],
  reject: [
    'Proof doesn\'t meet the rules. Please resubmit.',
    'Image is unclear. Try better lighting.',
    'Doesn\'t show completion of the task.',
    'Timestamp or proof is missing.',
    'Please follow all room rules.'
  ]
}

// ============ RULE SEVERITY ============

export function getRuleSeverityConfig(severity) {
  const configs = {
    minor: { label: 'Minor', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    moderate: { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    major: { label: 'Major', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  }
  return configs[severity] || configs.moderate
}

export default {
  QUALITY_LEVELS,
  getQualityLevel,
  getAverageQuality,
  WARNING_TRIGGERS,
  detectWarnings,
  CONSEQUENCE_LEVELS,
  getNextConsequenceLevel,
  getConsequenceSummary,
  computeWeeklyStats,
  computeTrend,
  FEEDBACK_TEMPLATES,
  getRuleSeverityConfig
}
