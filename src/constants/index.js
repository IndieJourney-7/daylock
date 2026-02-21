// Room status constants
export const ROOM_STATUS = {
  OPEN: 'OPEN',
  LOCKED: 'LOCKED',
}

// Attendance status constants
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  PENDING: 'PENDING',
}

// Room types
export const ROOMS = {
  GYM: 'gym',
  WORK: 'work',
  OTHER: 'other',
  ATTENDANCE: 'attendance',
}

// Navigation items for sidebar
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'home' },
  { id: 'rooms', label: 'Rooms', path: '/rooms', icon: 'rooms' },
  { id: 'leaderboard', label: 'Leaderboard', path: '/leaderboard', icon: 'trophy' },
  { id: 'challenges', label: 'Challenges', path: '/challenges', icon: 'sword' },
  { id: 'feed', label: 'Feed', path: '/feed', icon: 'activity' },
  { id: 'analytics', label: 'Analytics', path: '/analytics', icon: 'chart' },
  { id: 'gallery', label: 'Gallery', path: '/gallery', icon: 'gallery' },
  { id: 'history', label: 'History', path: '/history', icon: 'history' },
  { id: 'profile', label: 'Profile', path: '/profile', icon: 'profile' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: 'settings' },
]

// Admin navigation items
export const ADMIN_NAV_ITEMS = [
  { id: 'admin-dashboard', label: 'Admin Panel', path: '/admin', icon: 'shield' },
  { id: 'admin-rooms', label: 'Managed Rooms', path: '/admin/rooms', icon: 'rooms' },
  { id: 'admin-analytics', label: 'Analytics', path: '/admin/analytics', icon: 'chart' },
  { id: 'admin-settings', label: 'Admin Settings', path: '/admin/settings', icon: 'settings' },
]

// Days of week
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Months
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// ============================================================
// PRESSURE SYSTEM CONSTANTS (Phase 1)
// ============================================================

// Streak milestone thresholds that trigger celebrations
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365]

// Discipline point values (mirror of pressure.js for reference)
export const DISCIPLINE_POINTS = {
  APPROVED: 10,
  STREAK_BONUS: 2,
  ON_TIME_BONUS: 3,
  MISSED: -15,
  REJECTED: -5,
  REFLECTION: 5,
}

// Minimum reflection length (characters)
export const MIN_REFLECTION_LENGTH = 20

// Urgency thresholds (seconds)
export const URGENCY_THRESHOLDS = {
  CRITICAL: 300,   // 5 minutes
  HIGH: 900,       // 15 minutes
  MEDIUM: 1800,    // 30 minutes
}
