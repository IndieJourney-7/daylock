/**
 * Admin Rooms List
 * All rooms assigned to admin with search, filter, quick toggles
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../../components/ui'
import { useAuth } from '../../contexts'
import { useAdminRooms } from '../../hooks'
import { roomsService } from '../../lib'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Rooms', icon: 'grid' },
  { value: 'pending_proofs', label: 'Needs Review', icon: 'camera' },
  { value: 'high_performance', label: 'On Track', icon: 'fire' },
  { value: 'needs_attention', label: 'At Risk', icon: 'alertCircle' },
]

// Status config
const getStatusConfig = (todayProof, room) => {
  if (room?.is_paused) {
    return { label: 'Paused', sublabel: 'Room paused', color: 'text-orange-400', bg: 'bg-orange-500/10 border border-orange-500/20', icon: 'pause', dot: 'bg-orange-400' }
  }
  if (!todayProof) {
    const isOpen = roomsService.isRoomOpen(room)
    if (isOpen) {
      return { label: 'Open', sublabel: 'Waiting for submission', color: 'text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20', icon: 'clock', dot: 'bg-blue-400' }
    } else {
      return { label: 'No Proof', sublabel: 'Missed today', color: 'text-gray-400', bg: 'bg-charcoal-500/30 border border-charcoal-400/10', icon: 'clock', dot: 'bg-gray-400' }
    }
  }
  switch (todayProof.status) {
    case 'approved':
      return { label: 'Done', sublabel: 'Approved', color: 'text-accent', bg: 'bg-accent/10 border border-accent/20', icon: 'check', dot: 'bg-accent' }
    case 'pending_review':
      return { label: 'Review', sublabel: 'Needs approval', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border border-yellow-500/20', icon: 'camera', dot: 'bg-yellow-400' }
    case 'rejected':
      return { label: 'Rejected', sublabel: 'Awaiting resubmit', color: 'text-red-400', bg: 'bg-red-500/10 border border-red-500/20', icon: 'close', dot: 'bg-red-400' }
    default:
      return { label: 'Pending', sublabel: 'Waiting', color: 'text-gray-400', bg: 'bg-charcoal-500/30 border border-charcoal-400/10', icon: 'clock', dot: 'bg-gray-400' }
  }
}

// Loading skeleton
function RoomsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-charcoal-600 rounded" />
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-charcoal-600 rounded-lg" />
      </div>
      <div className="space-y-2">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-charcoal-600 rounded-xl" />)}
      </div>
    </div>
  )
}

function AdminRooms() {
  const { user } = useAuth()
  const { data: rooms, loading, refetch } = useAdminRooms(user?.id)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [togglingRoom, setTogglingRoom] = useState(null)
  
  if (loading) return <RoomsSkeleton />
  
  const allRooms = rooms || []
  
  // Filter rooms
  const filteredRooms = allRooms.filter(room => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!room.name.toLowerCase().includes(q) && 
          !room.user?.name?.toLowerCase().includes(q) &&
          !room.user?.email?.toLowerCase().includes(q)) return false
    }
    const attendanceRate = room.stats?.attendanceRate || 0
    const pendingCount = room.pending_proofs_count || 0
    switch (filter) {
      case 'pending_proofs': return room.today_attendance?.status === 'pending_review' || pendingCount > 0
      case 'high_performance': return attendanceRate >= 80
      case 'needs_attention': return attendanceRate < 70 || (room.stats?.streak || 0) === 0
      default: return true
    }
  })
  
  // Handle room pause toggle
  const handleTogglePause = async (e, roomId) => {
    e.preventDefault()
    e.stopPropagation()
    setTogglingRoom(roomId)
    try {
      await roomsService.toggleRoomPause(roomId)
      if (refetch) await refetch()
    } catch (err) {
      console.error('Toggle pause failed:', err)
    } finally {
      setTogglingRoom(null)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">All Rooms</h1>
          <p className="text-gray-500 text-sm mt-1">
            {allRooms.length} room{allRooms.length !== 1 ? 's' : ''} you manage
          </p>
        </div>
        <Link to="/admin/join">
          <Button variant="secondary" size="sm">
            <span className="flex items-center gap-2">
              <Icon name="plus" className="w-4 h-4" />
              Add Room
            </span>
          </Button>
        </Link>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rooms or users..."
          className="w-full bg-charcoal-500/20 border border-charcoal-400/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent/30 transition-colors"
        />
      </div>
      
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
              ${filter === option.value 
                ? 'bg-accent/10 text-accent border border-accent/20' 
                : 'bg-charcoal-500/20 text-gray-400 border border-charcoal-400/10 hover:text-gray-300'}
            `}
          >
            <Icon name={option.icon} className="w-3 h-3" />
            {option.label}
            {option.value === 'pending_proofs' && allRooms.filter(r => r.today_attendance?.status === 'pending_review').length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-yellow-500 text-charcoal-900 text-[10px] flex items-center justify-center font-bold">
                {allRooms.filter(r => r.today_attendance?.status === 'pending_review').length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Results count */}
      {(searchQuery || filter !== 'all') && (
        <p className="text-gray-500 text-xs">
          {filteredRooms.length} of {allRooms.length} rooms
        </p>
      )}
      
      {/* Rooms List */}
      <div className="space-y-2">
        {filteredRooms.map((room) => {
          const statusConfig = getStatusConfig(room.today_attendance, room)
          const isOpen = roomsService.isRoomOpen(room)
          const attendanceRate = room.stats?.attendanceRate || 0
          const streak = room.stats?.streak || 0
          const totalDays = room.stats?.totalDays || 0
          const approvedDays = room.stats?.approvedDays || 0
          const isToggling = togglingRoom === room.id
          
          return (
            <Link key={room.id} to={`/admin/rooms/${room.id}`} className="block group">
              <div className={`
                p-4 rounded-xl transition-all duration-200
                bg-charcoal-500/20 border border-charcoal-400/10
                hover:bg-charcoal-500/30 hover:border-charcoal-400/20
                ${room.today_attendance?.status === 'pending_review' ? 'border-yellow-500/20' : ''}
              `}>
                {/* Top row */}
                <div className="flex items-center gap-3">
                  {/* Room icon */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                    ${room.is_paused ? 'bg-orange-500/10 border border-orange-500/20' :
                      isOpen ? 'bg-accent/10 border border-accent/20' : 'bg-charcoal-500/50 border border-charcoal-400/10'}
                  `}>
                    {room.is_paused ? <Icon name="pause" className="w-5 h-5 text-orange-400" /> : room.emoji || '📋'}
                  </div>
                  
                  {/* Room info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium text-sm truncate">{room.name}</h3>
                      {room.is_paused && <Badge variant="paused" size="sm">Paused</Badge>}
                      {room.allow_late_upload && <Badge variant="info" size="sm">Late OK</Badge>}
                    </div>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {room.user?.name || 'User'} · {roomsService.getTimeWindow(room)}
                    </p>
                  </div>
                  
                  {/* Status + toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Pause toggle */}
                    <button
                      onClick={(e) => handleTogglePause(e, room.id)}
                      disabled={isToggling}
                      className={`
                        p-1.5 rounded-lg transition-colors
                        ${room.is_paused 
                          ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' 
                          : 'bg-charcoal-500/30 text-gray-500 hover:bg-charcoal-500/50 hover:text-gray-300'}
                      `}
                      title={room.is_paused ? 'Resume room' : 'Pause room'}
                    >
                      <Icon name={room.is_paused ? 'play' : 'pause'} className={`w-4 h-4 ${isToggling ? 'animate-pulse' : ''}`} />
                    </button>
                    
                    {/* Status pill */}
                    <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusConfig.bg}`}>
                      <Icon name={statusConfig.icon} className={`w-3 h-3 ${statusConfig.color}`} />
                      <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                    </div>
                    
                    <Icon name="chevronRight" className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                  </div>
                </div>
                
                {/* Bottom stats row */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-charcoal-400/5">
                  <div className="flex items-center gap-1.5">
                    <Icon name="fire" className="w-3 h-3 text-gray-500" />
                    <span className="text-white text-xs font-medium">{streak}</span>
                    <span className="text-gray-600 text-[10px]">streak</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon name="calendar" className="w-3 h-3 text-gray-500" />
                    <span className="text-white text-xs font-medium">{approvedDays}/{totalDays}</span>
                    <span className="text-gray-600 text-[10px]">days</span>
                  </div>
                  <div className="flex-1" />
                  <span className={`text-sm font-bold ${
                    attendanceRate >= 80 ? 'text-accent' : 
                    attendanceRate >= 60 ? 'text-yellow-400' : 
                    attendanceRate > 0 ? 'text-red-400' : 'text-gray-600'
                  }`}>
                    {attendanceRate}%
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      
      {/* Empty states */}
      {filteredRooms.length === 0 && allRooms.length > 0 && (
        <div className="text-center py-12">
          <Icon name="search" className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-white font-medium mb-2 text-sm">No rooms match</h3>
          <p className="text-gray-500 text-xs mb-4">Try adjusting your search or filter</p>
          <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setFilter('all') }}>
            Clear Filters
          </Button>
        </div>
      )}
      
      {allRooms.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-500/30 border border-charcoal-400/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="rooms" className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-white font-medium mb-2">No rooms yet</h3>
          <p className="text-gray-500 text-sm mb-4">Accept an invite code to start managing rooms</p>
          <Link to="/admin/join">
            <Button>
              <span className="flex items-center gap-2">
                <Icon name="plus" className="w-4 h-4" /> Enter Invite Code
              </span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default AdminRooms
