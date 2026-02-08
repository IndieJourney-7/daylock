/**
 * Admin Dashboard
 * Shows ONLY rooms assigned to admin by users via invite code
 * Admin approves proof of work uploaded by users
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../../components/ui'
import { useAuth } from '../../contexts'
import { useAdminRooms, useAllPendingProofs } from '../../hooks'
import { roomsService, invitesService } from '../../lib'

// Get status styling
const getStatusConfig = (todayProof) => {
  if (!todayProof) {
    return { label: 'Waiting', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: 'history' }
  }
  
  switch (todayProof.status) {
    case 'approved':
      return { label: 'Approved', color: 'text-accent', bg: 'bg-accent/20', icon: 'check' }
    case 'pending_review':
      return { label: 'Needs Review', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: 'camera' }
    case 'rejected':
      return { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/20', icon: 'close' }
    default:
      return { label: 'Waiting', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: 'history' }
  }
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-charcoal-600 rounded" />
      <div className="h-24 bg-charcoal-600 rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-charcoal-600 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-24 bg-charcoal-600 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { data: rooms, loading: roomsLoading, refetch: refetchRooms } = useAdminRooms(user?.id)
  const { proofs, loading: proofsLoading } = useAllPendingProofs(user?.id)
  
  // Invite code state
  const [inviteCode, setInviteCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [inviteSuccess, setInviteSuccess] = useState(null)
  
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
      // First verify the code
      const invite = await invitesService.getInviteByCode(inviteCode.trim())
      
      if (!invite) {
        setInviteError('Invalid invite code. Please check and try again.')
        return
      }
      
      if (invite.status === 'accepted') {
        setInviteError('This invite has already been used.')
        return
      }
      
      if (invite.status === 'revoked') {
        setInviteError('This invite has been revoked.')
        return
      }
      
      // Accept the invite
      await invitesService.acceptInvite(invite.invite_code, user.id)
      
      setInviteSuccess(`You are now managing "${invite.room?.name || 'the room'}"!`)
      setInviteCode('')
      
      // Refetch rooms to show the new room
      if (refetchRooms) {
        await refetchRooms()
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setInviteSuccess(null), 3000)
      
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
  const uniqueUsers = [...new Set(assignedRooms.map(r => r.user_id))].length
  
  // Group proofs by room for counting
  const proofCountByRoom = {}
  pendingProofs.forEach(proof => {
    proofCountByRoom[proof.room_id] = (proofCountByRoom[proof.room_id] || 0) + 1
  })
  
  // Get today's date string
  const todayStr = new Date().toISOString().split('T')[0]
  
  // Count today's statuses
  const todayApproved = assignedRooms.filter(r => r.today_attendance?.status === 'approved').length
  const todayPending = assignedRooms.filter(r => r.today_attendance?.status === 'pending_review').length
  const todayMissed = assignedRooms.filter(r => r.today_attendance?.status === 'missed').length
  const todayWaiting = assignedRooms.length - (todayApproved + todayPending + todayMissed)
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">
          Welcome, {profile?.name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Admin'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>
      
      {/* Admin Profile Card */}
      <Card className="border-accent/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Icon name="shield" className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">{profile?.name || user?.user_metadata?.name || 'Admin'}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Admin Mode</p>
            <Link to="/dashboard" className="text-accent text-xs hover:underline">
              Switch to User
            </Link>
          </div>
        </div>
      </Card>
      
      {/* Accept Invite Code - Inline Form */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="plus" className="w-4 h-4 text-accent" />
          <h3 className="text-white font-medium">Accept Invite Code</h3>
        </div>
        
        {/* Success message */}
        {inviteSuccess && (
          <div className="mb-3 p-3 bg-accent/20 border border-accent/30 rounded-lg">
            <p className="text-accent text-sm text-center flex items-center justify-center gap-2">
              <Icon name="check" className="w-4 h-4" />
              {inviteSuccess}
            </p>
          </div>
        )}
        
        {/* Error message */}
        {inviteError && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
              <Icon name="close" className="w-4 h-4" />
              {inviteError}
            </p>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value.toUpperCase())
              setInviteError(null)
            }}
            placeholder="Enter code (e.g., GYM-X4K9)"
            className="flex-1 bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white font-mono tracking-wider placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleAcceptInvite()}
          />
          <Button 
            disabled={!inviteCode.trim() || isVerifying}
            onClick={handleAcceptInvite}
            className="px-6"
          >
            {isVerifying ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Join'
            )}
          </Button>
        </div>
        <p className="text-gray-600 text-xs mt-2">
          Paste the invite code shared by a user to manage their room
        </p>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <p className="text-accent text-2xl font-bold">{assignedRooms.length}</p>
          <p className="text-gray-500 text-xs mt-1">Rooms Assigned</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-white text-2xl font-bold">{uniqueUsers}</p>
          <p className="text-gray-500 text-xs mt-1">Users</p>
        </Card>
        <Card className={`text-center py-4 ${pendingProofs.length > 0 ? 'border-yellow-500/30' : ''}`}>
          <p className={`text-2xl font-bold ${pendingProofs.length > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
            {pendingProofs.length}
          </p>
          <p className="text-gray-500 text-xs mt-1">Pending Proofs</p>
        </Card>
      </div>
      
      {/* Pending Proofs Alert */}
      {pendingProofs.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="camera" className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">
                {pendingProofs.length} proof{pendingProofs.length > 1 ? 's' : ''} waiting for review
              </p>
              <p className="text-gray-500 text-sm">
                Users have uploaded proof. Tap a room to approve or reject.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Today's Overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="calendar" className="w-4 h-4 text-gray-400" />
            <h2 className="text-white font-semibold">Today's Status</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-accent text-lg font-bold">{todayApproved}</p>
            <p className="text-gray-500 text-[10px]">Approved</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-yellow-400 text-lg font-bold">{todayPending}</p>
            <p className="text-gray-500 text-[10px]">To Review</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-400 text-lg font-bold">{todayWaiting}</p>
            <p className="text-gray-500 text-[10px]">Waiting</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-lg font-bold">{todayMissed}</p>
            <p className="text-gray-500 text-[10px]">Missed</p>
          </div>
        </div>
      </Card>
      
      {/* Rooms Assigned to You */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Rooms Assigned to You</h2>
          <Link to="/admin/rooms" className="text-accent text-sm hover:underline">
            View All
          </Link>
        </div>
        
        <div className="space-y-3">
          {assignedRooms.map((room) => {
            const statusConfig = getStatusConfig(room.today_attendance)
            const pendingCount = proofCountByRoom[room.id] || 0
            const isOpen = roomsService.isRoomOpen(room)
            const attendanceRate = room.stats?.attendanceRate || 0
            const streak = room.stats?.streak || 0
            
            return (
              <Link key={room.id} to={`/admin/rooms/${room.id}`} className="block group">
                <Card 
                  className={`
                    transition-all duration-300 group-hover:border-accent/30
                    ${pendingCount > 0 ? 'border-yellow-500/20' : ''}
                  `}
                  padding="p-4"
                >
                  <div className="flex items-center justify-between">
                    {/* Left - Room info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                        ${isOpen ? 'bg-accent/20' : 'bg-charcoal-500/50'}
                      `}>
                        {room.emoji || '🚪'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium truncate">{room.name}</h3>
                          {pendingCount > 0 && (
                            <Badge variant="warning" size="sm">
                              {pendingCount} proof{pendingCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs">{room.time_start} - {room.time_end}</p>
                        <p className="text-gray-600 text-xs mt-0.5">
                          Assigned by <span className="text-gray-400">{room.user?.name || room.user?.email || 'User'}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Right - Status & stats */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* Today status */}
                      <div className={`
                        hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg
                        ${statusConfig.bg}
                      `}>
                        <Icon name={statusConfig.icon} className={`w-3 h-3 ${statusConfig.color}`} />
                        <span className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
                      </div>
                      
                      {/* Streak */}
                      <div className="text-center hidden sm:block">
                        <p className="text-white font-bold">{streak}</p>
                        <p className="text-gray-600 text-xs">streak</p>
                      </div>
                      
                      {/* Attendance rate */}
                      <div className="text-center">
                        <p className={`font-bold ${attendanceRate >= 80 ? 'text-accent' : attendanceRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {attendanceRate}%
                        </p>
                        <p className="text-gray-600 text-xs">rate</p>
                      </div>
                      
                      <Icon 
                        name="chevronRight" 
                        className="w-5 h-5 text-gray-500 group-hover:text-gray-300" 
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
      
      {/* Empty state */}
      {assignedRooms.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-charcoal-500/50 flex items-center justify-center mx-auto mb-4">
            <Icon name="rooms" className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-white font-medium mb-2">No rooms assigned yet</h3>
          <p className="text-gray-500 text-sm">
            Paste an invite code above to start managing a user's room
          </p>
        </Card>
      )}
      
      {/* How it works for admin */}
      <Card className="bg-charcoal-500/20">
        <h3 className="text-white font-medium mb-3">Your Role as Admin</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="list" className="w-3 h-3 text-accent" />
            </div>
            <p className="text-gray-400">Set room rules and attendance time windows</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="camera" className="w-3 h-3 text-accent" />
            </div>
            <p className="text-gray-400">Review and approve proof of work from users</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="calendar" className="w-3 h-3 text-accent" />
            </div>
            <p className="text-gray-400">Track user attendance and streaks</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default AdminDashboard
