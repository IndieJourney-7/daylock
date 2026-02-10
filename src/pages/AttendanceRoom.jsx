/**
 * Attendance Room Page
 * End-of-day summary - review all rooms and reflect on daily performance
 * This aggregates real data from all user's rooms
 */

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Badge, Button, Icon } from '../components/ui'
import { useAuth } from '../contexts'
import { useRooms, useUserHistory } from '../hooks'
import { roomsService, attendanceService } from '../lib'

// Status styling helper
const getStatusConfig = (status) => {
  switch (status) {
    case 'approved':
      return { 
        color: 'text-accent', 
        bg: 'bg-accent/20', 
        icon: 'check',
        label: 'Approved'
      }
    case 'pending_review':
      return { 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/20', 
        icon: 'history',
        label: 'Pending Review'
      }
    case 'rejected':
      return { 
        color: 'text-red-400', 
        bg: 'bg-red-500/20', 
        icon: 'close',
        label: 'Rejected'
      }
    case 'missed':
      return { 
        color: 'text-red-400', 
        bg: 'bg-red-500/20', 
        icon: 'close',
        label: 'Missed'
      }
    default:
      return { 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/20', 
        icon: 'history',
        label: 'Waiting'
      }
  }
}

// Loading skeleton
function AttendanceSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-charcoal-600 rounded-xl" />
        <div className="flex-1">
          <div className="h-6 w-40 bg-charcoal-600 rounded mb-2" />
          <div className="h-4 w-24 bg-charcoal-600 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-charcoal-600 rounded-xl" />)}
      </div>
      <div className="h-64 bg-charcoal-600 rounded-xl" />
    </div>
  )
}

