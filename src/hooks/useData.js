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
  galleryService
} from '../lib'

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
  useGalleryRoomPhotos
}
