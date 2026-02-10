/**
 * Delete Room Modal
 * Warns user about permanent data loss before deleting a room
 * Shows what will be deleted: attendance history, proofs, rules, etc.
 */

import { useState } from 'react'
import { Button, Icon } from '../ui'
import { roomsService } from '../../lib'

function DeleteRoomModal({ isOpen, onClose, room, onRoomDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  
  if (!isOpen || !room) return null
  
  const roomName = room.name || 'this room'
  const canDelete = confirmText.toLowerCase() === 'delete'
  
  const handleDelete = async () => {
    if (!canDelete) return
    
    setIsDeleting(true)
    setError(null)
    
    try {
      await roomsService.deleteRoom(room.id)
      
      if (onRoomDeleted) {
        onRoomDeleted(room.id)
      }
      
      handleClose()
    } catch (err) {
      setError(err.message || 'Failed to delete room')
      setIsDeleting(false)
    }
  }
  
  const handleClose = () => {
    setConfirmText('')
    setError(null)
    setIsDeleting(false)
    onClose()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-charcoal-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header - Warning style */}
        <div className="flex items-center gap-3 p-4 border-b border-red-500/20 bg-red-500/5">
          <div className="p-2 rounded-full bg-red-500/20">
            <Icon name="x" className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-red-400">Delete Room</h2>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Room info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10">
            <div className="w-12 h-12 rounded-xl bg-charcoal-500/50 flex items-center justify-center text-2xl">
              {room.emoji || '🚪'}
            </div>
            <div>
              <h3 className="text-white font-medium">{roomName}</h3>
              {room.time_start && room.time_end && (
                <p className="text-gray-500 text-sm">{room.time_start} - {room.time_end}</p>
              )}
            </div>
          </div>
          
          {/* Warning message */}
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <Icon name="x" className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium mb-2">This action cannot be undone!</p>
                <p className="text-gray-400 text-sm mb-3">
                  Deleting this room will permanently remove:
                </p>
                <ul className="text-gray-400 text-sm space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    All attendance history and streaks
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    All uploaded proof photos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Room rules and settings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Admin assignment and invite codes
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Confirmation input */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Type <span className="text-red-400 font-mono font-bold">delete</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'delete' here"
              className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
              autoComplete="off"
            />
          </div>
          
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <Icon name="x" className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-charcoal-400/10">
          <Button 
            variant="secondary" 
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className={`
              flex-1 px-4 py-2.5 rounded-lg font-medium transition-all
              ${canDelete && !isDeleting
                ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
                : 'bg-charcoal-500/50 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </span>
            ) : (
              'Delete Room'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteRoomModal
