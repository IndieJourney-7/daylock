/**
 * Dashboard Page (Home)
 * Shows today's overview and active room
 * Answers: "What should I be doing right now?"
 * 
 * Phase 1: Core Pressure System
 * - Countdown urgency timer on active room
 * - Streak identity badge
 * - Dynamic pressure messages
 * - Discipline score overview
 * - Miss confrontation trigger
 */

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Button, Icon } from '../components/ui'
import { 
  CountdownTimer, CountdownBadge, 
  StreakIdentity, StreakBadge,
  DynamicMessage,
  DisciplineScoreBadge,
  MissConfrontation 
} from '../components/pressure'
import { AchievementToastManager } from '../components/social/AchievementToast'
import { LeaderboardTable } from '../components/social'
import { ActivityFeed } from '../components/social/ActivityFeedItem'
import { useAuth } from '../contexts'
import { useRooms, useUnnotifiedAchievements, useLeaderboard, useActivityFeed } from '../hooks'
import { roomsService } from '../lib'
import { supabase } from '../lib/supabase'
import { 
  getRoomCountdown, getStreakPhase, calculateStreak, 
  calculateDisciplinePoints, detectMisses 
} from '../lib/pressure'

// Progress Ring Component
function ProgressRing({ progress = 75, size = 48, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-charcoal-400"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-accent transition-all duration-500"
        />
      </svg>
    </div>
  )
}

