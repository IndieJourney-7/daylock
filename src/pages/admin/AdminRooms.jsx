/**
 * Admin Rooms List
 * All rooms assigned to admin by users with filtering and stats
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../../components/ui'
import { useAuth } from '../../contexts'
import { useAdminRooms } from '../../hooks'
import { roomsService } from '../../lib'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Rooms' },
  { value: 'pending_proofs', label: 'Pending Proofs' },
  { value: 'high_performance', label: 'High Performance' },
  { value: 'needs_attention', label: 'At Risk' },
]

// Get status styling
const getStatusConfig = (todayProof) => {
  if (!todayProof) {
    return { label: 'Waiting', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: 'history' }
  }
  
  switch (todayProof.status) {
    case 'approved':
      return { label: 'Approved', color: 'text-accent', bg: 'bg-accent/20', icon: 'check' }
    case 'pending_review':
      return { label: 'To Review', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: 'camera' }
    case 'rejected':
      return { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/20', icon: 'close' }
    default:
      return { label: 'Waiting', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: 'history' }
  }
}

// Loading skeleton
function RoomsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-charcoal-600 rounded" />
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-charcoal-600 rounded-lg" />
        <div className="h-10 w-32 bg-charcoal-600 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-24 bg-charcoal-600 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function AdminRooms() {
  const { user } = useAuth()
  const { data: rooms, loading } = useAdminRooms(user?.id)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  if (loading) {
    return <RoomsSkeleton />
  }
  
  const allRooms = rooms || []
  
  // Filter rooms
  const filteredRooms = allRooms.filter(room => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = room.name.toLowerCase().includes(query)
      const matchesUser = room.user?.name?.toLowerCase().includes(query) || 
                         room.user?.email?.toLowerCase().includes(query)
      if (!matchesName && !matchesUser) return false
    }
    
    // Status filter
    const attendanceRate = room.stats?.attendanceRate || 0
    const pendingCount = room.pending_proofs_count || 0
    
    switch (filter) {
      case 'pending_proofs':
        return pendingCount > 0
      case 'high_performance':
        return attendanceRate >= 80
      case 'needs_attention':
        return attendanceRate < 70 || (room.stats?.streak || 0) === 0
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
            {allRooms.length} room{allRooms.length !== 1 ? 's' : ''} you manage
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
        <div className="flex-1 relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms or users..."
            className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
        
        {/* Filter dropdown */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
        >
          {FILTER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Results count */}
      {(searchQuery || filter !== 'all') && (
        <p className="text-gray-500 text-sm">
          Showing {filteredRooms.length} of {allRooms.length} rooms
        </p>
      )}
      
      {/* Rooms List */}
      <div className="space-y-3">
        {filteredRooms.map((room) => {
          const statusConfig = getStatusConfig(room.today_attendance)
          const isOpen = roomsService.isRoomOpen(room)
          const attendanceRate = room.stats?.attendanceRate || 0
          const streak = room.stats?.streak || 0
          const totalDays = room.stats?.totalDays || 0
          const approvedDays = room.stats?.approvedDays || 0
          const pendingCount = room.pending_proofs_count || 0
          const rulesCount = room.room_rules?.length || 0
          
          return (
            <Link key={room.id} to={`/admin/rooms/${room.id}`} className="block group">
              <Card 
                className={`
                  transition-all duration-300 group-hover:border-accent/30
                  ${pendingCount > 0 ? 'border-yellow-500/20' : ''}
                `}
                padding="p-4 md:p-5"
              >
                {/* Main row */}
                <div className="flex items-center justify-between mb-3">
                  {/* Left - Room info */}
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <div className={`
                      w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl flex-shrink-0
                      ${isOpen ? 'bg-accent/20 border border-accent/30' : 'bg-charcoal-500/50'}
                    `}>
                      {isOpen ? room.emoji || '🚪' : <Icon name="lock" className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">{room.name}</h3>
                        {pendingCount > 0 && (
                          <Badge variant="warning" size="sm">
                            {pendingCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs md:text-sm">{room.time_start} - {room.time_end}</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {room.user?.name || room.user?.email || 'User'} • {rulesCount} rule{rulesCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right - Status */}
                  <div className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0
                    ${statusConfig.bg}
                  `}>
                    <Icon name={statusConfig.icon} className={`w-3 h-3 ${statusConfig.color}`} />
                    <span className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                </div>
                
                {/* Stats row */}
                <div className="flex items-center justify-between pt-3 border-t border-charcoal-400/10">
                  <div className="flex items-center gap-4 md:gap-6">
                    {/* Streak */}
                    <div className="flex items-center gap-1.5">
                      <Icon name="fire" className="w-3 h-3 text-gray-500" />
                      <span className="text-white text-sm font-medium">{streak}</span>
                      <span className="text-gray-600 text-xs">streak</span>
                    </div>
                    
                    {/* Attendance */}
                    <div className="flex items-center gap-1.5">
                      <Icon name="calendar" className="w-3 h-3 text-gray-500" />
                      <span className="text-white text-sm font-medium">{approvedDays}/{totalDays}</span>
                      <span className="text-gray-600 text-xs">days</span>
                    </div>
                  </div>
                  
                  {/* Attendance rate */}
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      attendanceRate >= 80 ? 'text-accent' : 
                      attendanceRate >= 60 ? 'text-yellow-400' : 
                      'text-red-400'
                    }`}>
                      {attendanceRate}%
                    </span>
                    <Icon name="chevronRight" className="w-5 h-5 text-gray-500 group-hover:text-gray-300" />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
      
      {/* Empty states */}
      {filteredRooms.length === 0 && allRooms.length > 0 && (
        <Card className="text-center py-12">
          <Icon name="search" className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-white font-medium mb-2">No rooms found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or filter</p>
          <Button 
            variant="secondary" 
            onClick={() => { setSearchQuery(''); setFilter('all') }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </Card>
      )}
      
      {allRooms.length === 0 && (
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
    </div>
  )
}

export default AdminRooms
