/**
 * Room Detail Page
 * Shows room-specific rules, attendance calendar, and proof upload
 * Each room has isolated data - never mixed with other rooms
 * 
 * Phase 1: Pressure System Integration
 * - Countdown timer in header
 * - Streak identity & discipline score
 * - Dynamic pressure messages
 * - Reflection lock on missed days
 */

import { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Badge, Button, Icon } from '../components/ui'
import { 
  CountdownTimer, 
  StreakBadge, 
  DynamicMessage, 
  DisciplineScoreBadge,
  ReflectionLock 
} from '../components/pressure'
import { EditRoomModal, DeleteRoomModal } from '../components/modals'
import { RoomReminderSettings } from '../components/social'
import { DAYS, MONTHS } from '../constants'
import { useRoom, useAttendance } from '../hooks'
import { useAuth } from '../contexts'
import { roomsService, attendanceService } from '../lib'
import { 
  getRoomCountdown, getStreakPhase, calculateStreak, 
  calculateDisciplinePoints, needsReflection, getDynamicMessage 
} from '../lib/pressure'

// Get calendar data for a month
function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  
  // Empty cells for days before first of month
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  return days
}

// Loading skeleton
function RoomDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-charcoal-600" />
        <div className="flex-1">
          <div className="h-6 w-32 bg-charcoal-600 rounded mb-2" />
          <div className="h-4 w-24 bg-charcoal-600 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-charcoal-600 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-charcoal-600 rounded-xl" />
    </div>
  )
}