// Check if room's time window has already passed today
function hasWindowPassedToday(room) {
  if (!room?.time_start || !room?.time_end) return false
  const now = new Date()
  const [startH, startM] = room.time_start.slice(0, 5).split(':').map(Number)
  const [endH, endM] = room.time_end.slice(0, 5).split(':').map(Number)
  const startTime = new Date(now); startTime.setHours(startH, startM, 0, 0)
  const endTime = new Date(now); endTime.setHours(endH, endM, 0, 0)
  // Overnight window (e.g., 23:00–01:00) — skip for simplicity
  if (endTime <= startTime) return false
  return now > endTime
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-5 md:space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-charcoal-600 rounded" />
      <div className="h-32 bg-charcoal-600 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-charcoal-600 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function Dashboard() {
  const { user, profile } = useAuth()
  const { data: rooms, loading: roomsLoading, error } = useRooms(user?.id)
  const [showConfrontation, setShowConfrontation] = useState(true)

  // ─── Direct Supabase: today's attendance per room ───
  const [todayAttendance, setTodayAttendance] = useState({})
  const [todayLoading, setTodayLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) { setTodayLoading(false); return }
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('attendance')
      .select('room_id, status, date, submitted_at')
      .eq('user_id', user.id)
      .eq('date', today)
      .then(({ data, error: err }) => {
        if (!err && data) {
          const byRoom = {}
          for (const rec of data) byRoom[rec.room_id] = rec.status
          setTodayAttendance(byRoom)
        }
        setTodayLoading(false)
      })
  }, [user?.id])

  // ─── Direct Supabase: full attendance history ───
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) { setHistoryLoading(false); return }
    supabase
      .from('attendance')
      .select('id, room_id, date, status, note, submitted_at, proof_url')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data, error: err }) => {
        if (!err) setHistory(data || [])
        setHistoryLoading(false)
      })
  }, [user?.id])

  // Phase 3: Achievement toasts
  const { achievements: newAchievements, markSeen } = useUnnotifiedAchievements()
  // Phase 3: Mini leaderboard
  const { data: leaderboardData } = useLeaderboard({ limit: 5 })
  // Phase 3: Mini feed
  const { events: feedEvents } = useActivityFeed()
  
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
  
  // Get user's first name for greeting
  const userName = profile?.name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  
  // Calculate room open/locked status + merge today's attendance
  const roomsWithStatus = useMemo(() => (rooms || []).map(room => {
    const countdown = getRoomCountdown(room)
    const isOpen = roomsService.isRoomOpen(room)
    const todayStatus = todayAttendance[room.id] // 'approved', 'pending_review', 'rejected', or undefined
    const todayCompleted = todayStatus === 'approved' || todayStatus === 'pending_review'

    // Determine human-readable status:
    // - 'completed' if submitted today (approved/pending)
    // - 'open' if room window is open and not yet submitted
    // - 'missed' if window has passed with no submission
    // - 'upcoming' if window hasn't started yet / no schedule
    let displayStatus = 'upcoming'
    const windowPassed = hasWindowPassedToday(room)

    if (todayCompleted) {
      displayStatus = 'completed'
    } else if (todayStatus === 'rejected') {
      displayStatus = isOpen ? 'open' : (windowPassed ? 'missed' : 'upcoming')
    } else if (isOpen) {
      displayStatus = 'open'
    } else if (windowPassed) {
      displayStatus = 'missed' // window closed, no submission
    } else {
      displayStatus = 'upcoming' // hasn't opened yet
    }

    return {
      ...room,
      status: isOpen ? 'open' : 'locked',
      countdown,
      todayCompleted,
      todayStatus: todayStatus || null,
      displayStatus,
    }
  }), [rooms, todayAttendance])
  
  const activeRoom = roomsWithStatus.find(r => r.status === 'open' && !r.todayCompleted)
  const completedRooms = roomsWithStatus.filter(r => r.todayCompleted).length
  const totalRooms = roomsWithStatus.length
  const progress = totalRooms > 0 ? Math.round((completedRooms / totalRooms) * 100) : 0
  
  // Phase 1: Calculate streak from history
  const streakData = useMemo(() => calculateStreak(history || []), [history])
  const streak = streakData.current
  const phase = getStreakPhase(streak)

  // Phase 1: Discipline points
  const disciplineData = useMemo(
    () => calculateDisciplinePoints(history || [], streak),
    [history, streak]
  )

  // Phase 1: Miss detection — only flag rooms whose window already passed with no submission
  const missData = useMemo(() => {
    const summaries = roomsWithStatus.map(r => ({
      ...r,
      todayStatus: r.displayStatus === 'completed' ? 'approved' 
        : r.displayStatus === 'missed' ? 'missed'
        : 'waiting'
    }))
    return detectMisses(summaries)
  }, [roomsWithStatus])

  // Phase 1: Dynamic message context
  const messageContext = useMemo(() => ({
    isOpen: !!activeRoom,
    hasSubmitted: completedRooms > 0,
    streak,
    lastStreak: streakData.lastStreak,
    urgencyLevel: activeRoom?.countdown?.urgencyLevel || 'low',
    countdown: activeRoom?.countdown?.timeRemaining || '',
    allComplete: completedRooms === totalRooms && totalRooms > 0,
    hasMissedRecently: missData.hasMissedToday,
    phase,
  }), [activeRoom, completedRooms, totalRooms, streak, streakData.lastStreak, missData.hasMissedToday, phase])

  const loading = roomsLoading || historyLoading || todayLoading
  
  if (loading) {
    return <DashboardSkeleton />
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Icon name="x" className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">Error loading dashboard</h3>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-5 md:space-y-6">
      {/* Phase 1: Miss Confrontation Overlay */}
      {missData.hasMissedToday && showConfrontation && (
        <MissConfrontation 
          missedRooms={missData.missedRooms}
          streak={streak}
          lastStreak={streakData.lastStreak}
          onAcknowledge={() => setShowConfrontation(false)}
        />
      )}

      {/* Greeting & Date Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Hey, {userName}! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {dayName} • {completedRooms}/{totalRooms} rooms done
            {roomsWithStatus.filter(r => r.displayStatus === 'missed').length > 0 && (
              <span className="text-red-400 ml-1">
                • {roomsWithStatus.filter(r => r.displayStatus === 'missed').length} missed
              </span>
            )}
          </p>
          {/* Phase 1: Streak Identity Badge */}
          <div className="flex items-center gap-2 mt-1.5">
            <StreakBadge streak={streak} />
            <DisciplineScoreBadge attendanceRecords={history || []} streak={streak} />
          </div>
        </div>
        
        {/* Progress Ring */}
        <ProgressRing progress={progress} size={48} strokeWidth={4} />
      </div>

      {/* Phase 1: Dynamic Pressure Message */}
      {totalRooms > 0 && (
        <DynamicMessage context={messageContext} />
      )}
      
      {/* Phase 1: Streak Identity Card (only if streak > 0) */}
      {streak > 0 && (
        <StreakIdentity streak={streak} showProgress={true} />
      )}

      {/* Active Room Card */}
      {activeRoom && (
        <Link to={`/rooms/${activeRoom.id}`}>
          <Card variant="active" className="relative overflow-hidden group cursor-pointer">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Room emoji/icon area */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-charcoal-500/30 border border-charcoal-400/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <span className="text-4xl md:text-5xl">{activeRoom.emoji || '🚪'}</span>
                </div>
                
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-accent">{activeRoom.name}</h2>
                  <p className="text-gray-400 text-sm md:text-base">{roomsService.getTimeWindow(activeRoom)}</p>
                  {/* Phase 1: Countdown Timer */}
                  <div className="mt-2">
                    <CountdownTimer room={activeRoom} size="sm" />
                  </div>
                </div>
              </div>
              
              <Button size="lg" className="w-full md:w-auto group-hover:shadow-glow">
                Enter Room
              </Button>
            </div>
          </Card>
        </Link>
      )}
      
      {/* No Active Room State */}
      {!activeRoom && totalRooms > 0 && (
        <Card className="text-center py-8">
          {completedRooms === totalRooms ? (
            <>
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-white font-semibold mb-1">All Rooms Complete!</h3>
              <p className="text-green-400 text-sm">{completedRooms}/{totalRooms} rooms done today. You showed up.</p>
            </>
          ) : (
            <>
              <Icon name="lock" className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">No Room Open</h3>
              {/* Phase 1: Show countdown to nearest room opening */}
              {(() => {
                const nextRoom = roomsWithStatus
                  .filter(r => r.displayStatus === 'upcoming' && r.countdown?.totalSeconds > 0)
                  .sort((a, b) => a.countdown.totalSeconds - b.countdown.totalSeconds)[0]
                if (nextRoom) {
                  return (
                    <div className="mt-2">
                      <p className="text-gray-500 text-sm mb-2">
                        {nextRoom.emoji} {nextRoom.name} opens next
                      </p>
                      <CountdownBadge room={nextRoom} />
                    </div>
                  )
                }
                return <p className="text-gray-500 text-sm">All rooms closed for today</p>
              })()}
            </>
          )}
        </Card>
      )}
      
      {/* All Rooms Section */}
      <div>
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-white font-semibold">All Rooms</h3>
          <Link 
            to="/rooms"
            className="text-gray-400 hover:text-accent transition-colors text-sm"
          >
            View all →
          </Link>
        </div>
        
        {roomsWithStatus.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🚪</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Let's Create Your First Room!</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
              Rooms help you stay accountable. Create one for gym, work, study, or any habit you want to track.
            </p>
            <Link to="/rooms">
              <Button size="lg" className="shadow-glow">
                <Icon name="plus" className="w-5 h-5 mr-2" />
                Create Room
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {roomsWithStatus.map((room) => {
              // Status badge config
              const badgeConfig = {
                completed:  { variant: 'open',   label: '✅ Done',    opacity: '' },
                open:       { variant: 'open',   label: '🟢 Open',   opacity: '' },
                missed:     { variant: 'locked', label: '❌ Missed',  opacity: 'opacity-70' },
                upcoming:   { variant: 'locked', label: '🔒 Locked', opacity: 'opacity-80' },
              }[room.displayStatus] || { variant: 'locked', label: room.displayStatus, opacity: 'opacity-80' }

              return (
                <Link key={room.id} to={`/rooms/${room.id}`}>
                  <Card 
                    className={`flex flex-col h-full transition-all duration-200 hover:border-charcoal-300/30 ${badgeConfig.opacity}`}
                    padding="p-3 md:p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        {room.displayStatus === 'upcoming' && (
                          <Icon name="lock" className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm md:text-base truncate">
                            {room.emoji} {room.name}
                          </p>
                          <p className="text-gray-500 text-xs truncate">
                            {roomsService.getTimeWindow(room)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={badgeConfig.variant} size="sm">
                        {badgeConfig.label}
                      </Badge>
                    </div>
                    {/* Phase 1: Countdown badge on each room card */}
                    {room.displayStatus !== 'completed' && room.displayStatus !== 'missed' && (
                      <div className="mt-2">
                        <CountdownBadge room={room} />
                      </div>
                    )}
                    {room.displayStatus === 'completed' && (
                      <p className="text-green-400/70 text-xs mt-2">
                        {room.todayStatus === 'approved' ? 'Approved ✓' : 'Pending review...'}
                      </p>
                    )}
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Attendance Summary */}
      <div className="pt-4 border-t border-charcoal-400/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="text-white font-semibold">Today's Summary</h3>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 text-sm">
              <span className="text-green-400">✅ {completedRooms} done</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">{roomsWithStatus.filter(r => r.displayStatus === 'open').length} open</span>
              <span className="text-gray-600">•</span>
              <span className={roomsWithStatus.filter(r => r.displayStatus === 'missed').length > 0 ? 'text-red-400' : 'text-gray-400'}>
                {roomsWithStatus.filter(r => r.displayStatus === 'missed').length} missed
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">{roomsWithStatus.filter(r => r.displayStatus === 'upcoming').length} upcoming</span>
            </div>
          </div>
          <Link 
            to="/rooms/attendance"
            className="text-gray-400 hover:text-accent transition-colors text-sm font-medium"
          >
            Review and reflect →
          </Link>
        </div>
      </div>

      {/* Phase 3: Social Widgets */}
      <div className="grid gap-5 md:grid-cols-2 pt-4 border-t border-charcoal-400/10">
        {/* Mini Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">🏆 Top 5</h3>
            <Link to="/leaderboard" className="text-gray-400 hover:text-accent text-xs transition-colors">
              View all →
            </Link>
          </div>
          <LeaderboardTable entries={leaderboardData || []} currentUserId={user?.id} compact />
        </div>

        {/* Mini Activity Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">📡 Recent Activity</h3>
            <Link to="/feed" className="text-gray-400 hover:text-accent text-xs transition-colors">
              View all →
            </Link>
          </div>
          <Card className="bg-charcoal-500/20 border-charcoal-400/20 p-3">
            <ActivityFeed events={feedEvents.slice(0, 5)} emptyMessage="No recent activity" />
          </Card>
        </div>
      </div>

      {/* Phase 3: Achievement Toast Manager */}
      {newAchievements.length > 0 && (
        <AchievementToastManager
          achievements={newAchievements}
          onAllDismissed={() => markSeen(newAchievements.map(a => a.id))}
        />
      )}
    </div>
  )
}

export default Dashboard
