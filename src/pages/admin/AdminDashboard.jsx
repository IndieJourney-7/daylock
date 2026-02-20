/**
 * Admin Dashboard
 * Clean, professional overview of all rooms assigned to admin
 * Quick stats, today's status, room cards with actions
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../../components/ui'
import { useAuth } from '../../contexts'
import { useAdminRooms, useAllPendingProofs, useAdminWarnings } from '../../hooks'
import { roomsService, invitesService } from '../../lib'
import { WarningAlert } from '../../components/admin'

// Status config helper
const getStatusConfig = (todayProof, room) => {
  if (room?.is_paused) {
    return { label: 'Paused', sublabel: 'Room paused by you', color: 'text-orange-400', bg: 'bg-orange-500/10 border border-orange-500/20', icon: 'pause', dot: 'bg-orange-400' }
  }
  if (!todayProof) {
    // No proof submitted yet - check if room is open or closed
    const isOpen = roomsService.isRoomOpen(room)
    if (isOpen) {
      return { label: 'Open', sublabel: 'Waiting for user to submit', color: 'text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20', icon: 'clock', dot: 'bg-blue-400' }
    } else {
      return { label: 'No Proof', sublabel: 'User missed today', color: 'text-gray-400', bg: 'bg-charcoal-500/30 border border-charcoal-400/10', icon: 'clock', dot: 'bg-gray-400' }
    }
  }
  switch (todayProof.status) {
    case 'approved':
      return { label: 'Done', sublabel: 'Proof approved', color: 'text-accent', bg: 'bg-accent/10 border border-accent/20', icon: 'check', dot: 'bg-accent' }
    case 'pending_review':
      return { label: 'Review', sublabel: 'Needs your approval', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border border-yellow-500/20', icon: 'camera', dot: 'bg-yellow-400' }
    case 'rejected':
      return { label: 'Rejected', sublabel: 'Waiting for resubmission', color: 'text-red-400', bg: 'bg-red-500/10 border border-red-500/20', icon: 'close', dot: 'bg-red-400' }
    case 'waiting':
      return { label: 'Open', sublabel: 'Waiting for user to submit', color: 'text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20', icon: 'clock', dot: 'bg-blue-400' }
    default:
      return { label: 'Pending', sublabel: 'Waiting for submission', color: 'text-gray-400', bg: 'bg-charcoal-500/30 border border-charcoal-400/10', icon: 'clock', dot: 'bg-gray-400' }
  }
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-charcoal-600 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-charcoal-600 rounded-xl" />)}
      </div>
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-charcoal-600 rounded-xl" />)}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { data: rooms, loading: roomsLoading, refetch: refetchRooms } = useAdminRooms(user?.id)
  const { proofs, loading: proofsLoading } = useAllPendingProofs(user?.id)
  const { data: adminWarnings } = useAdminWarnings(user?.id)
  
  // Invite code state
  const [inviteCode, setInviteCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [inviteSuccess, setInviteSuccess] = useState(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })
  
  // Handle invite code submission
  const handleAcceptInvite = async () => {
    if (!inviteCode.trim() || !user) return
    
    setIsVerifying(true)
    setInviteError(null)
    setInviteSuccess(null)
    
    try {
      const result = await invitesService.acceptInvite(inviteCode.trim(), user.id)
      setInviteSuccess(`Now managing "${result.room?.name || 'the room'}"!`)
      setInviteCode('')
      if (refetchRooms) await refetchRooms()
      setTimeout(() => { setInviteSuccess(null); setShowInviteForm(false) }, 3000)
    } catch (err) {
      console.error('Accept invite error:', err)
      setInviteError(err.message || 'Failed to accept invite')
    } finally {
      setIsVerifying(false)
    }
  }
  
  if (roomsLoading || proofsLoading) {
    return <DashboardSkeleton />
  }
  
  const assignedRooms = rooms || []
  const pendingProofs = proofs || []
  const activeWarnings = (adminWarnings || []).filter(w => w.active)
  const uniqueUsers = [...new Set(assignedRooms.map(r => r.user_id))].length
  
  // Today's stats
  const todayApproved = assignedRooms.filter(r => r.today_attendance?.status === 'approved').length
  const todayPending = assignedRooms.filter(r => r.today_attendance?.status === 'pending_review').length
  const todayMissed = assignedRooms.filter(r => r.today_attendance?.status === 'missed').length
  const todayWaiting = assignedRooms.length - (todayApproved + todayPending + todayMissed)
  
  // Rooms sorted: pending review first, then waiting, then rest
  const sortedRooms = [...assignedRooms].sort((a, b) => {
    const priority = { pending_review: 0, waiting: 1, rejected: 2, missed: 3, approved: 4 }
    const aPriority = priority[a.today_attendance?.status] ?? 1
    const bPriority = priority[b.today_attendance?.status] ?? 1
    return aPriority - bPriority
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {profile?.name?.split(' ')[0] || 'Admin'}'s Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">{today}</p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
        >
          <Icon name="plus" className="w-4 h-4" />
          <span className="hidden sm:inline">Add Room</span>
        </button>
      </div>
      
      {/* Invite Code Form - Collapsible */}
      {showInviteForm && (
        <Card className="border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="shield" className="w-4 h-4 text-accent" />
            <h3 className="text-white font-medium text-sm">Accept Invite Code</h3>
          </div>
          
          {inviteSuccess && (
            <div className="mb-3 p-2.5 bg-accent/10 border border-accent/20 rounded-lg">
              <p className="text-accent text-sm text-center flex items-center justify-center gap-2">
                <Icon name="check" className="w-4 h-4" /> {inviteSuccess}
              </p>
            </div>
          )}
          
          {inviteError && (
            <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{inviteError}</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setInviteError(null) }}
              placeholder="e.g. GYM-X4K9"
              className="flex-1 bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-2.5 text-white font-mono tracking-wider placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAcceptInvite()}
            />
            <Button disabled={!inviteCode.trim() || isVerifying} onClick={handleAcceptInvite} size="sm">
              {isVerifying ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Join'}
            </Button>
          </div>
        </Card>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Icon name="rooms" className="w-4 h-4 text-accent" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{assignedRooms.length}</p>
          <p className="text-gray-500 text-xs mt-0.5">Rooms</p>
        </div>
        
        <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Icon name="user" className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{uniqueUsers}</p>
          <p className="text-gray-500 text-xs mt-0.5">Users</p>
        </div>
        
        <div className={`p-4 rounded-xl border ${pendingProofs.length > 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-charcoal-500/20 border-charcoal-400/10'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pendingProofs.length > 0 ? 'bg-yellow-500/10' : 'bg-charcoal-500/30'}`}>
              <Icon name="camera" className={`w-4 h-4 ${pendingProofs.length > 0 ? 'text-yellow-400' : 'text-gray-500'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${pendingProofs.length > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{pendingProofs.length}</p>
          <p className="text-gray-500 text-xs mt-0.5">To Review</p>
        </div>
        
        <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Icon name="check" className="w-4 h-4 text-accent" />
            </div>
          </div>
          <p className="text-2xl font-bold text-accent">{todayApproved}</p>
          <p className="text-gray-500 text-xs mt-0.5">Done Today</p>
        </div>
      </div>
      
      {/* Pending Proofs Alert */}
      {pendingProofs.length > 0 && (
        <button 
          onClick={() => {
            const roomWithPending = assignedRooms.find(r => r.today_attendance?.status === 'pending_review')
            if (roomWithPending) navigate(`/admin/rooms/${roomWithPending.id}`)
            else navigate('/admin/rooms')
          }}
          className="w-full text-left"
        >
          <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 hover:bg-yellow-500/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Icon name="camera" className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">
                {pendingProofs.length} proof{pendingProofs.length > 1 ? 's' : ''} waiting for review
              </p>
              <p className="text-gray-500 text-xs mt-0.5">Tap to review submissions</p>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 text-yellow-500/50" />
          </div>
        </button>
      )}
      
      {/* Active Warnings Alert */}
      {activeWarnings.length > 0 && (
        <button 
          onClick={() => {
            const roomWithWarning = activeWarnings[0]?.room_id
            if (roomWithWarning) navigate(`/admin/rooms/${roomWithWarning}`)
            else navigate('/admin/rooms')
          }}
          className="w-full text-left"
        >
          <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="alertCircle" className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">
                {activeWarnings.length} active warning{activeWarnings.length > 1 ? 's' : ''}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">Users need attention</p>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 text-orange-500/50" />
          </div>
        </button>
      )}
      
      {/* Today's Status Bar */}
      {assignedRooms.length > 0 && (
        <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Today's Progress</p>
          </div>
          <div className="flex gap-1.5 h-2 rounded-full overflow-hidden bg-charcoal-600">
            {todayApproved > 0 && (
              <div className="bg-accent rounded-full transition-all" style={{ width: `${(todayApproved / assignedRooms.length) * 100}%` }} />
            )}
            {todayPending > 0 && (
              <div className="bg-yellow-400 rounded-full transition-all" style={{ width: `${(todayPending / assignedRooms.length) * 100}%` }} />
            )}
            {todayMissed > 0 && (
              <div className="bg-red-400 rounded-full transition-all" style={{ width: `${(todayMissed / assignedRooms.length) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-gray-400">Done {todayApproved}</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-gray-400">Review {todayPending}</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-gray-400">Waiting {todayWaiting}</span>
            </span>
            {todayMissed > 0 && (
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-gray-400">Missed {todayMissed}</span>
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Rooms List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Your Rooms</p>
          {assignedRooms.length > 3 && (
            <Link to="/admin/rooms" className="text-accent text-xs hover:underline">View All</Link>
          )}
        </div>
        
        <div className="space-y-2">
          {sortedRooms.map((room) => {
            const statusConfig = getStatusConfig(room.today_attendance, room)
            const isOpen = roomsService.isRoomOpen(room)
            const attendanceRate = room.stats?.attendanceRate || 0
            const roomWarningCount = activeWarnings.filter(w => w.room_id === room.id).length
            
            return (
              <Link key={room.id} to={`/admin/rooms/${room.id}`} className="block group">
                <div className={`
                  flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200
                  bg-charcoal-500/20 border border-charcoal-400/10
                  hover:bg-charcoal-500/30 hover:border-charcoal-400/20
                  ${room.today_attendance?.status === 'pending_review' ? 'border-yellow-500/20' : ''}
                `}>
                  {/* Room icon */}
                  <div className={`
                    w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-colors
                    ${room.is_paused ? 'bg-orange-500/10 border border-orange-500/20' :
                      isOpen ? 'bg-accent/10 border border-accent/20' : 'bg-charcoal-500/50 border border-charcoal-400/10'}
                  `}>
                    {room.is_paused ? <Icon name="pause" className="w-5 h-5 text-orange-400" /> : room.emoji || '📋'}
                  </div>
                  
                  {/* Room info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium text-sm truncate">{room.name}</h3>
                      {room.today_attendance?.status === 'pending_review' && (
                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
                      )}
                      {roomWarningCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[9px] flex items-center justify-center flex-shrink-0 font-bold">
                          {roomWarningCount}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {room.user?.name || 'User'} · {(room.time_start || '').slice(0, 5)} – {(room.time_end || '').slice(0, 5)}
                    </p>
                  </div>
                  
                  {/* Right side */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Status pill */}
                    <div className={`hidden sm:flex flex-col items-end gap-0.5 px-2.5 py-1 rounded-lg ${statusConfig.bg}`} title={statusConfig.sublabel}>
                      <div className="flex items-center gap-1.5">
                        <Icon name={statusConfig.icon} className={`w-3 h-3 ${statusConfig.color}`} />
                        <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                      </div>
                    </div>
                    
                    {/* Mobile status dot */}
                    <span className={`sm:hidden w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
                    
                    {/* Rate */}
                    <span className={`text-sm font-bold ${
                      attendanceRate >= 80 ? 'text-accent' : 
                      attendanceRate >= 60 ? 'text-yellow-400' : 
                      attendanceRate > 0 ? 'text-red-400' : 'text-gray-600'
                    }`}>
                      {attendanceRate}%
                    </span>
                    
                    <Icon name="chevronRight" className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      
      {/* Empty state */}
      {assignedRooms.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-charcoal-500/30 border border-charcoal-400/10 flex items-center justify-center mx-auto mb-5">
            <Icon name="shield" className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">No rooms yet</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            Ask a user to share their room invite code with you, or paste one above
          </p>
          <Button onClick={() => setShowInviteForm(true)}>
            <span className="flex items-center gap-2">
              <Icon name="plus" className="w-4 h-4" />
              Enter Invite Code
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