function RoomDetail() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: room, loading, error } = useRoom(roomId, user?.id)
  const { attendance: attendanceData, submitProof } = useAttendance(roomId, user?.id)
  const fileInputRef = useRef(null)
  
  // Calendar state
  const today = new Date()
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  
  // Proof upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  
  // Edit/Delete modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentRoom, setCurrentRoom] = useState(null)
  
  // ============================================================
  // ALL hooks MUST be called before any early returns (React rules of hooks)
  // ============================================================

  // Phase 1: Advanced streak data
  const streakData = useMemo(() => calculateStreak(attendanceData || []), [attendanceData])
  const phase = getStreakPhase(streakData.current)

  // Phase 1: Discipline points for this room
  const disciplineData = useMemo(
    () => calculateDisciplinePoints(attendanceData || [], streakData.current),
    [attendanceData, streakData.current]
  )

  // Phase 1: Check if reflection is required
  const unreflectedMisses = useMemo(() => needsReflection(attendanceData || []), [attendanceData])
  const [reflectionDismissed, setReflectionDismissed] = useState(false)

  // Get today's proof status (needed by messageContext below)
  const todayStr = today.toISOString().split('T')[0]
  const todayRecord = (attendanceData || []).find(a => a.date === todayStr)
  const todayProofStatus = todayRecord?.status || null

  // Compute isOpen safely (room may be null while loading)
  const isOpen = room ? roomsService.isRoomOpen(room) : false

  // Phase 1: Dynamic message context for this room
  const messageContext = useMemo(() => ({
    isOpen,
    hasSubmitted: !!todayProofStatus && todayProofStatus !== 'rejected',
    streak: streakData.current,
    lastStreak: streakData.lastStreak,
    urgencyLevel: room ? (getRoomCountdown(room)?.urgencyLevel || 'low') : 'low',
    countdown: room ? (getRoomCountdown(room)?.timeRemaining || '') : '',
    allComplete: todayProofStatus === 'approved',
    hasMissedRecently: unreflectedMisses.length > 0,
    phase,
  }), [isOpen, todayProofStatus, streakData, room, unreflectedMisses.length, phase])

  // ============================================================
  // Early returns (after all hooks)
  // ============================================================
  
  if (loading) {
    return <RoomDetailSkeleton />
  }
  
  if (error || !room) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Icon name="x" className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-500">{error || 'Room not found'}</p>
          <Button variant="secondary" onClick={() => navigate('/rooms')} className="mt-4">
            Back to Rooms
          </Button>
        </div>
      </div>
    )
  }
  
  // ============================================================
  // Derived data (safe to compute after early returns — not hooks)
  // ============================================================

  const showReflectionLock = unreflectedMisses.length > 0 && !reflectionDismissed

  // Phase 1: Handle reflection submission
  const handleReflectionSubmit = async (reflectionText) => {
    const missRecord = unreflectedMisses[0]
    if (missRecord) {
      try {
        // Update the attendance record with the reflection note
        await attendanceService.submitProof(room.id, user?.id, null, reflectionText)
      } catch (err) {
        console.log('Reflection saved locally (API may not support update yet)')
      }
      setReflectionDismissed(true)
    }
  }

  // Derive data from room
  const timeWindow = roomsService.getTimeWindow(room)
  const rules = room.room_rules || []
  const admin = room.admin || null
  const inviteCode = room.pending_invite?.invite_code || room.room_invites?.find(i => i.status === 'accepted')?.invite_code || null
  
  // Build attendance map from attendanceData
  const attendanceMap = {}
  ;(attendanceData || []).forEach(record => {
    const date = new Date(record.date)
    if (date.getMonth() === calendarMonth && date.getFullYear() === calendarYear) {
      attendanceMap[date.getDate()] = record.status
    }
  })
  
  // Calculate stats
  const approvedDays = (attendanceData || []).filter(a => a.status === 'approved').length
  const totalDays = (attendanceData || []).length || 1
  const attendanceRate = Math.round((approvedDays / totalDays) * 100) || 0
  
  // Calculate streak
  let streak = 0
  const sortedAttendance = [...(attendanceData || [])].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )
  for (const record of sortedAttendance) {
    if (record.status === 'approved') streak++
    else break
  }

  const todayProofNote = todayRecord?.note || null
  const rejectionReason = todayRecord?.rejection_reason || null
  
  const calendarDays = getCalendarDays(calendarYear, calendarMonth)
  
  // Calendar navigation
  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(calendarYear - 1)
    } else {
      setCalendarMonth(calendarMonth - 1)
    }
  }
  
  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear(calendarYear + 1)
    } else {
      setCalendarMonth(calendarMonth + 1)
    }
  }
  
  // File handling
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setSubmitError(null) // Clear any previous error
    }
  }
  
  const handleUploadClick = () => {
    if (isOpen && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const handleSubmit = async () => {
    if (!selectedFile || !isOpen) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await submitProof(selectedFile, note)
      clearFile()
      setNote('')
    } catch (err) {
      console.error('Failed to submit proof:', err)
      setSubmitError(err.message || 'Failed to submit proof. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle room update from edit modal
  const handleRoomUpdated = (updatedRoom) => {
    setCurrentRoom(updatedRoom)
  }
  
  // Handle room deletion
  const handleRoomDeleted = () => {
    navigate('/rooms')
  }
  
  // Get the display room (updated locally or from server)
  const displayRoom = currentRoom || room
  
  // Get attendance status styling for calendar day
  const getAttendanceStyle = (day) => {
    if (!day) return ''
    const status = attendanceMap[day]
    const isToday = day === today.getDate() && 
                    calendarMonth === today.getMonth() && 
                    calendarYear === today.getFullYear()
    
    if (status === 'approved') return 'bg-accent/20 text-accent'
    if (status === 'missed') return 'bg-red-500/20 text-red-400'
    if (status === 'pending_review') return 'bg-yellow-500/20 text-yellow-400'
    if (status === 'rejected') return 'bg-orange-500/20 text-orange-400'
    if (status === 'waiting') return 'bg-blue-500/20 text-blue-400'
    if (isToday) return 'ring-1 ring-accent/50'
    return 'text-gray-400 hover:bg-charcoal-500/50'
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Phase 1: Reflection Lock Overlay */}
      {showReflectionLock && (
        <ReflectionLock
          missedRecord={unreflectedMisses[0]}
          roomName={room.name}
          roomEmoji={room.emoji}
          onSubmit={handleReflectionSubmit}
          onSkip={() => setReflectionDismissed(true)}
        />
      )}

      {/* Back button (mobile) */}
      <button 
        onClick={() => navigate(-1)}
        className="md:hidden flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
      >
        <Icon name="chevronLeft" className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>
      
      {/* Room Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`
            w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0
            ${isOpen ? 'bg-accent/20' : 'bg-charcoal-500/50'}
          `}>
            {displayRoom.emoji}
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${isOpen ? 'text-accent' : 'text-white'}`}>
              {displayRoom.name}
            </h1>
            <p className="text-gray-400 text-sm">{timeWindow}</p>
            {/* Phase 1: Countdown Timer */}
            <div className="mt-1.5">
              <CountdownTimer room={room} size="sm" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 rounded-lg bg-charcoal-500/50 hover:bg-charcoal-500 border border-charcoal-400/20 transition-colors"
            title="Edit room"
          >
            <Icon name="edit" className="w-4 h-4 text-gray-400" />
          </button>
          {/* Delete button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
            title="Delete room"
          >
            <Icon name="x" className="w-4 h-4 text-red-400" />
          </button>
          <Badge variant={isOpen ? 'open' : 'locked'} size="lg">
            {isOpen ? 'open' : 'locked'}
          </Badge>
        </div>
      </div>
      
      {/* Phase 1: Dynamic Pressure Message */}
      <DynamicMessage context={messageContext} />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm">{phase.emoji}</span>
            <span className={`text-2xl font-bold ${phase.color}`}>{streakData.current}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Day Streak</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-white">{attendanceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Attendance</div>
        </Card>
        <Card className="text-center py-4">
          <div className={`text-2xl font-bold ${disciplineData.levelColor}`}>⚡{disciplineData.total}</div>
          <div className="text-xs text-gray-500 mt-1">{disciplineData.title}</div>
        </Card>
      </div>
      
      {/* Room Reminders */}
      <RoomReminderSettings
        roomId={roomId}
        roomName={room?.name}
        roomEmoji={room?.emoji}
      />
      
      {/* Room Rules */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="rooms" className="w-4 h-4 text-gray-400" />
            <h2 className="text-white font-semibold">Room Rules</h2>
          </div>
          <span className="text-xs text-gray-600 bg-charcoal-500/50 px-2 py-1 rounded">Read-only</span>
        </div>
        {rules.length > 0 ? (
          <ul className="space-y-3">
            {rules.filter(r => r.enabled).map((rule, index) => (
              <li key={rule.id || index} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-300 text-sm">{rule.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No rules set yet</p>
        )}
        {admin && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-charcoal-400/10">
            <Icon name="lock" className="w-3 h-3 text-gray-600" />
            <p className="text-gray-600 text-xs">
              Rules set by <span className="text-gray-400">{admin.name || admin.email}</span> (admin)
            </p>
          </div>
        )}
      </Card>
      
      {/* Attendance Calendar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="calendar" className="w-4 h-4 text-gray-400" />
            <h2 className="text-white font-semibold">Attendance History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={prevMonth}
              className="p-1 hover:bg-charcoal-500/50 rounded transition-colors"
            >
              <Icon name="chevronLeft" className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-gray-400 text-sm min-w-[100px] text-center">
              {MONTHS[calendarMonth]} {calendarYear}
            </span>
            <button 
              onClick={nextMonth}
              className="p-1 hover:bg-charcoal-500/50 rounded transition-colors"
            >
              <Icon name="chevronRight" className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Calendar legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
            <span className="text-gray-500">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span className="text-gray-500">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-gray-500">Rejected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-gray-500">Missed</span>
          </div>
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {DAYS.map(day => (
            <div key={day} className="text-gray-500 py-2 font-medium">{day}</div>
          ))}
          {calendarDays.map((day, index) => (
            <div 
              key={index} 
              className={`
                py-2 rounded-md transition-colors
                ${day ? getAttendanceStyle(day) : ''}
              `}
            >
              {day || ''}
            </div>
          ))}
        </div>
        
        {/* Month summary */}
        <div className="mt-4 pt-4 border-t border-charcoal-400/10 flex justify-between text-xs">
          <span className="text-gray-500">This month</span>
          <span className="text-gray-400">
            <span className="text-accent">{Object.values(attendanceMap).filter(s => s === 'approved').length}</span> approved, 
            <span className="text-red-400 ml-1">{Object.values(attendanceMap).filter(s => s === 'missed').length}</span> missed
          </span>
        </div>
      </Card>
      
      {/* Admin Info */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-charcoal-500 flex items-center justify-center">
              <Icon name="shield" className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Room Admin</p>
              <p className="text-white font-medium">{admin?.name || admin?.email || 'Not assigned'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Invite Code</p>
            <p className="text-accent font-mono text-sm">{inviteCode || 'N/A'}</p>
          </div>
        </div>
        <p className="text-gray-600 text-xs mt-3">
          Admin reviews your proofs and sets room rules
        </p>
      </Card>
      
      {/* Today's Proof Status */}
      {todayProofStatus && (
        <Card className={`
          ${todayProofStatus === 'approved' ? 'border-accent/30 bg-accent/5' : ''}
          ${todayProofStatus === 'pending_review' ? 'border-yellow-500/30 bg-yellow-500/5' : ''}
          ${todayProofStatus === 'rejected' ? 'border-red-500/30 bg-red-500/5' : ''}
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              ${todayProofStatus === 'approved' ? 'bg-accent/20' : ''}
              ${todayProofStatus === 'pending_review' ? 'bg-yellow-500/20' : ''}
              ${todayProofStatus === 'rejected' ? 'bg-red-500/20' : ''}
            `}>
              <Icon 
                name={todayProofStatus === 'approved' ? 'check' : todayProofStatus === 'pending_review' ? 'history' : 'close'}
                className={`w-5 h-5 
                  ${todayProofStatus === 'approved' ? 'text-accent' : ''}
                  ${todayProofStatus === 'pending_review' ? 'text-yellow-400' : ''}
                  ${todayProofStatus === 'rejected' ? 'text-red-400' : ''}
                `}
              />
            </div>
            <div className="flex-1">
              <p className={`font-medium
                ${todayProofStatus === 'approved' ? 'text-accent' : ''}
                ${todayProofStatus === 'pending_review' ? 'text-yellow-400' : ''}
                ${todayProofStatus === 'rejected' ? 'text-red-400' : ''}
              `}>
                {todayProofStatus === 'approved' && "Today's Proof Approved!"}
                {todayProofStatus === 'pending_review' && 'Proof Pending Review'}
                {todayProofStatus === 'rejected' && 'Proof Rejected'}
              </p>
              <p className="text-gray-500 text-sm">
                {todayProofStatus === 'approved' && `Your proof was approved by ${admin?.name || 'admin'}`}
                {todayProofStatus === 'pending_review' && `Waiting for ${admin?.name || 'admin'} to review`}
                {todayProofStatus === 'rejected' && rejectionReason}
              </p>
            </div>
          </div>
          {todayProofNote && (
            <div className="mt-3 p-2 rounded-lg bg-charcoal-500/30">
              <p className="text-gray-400 text-xs">Your note: "{todayProofNote}"</p>
            </div>
          )}
        </Card>
      )}
      
      {/* Mark Attendance / Proof Upload */}
      {(!todayProofStatus || todayProofStatus === 'rejected') && (
      <Card variant={isOpen ? 'active' : 'locked'}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="camera" className="w-4 h-4 text-gray-400" />
            <h2 className="text-white font-semibold">
              {todayProofStatus === 'rejected' ? 'Resubmit Proof' : 'Submit Proof'}
            </h2>
          </div>
          {isOpen && (
            <Badge variant="open" size="sm">Active</Badge>
          )}
        </div>
        
        {todayProofStatus === 'rejected' && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">Your previous proof was rejected. Please upload a new one.</p>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Upload area or preview */}
        {previewUrl ? (
          <div className="relative mb-4">
            <img 
              src={previewUrl} 
              alt="Proof preview" 
              className="w-full h-48 object-cover rounded-xl"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1.5 bg-charcoal-900/80 rounded-full hover:bg-charcoal-900 transition-colors"
            >
              <Icon name="close" className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-2 left-2 bg-charcoal-900/80 px-2 py-1 rounded text-xs text-gray-300">
              {selectedFile?.name}
            </div>
          </div>
        ) : (
          <div 
            onClick={handleUploadClick}
            className={`
              border-2 border-dashed rounded-xl p-6 sm:p-8 text-center mb-4 transition-colors
              ${isOpen 
                ? 'border-charcoal-300/30 hover:border-accent/50 cursor-pointer hover:bg-charcoal-500/20' 
                : 'border-charcoal-400/10 cursor-not-allowed opacity-50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`p-3 rounded-full ${isOpen ? 'bg-accent/20' : 'bg-charcoal-500/50'}`}>
                <Icon name="camera" className={`w-6 h-6 ${isOpen ? 'text-accent' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-gray-300 text-sm font-medium">
                  {isOpen ? 'Tap to capture or upload proof' : 'Room is locked'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {isOpen ? 'Photo or screenshot required' : 'Available during open hours only'}
                </p>
              </div>
              {!isOpen && (
                <Icon name="lock" className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>
        )}
        
        {/* Note input */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={!isOpen}
            className={`
              w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg 
              px-4 py-3 text-white placeholder-gray-600 text-sm
              focus:outline-none focus:border-accent/50 transition-colors
              ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          <Icon 
            name="note" 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" 
          />
        </div>
        
        {/* Error message */}
        {submitError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <Icon name="x" className="w-4 h-4" />
              {submitError}
            </p>
          </div>
        )}
        
        {/* Submit button */}
        <Button 
          size="full" 
          disabled={!isOpen || !selectedFile || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Submitting...
            </span>
          ) : (
            'Submit Proof'
          )}
        </Button>
        
        {!isOpen && (
          <p className="text-gray-600 text-xs text-center mt-3 flex items-center justify-center gap-1.5">
            <Icon name="lock" className="w-3 h-3" />
            Room is locked. Proof upload available during open hours only.
          </p>
        )}
      </Card>
      )}
      
      {/* Edit Room Modal */}
      <EditRoomModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        room={displayRoom}
        onRoomUpdated={handleRoomUpdated}
      />
      
      {/* Delete Room Modal */}
      <DeleteRoomModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        room={displayRoom}
        onRoomDeleted={handleRoomDeleted}
      />
    </div>
  )
}

export default RoomDetail
