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
