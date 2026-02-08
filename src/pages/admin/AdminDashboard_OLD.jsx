/**
 * Admin Dashboard
 * Shows ONLY rooms assigned to admin by users via invite code
 * Admin approves proof of work uploaded by users
 */

import { Link } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../../components/ui'

// Admin profile
const adminProfile = {
  name: 'Coach Mike',
  email: 'mike@gym.com'
}

// Rooms assigned to admin by different users via invite code
const assignedRooms = [
  {
    id: 'room_1',
    name: 'Gym',
    emoji: '🏋️',
    timeWindow: '6:00 AM - 7:00 AM',
    status: 'open',
    assignedBy: { name: 'John Doe', email: 'john@email.com' },
    inviteCode: 'GYM-X4K9',
    pendingProofs: 1,
    todayStatus: 'pending_proof', // pending_proof, approved, missed, waiting
    streak: 12,
    attendanceRate: 92
  },
  {
    id: 'room_2',
    name: 'Morning Run',
    emoji: '🏃',
    timeWindow: '5:30 AM - 6:30 AM',
    status: 'locked',
    assignedBy: { name: 'Jane Smith', email: 'jane@email.com' },
    inviteCode: 'RUN-M2P8',
    pendingProofs: 0,
    todayStatus: 'approved',
    streak: 5,
    attendanceRate: 78
  },
  {
    id: 'room_3',
    name: 'Workout',
    emoji: '💪',
    timeWindow: '7:00 PM - 8:00 PM',
    status: 'locked',
    assignedBy: { name: 'John Doe', email: 'john@email.com' },
    inviteCode: 'WRK-9Z2M',
    pendingProofs: 2,
    todayStatus: 'missed',
    streak: 0,
    attendanceRate: 65
  },
]

// Get status styling
const getStatusConfig = (status) => {
  switch (status) {
    case 'approved':
      return { label: 'Approved', color: 'text-accent', bg: 'bg-accent/20', icon: 'check' }
    case 'pending_proof':
      return { label: 'Needs Review', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: 'camera' }
    case 'waiting':
      return { label: 'Waiting', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: 'history' }
    case 'missed':
      return { label: 'Missed', color: 'text-red-400', bg: 'bg-red-500/20', icon: 'close' }
    default:
      return { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: 'lock' }
  }
}

function AdminDashboard() {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })
  
  const totalPendingProofs = assignedRooms.reduce((acc, r) => acc + r.pendingProofs, 0)
  const uniqueUsers = [...new Set(assignedRooms.map(r => r.assignedBy.email))].length
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Welcome, {adminProfile.name.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{today}</p>
        </div>
        <Link to="/admin/join">
          <Button variant="secondary" size="sm">
            <span className="flex items-center gap-2">
              <Icon name="plus" className="w-4 h-4" />
              Accept Invite
            </span>
          </Button>
        </Link>
      </div>
      
      {/* Admin Profile Card */}
      <Card className="border-accent/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Icon name="shield" className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">{adminProfile.name}</p>
            <p className="text-gray-500 text-sm">{adminProfile.email}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Admin Mode</p>
            <Link to="/dashboard" className="text-accent text-xs hover:underline">
              Switch to User
            </Link>
          </div>
        </div>
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
        <Card className={`text-center py-4 ${totalPendingProofs > 0 ? 'border-yellow-500/30' : ''}`}>
          <p className={`text-2xl font-bold ${totalPendingProofs > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
            {totalPendingProofs}
          </p>
          <p className="text-gray-500 text-xs mt-1">Pending Proofs</p>
        </Card>
      </div>
      
      {/* Pending Proofs Alert */}
      {totalPendingProofs > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="camera" className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">
                {totalPendingProofs} proof{totalPendingProofs > 1 ? 's' : ''} waiting for review
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
            <p className="text-accent text-lg font-bold">
              {assignedRooms.filter(r => r.todayStatus === 'approved').length}
            </p>
            <p className="text-gray-500 text-[10px]">Approved</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-yellow-400 text-lg font-bold">
              {assignedRooms.filter(r => r.todayStatus === 'pending_proof').length}
            </p>
            <p className="text-gray-500 text-[10px]">To Review</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-400 text-lg font-bold">
              {assignedRooms.filter(r => r.todayStatus === 'waiting').length}
            </p>
            <p className="text-gray-500 text-[10px]">Waiting</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-lg font-bold">
              {assignedRooms.filter(r => r.todayStatus === 'missed').length}
            </p>
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
            const statusConfig = getStatusConfig(room.todayStatus)
            return (
              <Link key={room.id} to={`/admin/rooms/${room.id}`} className="block group">
                <Card 
                  className={`
                    transition-all duration-300 group-hover:border-accent/30
                    ${room.pendingProofs > 0 ? 'border-yellow-500/20' : ''}
                  `}
                  padding="p-4"
                >
                  <div className="flex items-center justify-between">
                    {/* Left - Room info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                        ${room.status === 'open' ? 'bg-accent/20' : 'bg-charcoal-500/50'}
                      `}>
                        {room.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium truncate">{room.name}</h3>
                          {room.pendingProofs > 0 && (
                            <Badge variant="warning" size="sm">
                              {room.pendingProofs} proof{room.pendingProofs > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs">{room.timeWindow}</p>
                        <p className="text-gray-600 text-xs mt-0.5">
                          Assigned by <span className="text-gray-400">{room.assignedBy.name}</span>
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
                        <p className="text-white font-bold">{room.streak}</p>
                        <p className="text-gray-600 text-xs">streak</p>
                      </div>
                      
                      {/* Attendance rate */}
                      <div className="text-center">
                        <p className={`font-bold ${room.attendanceRate >= 80 ? 'text-accent' : room.attendanceRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {room.attendanceRate}%
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
          <p className="text-gray-500 text-sm mb-4">
            Ask users to share their room invite code with you
          </p>
          <Link to="/admin/join">
            <Button>
              <span className="flex items-center gap-2">
                <Icon name="plus" className="w-4 h-4" />
                Enter Invite Code
              </span>
            </Button>
          </Link>
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
