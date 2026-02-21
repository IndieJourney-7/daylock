/**
 * Lib barrel export
 * All services and utilities
 */

export { supabase } from './supabase'
export { api } from './api'
export { authService } from './auth'
export { roomsService } from './rooms'
export { invitesService } from './invites'
export { attendanceService } from './attendance'
export { rulesService } from './rules'
export { galleryService } from './gallery'
export { default as pressureSystem } from './pressure'
export { warningsService } from './warnings'
export { default as adminAuthority } from './adminAuthority'
export { detectWarnings, QUALITY_LEVELS, getQualityLevel, getAverageQuality, CONSEQUENCE_LEVELS, getNextConsequenceLevel, getConsequenceSummary, computeWeeklyStats, computeTrend, FEEDBACK_TEMPLATES } from './adminAuthority'
export { achievementsService as achievementsLib } from './achievements'
export { leaderboardService as leaderboardLib } from './leaderboard'
export { challengesService as challengesLib } from './challenges'
export { notificationsService as notificationsLib } from './notifications'
export { feedService as feedLib } from './feed'
export { remindersService as remindersLib, REMINDER_PRESETS } from './reminders'