function AttendanceRoom() {
  const navigate = useNavigate()
  
  const { user } = useAuth()
  const { data: rooms, loading: roomsLoading } = useRooms(user?.id)
  const { data: history, loading: historyLoading } = useUserHistory(user?.id)

  // Fetch today's status for all rooms
  const [todayStatuses, setTodayStatuses] = useState({})
  const [statusLoading, setStatusLoading] = useState(true)

  // Fetch today's attendance status per room
  useEffect(() => {
    if (!rooms?.length || !user?.id) {
      setStatusLoading(false)
      return
    }
    setStatusLoading(true)

    const fetchStatuses = async () => {
      const statuses = {}
      await Promise.all(
        rooms.map(async (room) => {
          try {
            const record = await attendanceService.getTodayStatus(room.id, user.id)
            statuses[room.id] = record
          } catch {
            statuses[room.id] = null
          }
        })
      )
      setTodayStatuses(statuses)
      setStatusLoading(false)
    }
    fetchStatuses()
  }, [rooms, user?.id])

  // Compute derived data
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  })

  // Room summaries with today's status
  const roomSummaries = useMemo(() => {
    if (!rooms) return []
    return rooms.map(room => {
      const todayRecord = todayStatuses[room.id]
      const isOpen = roomsService.isRoomOpen(room)
      const status = todayRecord?.status || (isOpen ? 'waiting' : 'waiting')
      return {
        ...room,
        todayStatus: status,
        todayRecord,
        isOpen,
        timeWindow: roomsService.getTimeWindow(room)
      }
    })
  }, [rooms, todayStatuses])

  // Stats
  const submittedRooms = roomSummaries.filter(r => 
    ['approved', 'pending_review'].includes(r.todayStatus)
  ).length
  const totalRooms = roomSummaries.length
  const completionRate = totalRooms > 0 ? Math.round((submittedRooms / totalRooms) * 100) : 0

  // Calculate overall streak from history
  const overallStreak = useMemo(() => {
    if (!history?.length) return 0
    // Group by date, check if all rooms had at least one submission per day
    const dateMap = {}
    history.forEach(record => {
      if (record.status === 'approved') {
        dateMap[record.date] = (dateMap[record.date] || 0) + 1
      }
    })
    const dates = Object.keys(dateMap).sort((a, b) => new Date(b) - new Date(a))
    let streak = 0
    let checkDate = new Date()
    checkDate.setHours(0, 0, 0, 0)
    
    for (const dateStr of dates) {
      const d = new Date(dateStr)
      d.setHours(0, 0, 0, 0)
      const diff = Math.floor((checkDate - d) / (1000 * 60 * 60 * 24))
      if (diff <= 1) {
        streak++
        checkDate = d
      } else {
        break
      }
    }
    return streak
  }, [history])

  // Weekly progress from history
  const weeklyProgress = useMemo(() => {
    if (!history?.length) return { score: 0, days: Array(7).fill(null) }
    
    const now = new Date()
    const startOfWeek = new Date(now)
    const dayOfWeek = now.getDay()
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const days = Array(7).fill(null).map((_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const dayRecords = history.filter(r => r.date === dateStr)
      const hasApproved = dayRecords.some(r => r.status === 'approved')
      const hasPending = dayRecords.some(r => r.status === 'pending_review')
      const hasSubmission = dayRecords.length > 0
      const isToday = dateStr === now.toISOString().split('T')[0]
      return {
        date: d,
        dateStr,
        isToday,
        status: hasApproved ? 'approved' : hasPending ? 'pending' : hasSubmission ? 'submitted' : null
      }
    })

    const activeDays = days.filter(d => d.status === 'approved' || d.status === 'pending').length
    const pastDays = days.filter(d => {
      const dDate = new Date(d.date)
      dDate.setHours(0, 0, 0, 0)
      const nowDate = new Date()
      nowDate.setHours(0, 0, 0, 0)
      return dDate <= nowDate
    }).length
    const score = pastDays > 0 ? Math.round((activeDays / pastDays) * 100) : 0

    return { score, days }
  }, [history])

  const loading = roomsLoading || historyLoading

  if (loading) {
    return <AttendanceSkeleton />
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Back button (mobile) */}
      <button 
        onClick={() => navigate(-1)}
        className="md:hidden flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
      >
        <Icon name="chevronLeft" className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 bg-accent/20">
            ✅
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-accent">
              Daily Attendance
            </h1>
            <p className="text-gray-400 text-sm">Today's overview</p>
          </div>
        </div>
      </div>
      
      {/* Date */}
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Icon name="calendar" className="w-4 h-4" />
        <span>{todayStr}</span>
      </div>
      
      {/* Daily Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-accent">{submittedRooms}/{totalRooms}</div>
          <div className="text-xs text-gray-500 mt-1">Submitted</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-white">{completionRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Today</div>
        </Card>
        <Card className="text-center py-4">
          <div className="flex items-center justify-center gap-1">
            <Icon name="fire" className="w-5 h-5 text-orange-400" />
            <span className="text-2xl font-bold text-orange-400">{overallStreak}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Day Streak</div>
        </Card>
      </div>
      
      {/* Today's Room Summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="rooms" className="w-4 h-4 text-gray-400" />
            <h2 className="text-white font-semibold">Today's Rooms</h2>
          </div>
          <span className="text-xs text-gray-500">
            {submittedRooms} of {totalRooms} submitted
          </span>
        </div>
        
        {roomSummaries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No rooms yet. Create one to start tracking!</p>
            <Button 
              size="sm" 
              className="mt-3"
              onClick={() => navigate('/rooms')}
            >
              Go to Rooms
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {roomSummaries.map((room) => {
              const config = getStatusConfig(room.todayStatus)
              return (
                <div 
                  key={room.id}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  className={`
                    p-4 rounded-xl border transition-colors cursor-pointer hover:bg-charcoal-500/20
                    ${room.todayStatus === 'approved' 
                      ? 'bg-accent/5 border-accent/20' 
                      : room.todayStatus === 'rejected' || room.todayStatus === 'missed'
                        ? 'bg-red-500/5 border-red-500/20'
                        : room.todayStatus === 'pending_review'
                          ? 'bg-yellow-500/5 border-yellow-500/20'
                          : 'bg-charcoal-500/30 border-charcoal-400/10'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${config.bg}`}>
                        {room.emoji || '📋'}
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-sm">{room.name}</h3>
                        <p className="text-gray-500 text-xs">{room.timeWindow}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {room.isOpen && (
                        <Badge variant="open" size="sm">Open</Badge>
                      )}
                      <span className={`text-xs ${config.color}`}>{config.label}</span>
                      <div className={`p-1 rounded-full ${config.bg}`}>
                        <Icon name={config.icon} className={`w-3 h-3 ${config.color}`} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Info for submitted rooms */}
                  {(room.todayStatus === 'approved' || room.todayStatus === 'pending_review') && room.todayRecord && (
                    <div className="mt-3 pt-3 border-t border-charcoal-400/10">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {room.todayRecord.proof_url && (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Icon name="camera" className="w-3 h-3" />
                              Proof uploaded
                            </span>
                          )}
                        </div>
                        {room.todayRecord.submitted_at && (
                          <span className="text-gray-500">
                            Submitted at {new Date(room.todayRecord.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {room.todayRecord.note && (
                        <p className="text-gray-400 text-xs mt-2 italic">"{room.todayRecord.note}"</p>
                      )}
                    </div>
                  )}
                  
                  {/* Missed / rejected info */}
                  {(room.todayStatus === 'missed' || room.todayStatus === 'rejected') && (
                    <div className="mt-3 pt-3 border-t border-charcoal-400/10">
                      <p className="text-gray-500 text-xs">
                        {room.todayStatus === 'rejected' 
                          ? (room.todayRecord?.rejection_reason || 'Proof was rejected by admin')
                          : 'No proof submitted during open hours'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
      
      {/* Weekly Progress */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="history" className="w-4 h-4 text-gray-400" />
            <h2 className="text-white font-semibold">Weekly Progress</h2>
          </div>
          <span className="text-accent font-medium">{weeklyProgress.score}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-charcoal-500/50 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${weeklyProgress.score}%` }}
          />
        </div>
        
        {/* Week days */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLabel, index) => {
            const dayData = weeklyProgress.days[index]
            const isApproved = dayData?.status === 'approved'
            const isPending = dayData?.status === 'pending'
            const isToday = dayData?.isToday
            return (
              <div key={index} className="flex flex-col items-center gap-1">
                <span className="text-gray-500 text-xs">{dayLabel}</span>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs
                  ${isToday 
                    ? 'ring-2 ring-accent bg-accent/20 text-accent' 
                    : isApproved 
                      ? 'bg-accent/20 text-accent'
                      : isPending
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-charcoal-500/50 text-gray-500'
                  }
                `}>
                  {isApproved ? (
                    <Icon name="check" className="w-3 h-3" />
                  ) : isPending ? (
                    <Icon name="history" className="w-3 h-3" />
                  ) : (
                    <span>{dayData?.date ? dayData.date.getDate() : index + 1}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {overallStreak > 0 ? (
          <p className="text-gray-500 text-xs text-center mt-4">
            🔥 {overallStreak} day streak! Keep it going!
          </p>
        ) : (
          <p className="text-gray-500 text-xs text-center mt-4">
            Submit proofs to start building your streak!
          </p>
        )}
      </Card>
    </div>
  )
}

export default AttendanceRoom
