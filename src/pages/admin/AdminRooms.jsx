/**
 * Admin Rooms List
 * All rooms assigned to admin by users with filtering and stats
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../../components/ui'

// Rooms assigned to admin by users via invite code
const rooms = [
  {
    id: 'room_1',
    name: 'Gym',
    emoji: '🏋️',
    timeWindow: '6:00 AM - 7:00 AM',
    status: 'open',
    assignedBy: { name: 'John Doe', email: 'john@email.com' },
    inviteCode: 'GYM-X4K9',
    todayStatus: 'pending_proof', // pending_proof, approved, missed, waiting
    pendingProofs: 1,
    streak: 12,
    attendanceRate: 92,
    totalDays: 45,
    approvedDays: 41,
    rules: 3
  },
  {
    id: 'room_2',
    name: 'Morning Run',
    emoji: '🏃',
    timeWindow: '5:30 AM - 6:30 AM',
    status: 'locked',
    assignedBy: { name: 'Jane Smith', email: 'jane@email.com' },
    inviteCode: 'RUN-M2P8',
    todayStatus: 'approved',
    pendingProofs: 0,
    streak: 5,
    attendanceRate: 78,
    totalDays: 30,
    approvedDays: 23,
    rules: 2
  },
  {
    id: 'room_3',
    name: 'Workout',
    emoji: '💪',
    timeWindow: '7:00 PM - 8:00 PM',
    status: 'locked',
    assignedBy: { name: 'John Doe', email: 'john@email.com' },
    inviteCode: 'WRK-9Z2M',
    todayStatus: 'missed',
    pendingProofs: 0,
    streak: 0,
    attendanceRate: 65,
    totalDays: 20,
    approvedDays: 13,
    rules: 1
  },
  {
    id: 'room_4',
    name: 'Study Session',
    emoji: '📚',
    timeWindow: '8:00 PM - 10:00 PM',
    status: 'locked',
    assignedBy: { name: 'Alex Johnson', email: 'alex@email.com' },
    inviteCode: 'STD-K5P2',
    todayStatus: 'pending_proof',
    pendingProofs: 2,
    streak: 8,
    attendanceRate: 88,
    totalDays: 25,
    approvedDays: 22,
    rules: 2
  },
]

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Rooms' },
  { value: 'pending_proofs', label: 'Pending Proofs' },
  { value: 'approved', label: 'Approved Today' },
  { value: 'needs_attention', label: 'At Risk' },
]

// Get status styling
const getStatusConfig = (status) => {
  switch (status) {
    case 'approved':
      return { label: 'Approved', color: 'text-accent', bg: 'bg-accent/20', icon: 'check' }
    case 'pending_proof':
      return { label: 'To Review', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: 'camera' }
    case 'waiting':
      return { label: 'Waiting', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: 'history' }
    case 'missed':
      return { label: 'Missed', color: 'text-red-400', bg: 'bg-red-500/20', icon: 'close' }
    default:
      return { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: 'lock' }
  }
}

function AdminRooms() {
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = room.name.toLowerCase().includes(query)
      const matchesUser = room.assignedBy.name.toLowerCase().includes(query)
      if (!matchesName && !matchesUser) return false
    }
    
    // Status filter
    switch (filter) {
      case 'pending_proofs':
        return room.pendingProofs > 0
      case 'approved':
        return room.todayStatus === 'approved'
      case 'needs_attention':
        return room.attendanceRate < 70 || room.streak === 0
      default:
        return true
    }
  })
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">My Rooms</h1>
          <p className="text-gray-500 text-sm mt-1">
            {rooms.length} rooms you manage
          </p>
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
      
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Icon 
            name="search" 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" 
          />
          <input
            type="text"
            placeholder="Search rooms or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-charcoal-500/50 border border-charcoal-500
                     text-white placeholder-gray-500 text-sm
                     focus:outline-none focus:border-accent/50"
          />
        </div>
        
        {/* Filter buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {FILTER_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`
                px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all
                ${filter === option.value
                  ? 'bg-accent text-charcoal-900 font-medium'
                  : 'bg-charcoal-500/50 text-gray-400 hover:bg-charcoal-500'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="text-center py-3">
          <p className="text-white font-bold">{rooms.length}</p>
          <p className="text-gray-500 text-xs">Total</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-yellow-400 font-bold">
            {rooms.reduce((acc, r) => acc + r.pendingProofs, 0)}
          </p>
          <p className="text-gray-500 text-xs">To Review</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-accent font-bold">
            {rooms.filter(r => r.todayStatus === 'approved').length}
          </p>
          <p className="text-gray-500 text-xs">Approved</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-red-400 font-bold">
            {rooms.filter(r => r.attendanceRate < 70).length}
          </p>
          <p className="text-gray-500 text-xs">At Risk</p>
        </Card>
      </div>
      
      {/* Rooms List */}
      <div className="space-y-3">
        {filteredRooms.map((room) => {
          const statusConfig = getStatusConfig(room.todayStatus)
          const isAtRisk = room.attendanceRate < 70 || room.streak === 0
          
          return (
            <Link key={room.id} to={`/admin/rooms/${room.id}`} className="block group">
              <Card 
                className={`
                  transition-all duration-300 group-hover:border-accent/30
                  ${isAtRisk ? 'border-red-500/30' : ''}
                `}
                padding="p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left - Room info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                      ${room.status === 'open' ? 'bg-accent/20' : 'bg-charcoal-500/50'}
                    `}>
                      {room.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-medium">{room.name}</h3>
                        <Badge variant={room.status === 'open' ? 'open' : 'locked'} size="sm">
                          {room.status}
                        </Badge>
                        {isAtRisk && (
                          <Badge variant="danger" size="sm">
                            At Risk
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">{room.timeWindow}</p>
                      
                      {/* Assigned by info */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-charcoal-500 flex items-center justify-center">
                          <span className="text-[10px] text-gray-400">
                            {room.assignedBy.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {room.assignedBy.name}
                          {room.pendingProofs > 0 && (
                            <span className="text-yellow-400 ml-2">
                              ({room.pendingProofs} pending)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right - Stats */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Today status */}
                    <div className={`
                      flex items-center gap-1.5 px-2 py-1 rounded-lg
                      ${statusConfig.bg}
                    `}>
                      <Icon name={statusConfig.icon} className={`w-3 h-3 ${statusConfig.color}`} />
                      <span className={`text-xs ${statusConfig.color} hidden sm:inline`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">{room.streak}</p>
                        <p className="text-gray-600 text-xs">streak</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-bold text-sm ${
                          room.attendanceRate >= 80 ? 'text-accent' 
                          : room.attendanceRate >= 60 ? 'text-yellow-400' 
                          : 'text-red-400'
                        }`}>
                          {room.attendanceRate}%
                        </p>
                        <p className="text-gray-600 text-xs">rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 font-bold text-sm">{room.rules}</p>
                        <p className="text-gray-600 text-xs">rules</p>
                      </div>
                    </div>
                    
                    <Icon 
                      name="chevronRight" 
                      className="w-5 h-5 text-gray-500 group-hover:text-gray-300" 
                    />
                  </div>
                </div>
                
                {/* Mobile stats row */}
                <div className="flex sm:hidden items-center gap-4 mt-3 pt-3 border-t border-charcoal-500">
                  <div className="flex items-center gap-1">
                    <Icon name="calendar" className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-400 text-xs">{room.streak} day streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs ${
                      room.attendanceRate >= 80 ? 'text-accent' 
                      : room.attendanceRate >= 60 ? 'text-yellow-400' 
                      : 'text-red-400'
                    }`}>
                      {room.attendanceRate}% attendance
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
      
      {/* Empty state */}
      {filteredRooms.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-charcoal-500/50 flex items-center justify-center mx-auto mb-4">
            <Icon name="search" className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-white font-medium mb-2">No rooms found</h3>
          <p className="text-gray-500 text-sm">
            {searchQuery 
              ? `No rooms matching "${searchQuery}"`
              : 'Try changing your filter'}
          </p>
        </Card>
      )}
    </div>
  )
}

export default AdminRooms
