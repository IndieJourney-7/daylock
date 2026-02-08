/**
 * Rooms List Page
 * User can create rooms and invite admins to manage them
 * Each room can have a different admin
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../components/ui'
import { CreateRoomModal, InviteAdminModal } from '../components/modals'
import { useAuth } from '../contexts'
import { useRooms, useRoomInvites } from '../hooks'
import { roomsService } from '../lib'

// Loading skeleton
function RoomsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-40 bg-charcoal-600 rounded mb-6" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-charcoal-600 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-charcoal-600 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function Rooms() {
  const { user } = useAuth()
  const { data: rooms, loading, error, refetch } = useRooms(user?.id)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  
  // Debug log
  console.log('Rooms page - user:', user?.id, 'rooms:', rooms, 'loading:', loading)
  
  // Calculate room statuses based on current time
  const roomsWithStatus = (rooms || []).map(room => ({
    ...room,
    status: roomsService.isRoomOpen(room) ? 'open' : 'locked',
    timeWindow: `${room.time_start} - ${room.time_end}`
  }))
  
  const openRooms = roomsWithStatus.filter(r => r.status === 'open').length
  const pendingRooms = roomsWithStatus.filter(r => !r.admin_id).length
  const totalRooms = roomsWithStatus.length
  
  const handleCreateRoom = async (roomData) => {
    try {
      await roomsService.createRoom(user.id, roomData)
      refetch()
    } catch (err) {
      console.error('Failed to create room:', err)
      throw err // Re-throw so modal can show error
    }
  }
  
  const handleInviteClick = (room, e) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedRoom(room)
    setShowInviteModal(true)
  }
  
  if (loading) {
    return <RoomsSkeleton />
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Icon name="x" className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">Error loading rooms</h3>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">My Rooms</h1>
          <p className="text-gray-500 text-sm mt-1">
            {totalRooms} rooms • {pendingRooms > 0 && <span className="text-yellow-400">{pendingRooms} pending admin</span>}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <span className="flex items-center gap-2">
            <Icon name="plus" className="w-4 h-4" />
            Create Room
          </span>
        </Button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center py-4">
          <p className="text-accent text-xl md:text-2xl font-bold">{totalRooms}</p>
          <p className="text-gray-500 text-xs">Total Rooms</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-accent text-xl md:text-2xl font-bold">{openRooms}</p>
          <p className="text-gray-500 text-xs">Open Now</p>
        </Card>
        <Card className="text-center py-4">
          <p className={`text-xl md:text-2xl font-bold ${pendingRooms > 0 ? 'text-yellow-400' : 'text-white'}`}>
            {pendingRooms}
          </p>
          <p className="text-gray-500 text-xs">Pending Admin</p>
        </Card>
      </div>
      
      {/* Rooms List */}
      <div className="space-y-3">
        {roomsWithStatus.map((room) => (
          <Link 
            key={room.id} 
            to={`/rooms/${room.id}`}
            className="block group"
          >
            <Card 
              variant={room.status === 'open' ? 'active' : 'default'}
              padding="p-4 md:p-5"
              className="transition-all duration-300 group-hover:border-accent/30"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left side - Room info */}
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  {/* Room icon */}
                  <div className={`
                    w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl flex-shrink-0
                    ${room.status === 'open' 
                      ? 'bg-accent/20 border border-accent/30' 
                      : 'bg-charcoal-500/50 border border-charcoal-400/20'
                    }
                  `}>
                    {room.status === 'locked' && room.admin_id ? (
                      <Icon name="lock" className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                    ) : (
                      room.emoji || '🚪'
                    )}
                  </div>
                  
                  {/* Room details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold text-base md:text-lg truncate ${
                        room.status === 'open' ? 'text-accent' : 'text-white'
                      }`}>
                        {room.name}
                      </h3>
                    </div>
                    <p className="text-gray-500 text-xs md:text-sm">{room.timeWindow}</p>
                    
                    {/* Admin status */}
                    <div className="flex items-center gap-2 mt-1">
                      {room.admin_id ? (
                        <>
                          <Icon name="profile" className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-500 text-xs">
                            {room.admin?.name || 'Admin assigned'}
                          </span>
                        </>
                      ) : (
                        <span className="text-yellow-400 text-xs flex items-center gap-1">
                          <Icon name="userPlus" className="w-3 h-3" />
                          No admin assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right side - Status and actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Invite Admin Button (if no admin) */}
                  {!room.admin_id && (
                    <button
                      onClick={(e) => handleInviteClick(room, e)}
                      className="p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                      title="Invite Admin"
                    >
                      <Icon name="userPlus" className="w-4 h-4 text-accent" />
                    </button>
                  )}
                  
                  {/* Status badge */}
                  {room.admin_id ? (
                    <Badge variant={room.status === 'open' ? 'open' : 'locked'}>
                      {room.status}
                    </Badge>
                  ) : (
                    <Badge variant="pending" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      Pending
                    </Badge>
                  )}
                  
                  <Icon 
                    name="chevronRight" 
                    className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" 
                  />
                </div>
              </div>
              
              {/* Pending invite code indicator */}
              {!room.admin_id && room.pending_invite && (
                <div className="mt-3 pt-3 border-t border-charcoal-400/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="share" className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-500 text-xs">Invite code:</span>
                    <span className="text-accent text-xs font-mono">{room.pending_invite.invite_code}</span>
                  </div>
                  <button
                    onClick={(e) => handleInviteClick(room, e)}
                    className="text-accent text-xs hover:underline"
                  >
                    Share
                  </button>
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
      
      {/* Empty state */}
      {roomsWithStatus.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-charcoal-500/50 flex items-center justify-center mx-auto mb-4">
            <Icon name="rooms" className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-white font-medium mb-2">No rooms yet</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first room and invite an admin</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <span className="flex items-center gap-2">
              <Icon name="plus" className="w-4 h-4" />
              Create Room
            </span>
          </Button>
        </Card>
      )}
      
      {/* Info note */}
      <div className="mt-6 md:mt-8 p-4 rounded-xl bg-charcoal-700/30 border border-charcoal-400/10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Icon name="userPlus" className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium">
              Invite accountability partners
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Create a room and generate an invite code. Share it with someone who will manage your schedule and rules for that room.
            </p>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={handleCreateRoom}
      />
      
      <InviteAdminModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false)
          setSelectedRoom(null)
        }}
        room={selectedRoom}
        onInviteCreated={refetch}
      />
    </div>
  )
}

export default Rooms
