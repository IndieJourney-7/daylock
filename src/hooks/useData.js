/**
 * Custom hooks for data fetching
 * All API calls are authenticated via JWT - no need to pass userId
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  roomsService, 
  invitesService, 
  attendanceService, 
  rulesService,
  galleryService,
  warningsService
} from '../lib'
import { achievementsService } from '../lib/achievements'
import { leaderboardService } from '../lib/leaderboard'
import { challengesService } from '../lib/challenges'
import { notificationsService } from '../lib/notifications'
import { feedService } from '../lib/feed'

// Generic fetch hook
function useFetch(fetchFn, deps = [], shouldFetch = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [...deps, shouldFetch])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch, setData }
}

// ============ USER HOOKS ============

/**
 * Fetch user's rooms
 * userId is kept for backwards compatibility but not used in API call
 */
export function useRooms(userId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setData([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('useRooms: Fetching rooms')
      const result = await roomsService.getUserRooms()
      console.log('useRooms: Rooms fetched successfully:', result?.length, 'rooms')
      setData(result)
    } catch (err) {
      console.error('useRooms: Failed to fetch rooms:', err)
      setError(err.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch, setData }
}

/**
 * Fetch single room with stats
 */
export function useRoom(roomId, userId) {
  return useFetch(
    () => roomsService.getRoomWithStats(roomId, userId),
    [roomId, userId],
    !!roomId && !!userId
  )
}

/**
 * Fetch room rules
 */
export function useRoomRules(roomId) {
  const { data, loading, error, refetch, setData } = useFetch(
    () => rulesService.getRoomRules(roomId),
    [roomId],
    !!roomId
  )

  const addRule = async (text) => {
    const newRule = await rulesService.addRule(roomId, text)
    setData(prev => [...(prev || []), newRule])
    return newRule
  }

  const updateRule = async (ruleId, updates) => {
    const updated = await rulesService.updateRule(ruleId, updates)
    setData(prev => (prev || []).map(r => r.id === ruleId ? updated : r))
    return updated
  }

  const toggleRule = async (ruleId) => {
    const updated = await rulesService.toggleRule(ruleId)
    setData(prev => (prev || []).map(r => r.id === ruleId ? updated : r))
    return updated
  }

  const deleteRule = async (ruleId) => {
    await rulesService.deleteRule(ruleId)
    setData(prev => (prev || []).filter(r => r.id !== ruleId))
  }

  return { 
    rules: data || [], 
    loading, 
    error, 
    refetch,
    addRule,
    updateRule,
    toggleRule,
    deleteRule
  }
}

/**
 * Fetch user's attendance for a room
 */
export function useAttendance(roomId, userId) {
  const { data, loading, error, refetch } = useFetch(
    () => attendanceService.getUserAttendance(roomId),
    [roomId],
    !!roomId && !!userId
  )

  const submitProof = async (proofFile, note) => {
    const attendance = await attendanceService.submitProof(
      roomId, 
      userId, 
      proofFile, 
      note
    )
    refetch()
    return attendance
  }

  return { 
    attendance: data || [], 
    loading, 
    error, 
    refetch,
    submitProof
  }
}

/**
 * Get room stats
 */
export function useRoomStats(roomId, userId) {
  return useFetch(
    () => attendanceService.getRoomStats(roomId),
    [roomId],
    !!roomId && !!userId
  )
}

/**
 * Fetch user history (all attendance across all rooms)
 */
export function useUserHistory(userId, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setData([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await attendanceService.getAllUserAttendance(options)
      setData(result)
    } catch (err) {
      console.error('Failed to fetch user history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, options.fromDate, options.toDate])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data: data || [], loading, error, refetch }
}

/**
 * Fetch room invites
 */
export function useRoomInvites(roomId) {
  const { data, loading, error, refetch, setData } = useFetch(
    () => invitesService.getRoomInvites(roomId),
    [roomId],
    !!roomId
  )

  const createInvite = async () => {
    const invite = await invitesService.createInvite(roomId)
    setData(prev => [...(prev || []), invite])
    return invite
  }

  const revokeInvite = async (inviteId) => {
    await invitesService.revokeInvite(inviteId)
    setData(prev => (prev || []).filter(i => i.id !== inviteId))
  }

  return { 
    invites: data || [], 
    loading, 
    error, 
    refetch,
    createInvite,
    revokeInvite
  }
}

// ============ ADMIN HOOKS ============

/**
 * Fetch rooms where current user is admin
 */
export function useAdminRooms(adminId) {
  return useFetch(
    () => invitesService.getAdminRooms(),
    [adminId],
    !!adminId
  )
}

/**
 * Fetch pending proofs for admin to review (for a specific room)
 */
export function usePendingProofs(roomId) {
  const { data, loading, error, refetch } = useFetch(
    () => attendanceService.getPendingProofs(roomId),
    [roomId],
    !!roomId
  )

  const approve = async (attendanceId, options = {}) => {
    await attendanceService.approveAttendance(attendanceId, options)
    refetch()
  }

  const reject = async (attendanceId, reason, options = {}) => {
    await attendanceService.rejectAttendance(attendanceId, reason, options)
    refetch()
  }

  return { 
    proofs: data || [], 
    loading, 
    error, 
    refetch,
    approve,
    reject
  }
}

/**
 * Fetch all pending proofs for admin (across all rooms)
 */
export function useAllPendingProofs(adminId) {
  const { data, loading, error, refetch } = useFetch(
    () => attendanceService.getAllPendingProofsForAdmin(),
    [adminId],
    !!adminId
  )

  const approve = async (attendanceId) => {
    await attendanceService.approveAttendance(attendanceId)
    refetch()
  }

  const reject = async (attendanceId, reason) => {
    await attendanceService.rejectAttendance(attendanceId, reason)
    refetch()
  }

  return { 
    proofs: data || [], 
    loading, 
    error, 
    refetch,
    approve,
    reject
  }
}

// ============ GALLERY HOOKS ============

/**
 * Fetch gallery rooms (rooms with approved proof photos)
 */
export function useGalleryRooms(userId) {
  return useFetch(
    () => galleryService.getGalleryRooms(),
    [userId],
    !!userId
  )
}

/**
 * Fetch photos for a specific room in gallery
 */
export function useGalleryRoomPhotos(roomId, userId) {
  return useFetch(
    () => galleryService.getRoomPhotos(roomId),
    [roomId],
    !!roomId && !!userId
  )
}

// ============ WARNING & CONSEQUENCE HOOKS ============

/**
 * Fetch all active warnings for admin
 */
export function useAdminWarnings(adminId) {
  return useFetch(
    () => warningsService.getAdminWarnings(),
    [adminId],
    !!adminId
  )
}

/**
 * Fetch warnings for a specific room
 */
export function useRoomWarnings(roomId) {
  const { data, loading, error, refetch, setData } = useFetch(
    () => warningsService.getRoomWarnings(roomId),
    [roomId],
    !!roomId
  )

  const dismiss = async (warningId) => {
    await warningsService.dismissWarning(warningId)
    setData(prev => (prev || []).map(w => w.id === warningId ? { ...w, active: false } : w))
  }

  return {
    warnings: data || [],
    loading,
    error,
    refetch,
    dismiss
  }
}

/**
 * Fetch consequences for a specific room
 */
export function useRoomConsequences(roomId) {
  const { data, loading, error, refetch, setData } = useFetch(
    () => warningsService.getConsequences(roomId),
    [roomId],
    !!roomId
  )

  const resolve = async (consequenceId) => {
    await warningsService.resolveConsequence(consequenceId)
    setData(prev => (prev || []).map(c => c.id === consequenceId ? { ...c, active: false, resolved_at: new Date().toISOString() } : c))
  }

  return {
    consequences: data || [],
    loading,
    error,
    refetch,
    resolve
  }
}

// ============ PHASE 3: SOCIAL & GAMIFICATION HOOKS ============

/**
 * Fetch all achievement definitions
 */
export function useAchievementDefinitions() {
  return useFetch(() => achievementsService.getAllDefinitions(), [])
}

/**
 * Fetch current user's earned achievements
 */
export function useMyAchievements() {
  const result = useFetch(() => achievementsService.getMyAchievements(), [])
  return { achievements: result.data || [], ...result }
}

/**
 * Fetch unnotified achievements (for toasts)
 */
export function useUnnotifiedAchievements() {
  const { data, refetch, ...rest } = useFetch(
    () => achievementsService.getUnnotified(),
    []
  )

  const markSeen = async (ids) => {
    await achievementsService.markNotified(ids)
    refetch()
  }

  return { achievements: data || [], markSeen, refetch, ...rest }
}

/**
 * Fetch global leaderboard
 */
export function useLeaderboard(options = {}) {
  const { sortBy = 'discipline_score', period = 'all', limit = 50 } = options
  return useFetch(
    () => leaderboardService.getGlobal({ sortBy, period, limit }),
    [sortBy, period, limit]
  )
}

/**
 * Fetch room leaderboard
 */
export function useRoomLeaderboard(roomId) {
  return useFetch(
    () => leaderboardService.getForRoom(roomId),
    [roomId],
    !!roomId
  )
}

/**
 * Fetch current user's rank
 */
export function useMyRank() {
  return useFetch(() => leaderboardService.getMyRank(), [])
}

/**
 * Fetch user's active challenges
 */
export function useChallenges() {
  const { data, refetch, setData, ...rest } = useFetch(
    () => challengesService.getActive(),
    []
  )

  const joinChallenge = async (id) => {
    await challengesService.join(id)
    refetch()
  }

  const leaveChallenge = async (id) => {
    await challengesService.leave(id)
    refetch()
  }

  const logDay = async (id) => {
    await challengesService.logDay(id)
    refetch()
  }

  return { challenges: data || [], refetch, joinChallenge, leaveChallenge, logDay, ...rest }
}

/**
 * Fetch room challenges
 */
export function useRoomChallenges(roomId) {
  return useFetch(
    () => challengesService.getForRoom(roomId),
    [roomId],
    !!roomId
  )
}

/**
 * Fetch notifications for current user
 */
export function useNotifications(options = {}) {
  const { data, refetch, setData, ...rest } = useFetch(
    () => notificationsService.getAll(options),
    [options.unreadOnly]
  )

  const markRead = async (id) => {
    await notificationsService.markRead(id)
    setData(prev => (prev || []).map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    await notificationsService.markAllRead()
    setData(prev => (prev || []).map(n => ({ ...n, read: true })))
  }

  return { notifications: data || [], markRead, markAllRead, refetch, ...rest }
}

/**
 * Fetch unread notification count
 */
export function useUnreadCount() {
  const [count, setCount] = useState(0)
  
  const refetch = useCallback(async () => {
    try {
      const c = await notificationsService.getUnreadCount()
      setCount(c)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    refetch()
    // Poll every 60s
    const interval = setInterval(refetch, 60000)
    return () => clearInterval(interval)
  }, [refetch])

  return { count, refetch }
}

/**
 * Fetch activity feed for user's rooms
 */
export function useActivityFeed(options = {}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  const fetchMore = useCallback(async () => {
    setLoading(true)
    try {
      const before = events.length > 0 ? events[events.length - 1].created_at : undefined
      const data = await feedService.getMyFeed({ limit: 30, before, ...options })
      if (data.length < 30) setHasMore(false)
      setEvents(prev => before ? [...prev, ...data] : data)
    } catch (err) {
      console.error('Feed fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [events.length])

  const refetch = useCallback(async () => {
    setEvents([])
    setHasMore(true)
    setLoading(true)
    try {
      const data = await feedService.getMyFeed({ limit: 30, ...options })
      if (data.length < 30) setHasMore(false)
      setEvents(data)
    } catch (err) {
      console.error('Feed fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { events, loading, hasMore, fetchMore, refetch }
}

/**
 * Fetch room-specific feed
 */
export function useRoomFeed(roomId) {
  return useFetch(
    () => feedService.getForRoom(roomId, { limit: 30 }),
    [roomId],
    !!roomId
  )
}

export default {
  useRooms,
  useRoom,
  useRoomRules,
  useAttendance,
  useRoomStats,
  useRoomInvites,
  useAdminRooms,
  usePendingProofs,
  useAllPendingProofs,
  useGalleryRooms,
  useGalleryRoomPhotos,
  useAdminWarnings,
  useRoomWarnings,
  useRoomConsequences,
  useAchievementDefinitions,
  useMyAchievements,
  useUnnotifiedAchievements,
  useLeaderboard,
  useRoomLeaderboard,
  useMyRank,
  useChallenges,
  useRoomChallenges,
  useNotifications,
  useUnreadCount,
  useActivityFeed,
  useRoomFeed
}
