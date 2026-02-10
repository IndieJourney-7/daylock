/**
 * Edit Room Modal
 * User can edit room name, description, and emoji
 * Invite code and timing are NOT editable here (code is fixed, timing is admin-controlled)
 */

import { useState, useEffect } from 'react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { Card, Button, Icon } from '../ui'
import { roomsService } from '../../lib'

function EditRoomModal({ isOpen, onClose, room, onRoomUpdated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  
  // Initialize form with room data when modal opens
  useEffect(() => {
    if (isOpen && room) {
      setName(room.name || '')
      setDescription(room.description || '')
      setEmoji(room.emoji || '🎯')
      setError(null)
    }
  }, [isOpen, room])
  
  if (!isOpen) return null
  
  const canSave = name.trim().length > 0
  const hasChanges = 
    name.trim() !== (room?.name || '') ||
    description.trim() !== (room?.description || '') ||
    emoji !== (room?.emoji || '🎯')
  
  const handleSave = async () => {
    if (!canSave || !hasChanges) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      const updates = {
        name: name.trim(),
        description: description.trim(),
        emoji
      }
      
      await roomsService.updateRoom(room.id, updates)
      
      if (onRoomUpdated) {
        onRoomUpdated({ ...room, ...updates })
      }
      
      handleClose()
    } catch (err) {
      setError(err.message || 'Failed to update room')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleClose = () => {
    setName('')
    setDescription('')
    setEmoji('🎯')
    setError(null)
    setShowPicker(false)
    onClose()
  }
  
  const handleEmojiSelect = (emojiData) => {
    setEmoji(emojiData.native)
    setShowPicker(false)
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-charcoal-400/10">
          <h2 className="text-lg font-semibold text-white">Edit Room</h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-charcoal-500/50 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <Icon name="x" className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}
          
          {/* Emoji picker */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Room Icon</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="w-16 h-16 rounded-xl bg-charcoal-500/50 border border-charcoal-400/20 flex items-center justify-center text-3xl hover:border-accent/50 transition-colors"
              >
                {emoji}
              </button>
              
              {showPicker && (
                <div className="absolute top-full left-0 mt-2 z-50">
                  <div 
                    className="fixed inset-0" 
                    onClick={() => setShowPicker(false)}
                  />
                  <div className="relative">
                    <Picker 
                      data={data} 
                      onEmojiSelect={handleEmojiSelect}
                      theme="dark"
                      previewPosition="none"
                      skinTonePosition="none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Room name */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Room Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Gym"
              maxLength={50}
              className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this room for?"
              rows={3}
              maxLength={200}
              className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors resize-none"
            />
            <p className="text-gray-600 text-xs mt-1 text-right">
              {description.length}/200
            </p>
          </div>
          
          {/* Info note */}
          <div className="p-3 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10">
            <p className="text-gray-500 text-xs flex items-start gap-2">
              <Icon name="info" className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Room timing and rules are controlled by your admin. Contact them to make changes.</span>
            </p>
          </div>
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
          <Button 
            onClick={handleSave}
            disabled={!canSave || !hasChanges || isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EditRoomModal
