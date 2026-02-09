/**
 * Create Room Modal
 * User creates a new room with name, description, and emoji
 * Timing is controlled by admin — not the user
 * Invite code is auto-generated from the room name (e.g. gym-878)
 * After creation, shows the code so user can share it with their admin
 */

import { useState } from 'react'
import { Card, Button, Icon } from '../ui'

// Available emojis for rooms
const ROOM_EMOJIS = ['🏋️', '💼', '📚', '🧘', '🏃', '💻', '🎨', '🎵', '🍳', '🛏️', '📝', '🎯']

function CreateRoomModal({ isOpen, onClose, onCreateRoom }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)
  const [createdRoom, setCreatedRoom] = useState(null)
  const [copied, setCopied] = useState(false)
  
  if (!isOpen) return null
  
  const canCreate = name.trim().length > 0
  
  // Preview what the invite code will look like
  const codePreview = name.trim()
    ? `${name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-XXX`
    : ''
  
  const inviteCode = createdRoom?.invite_code || createdRoom?.room_code || null
  
  const handleCreate = async () => {
    if (!canCreate) return
    
    setIsCreating(true)
    setError(null)
    
    try {
      const roomData = {
        name: name.trim(),
        description: description.trim(),
        emoji
      }
      
      const result = await onCreateRoom(roomData)
      setCreatedRoom(result || null)
      
      // If no invite code returned, just close
      if (!result?.invite_code && !result?.room_code) {
        handleClose()
      }
    } catch (err) {
      setError(err.message || 'Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }
  
  const handleCopy = async () => {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  const handleShare = async () => {
    if (!inviteCode) return
    const shareData = {
      title: 'Daylock Room Invite',
      text: `Join my "${name}" room on Daylock as an admin. Use code: ${inviteCode}`,
      url: window.location.origin + '/admin/join?code=' + inviteCode
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        handleCopy()
      }
    } catch (err) {
      if (err.name !== 'AbortError') handleCopy()
    }
  }
  
  const handleClose = () => {
    setName('')
    setDescription('')
    setEmoji('🎯')
    setError(null)
    setCreatedRoom(null)
    setCopied(false)
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-charcoal-400/10">
          <h2 className="text-lg font-semibold text-white">
            {createdRoom ? 'Room Created!' : 'Create New Room'}
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-charcoal-500/50 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6">
          {createdRoom ? (
            /* Success state — show the generated invite code */
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                {emoji}
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">{name}</h3>
              <p className="text-gray-500 text-sm mb-5">Share this code with your admin</p>
              
              {/* Invite Code Display */}
              <div className="bg-charcoal-900 border border-charcoal-400/20 rounded-xl p-5 mb-4">
                <p className="text-gray-500 text-xs mb-2">Invite Code</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-accent text-2xl font-mono font-bold tracking-wider">
                    {inviteCode}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-charcoal-500/50 rounded-lg transition-colors"
                  >
                    <Icon 
                      name={copied ? 'check' : 'copy'} 
                      className={`w-5 h-5 ${copied ? 'text-accent' : 'text-gray-400'}`} 
                    />
                  </button>
                </div>
                {copied && (
                  <p className="text-accent text-xs mt-2">Copied to clipboard!</p>
                )}
              </div>
              
              {/* Share button */}
              <Button size="full" onClick={handleShare} className="mb-3">
                <span className="flex items-center justify-center gap-2">
                  <Icon name="share" className="w-4 h-4" />
                  Share with Admin
                </span>
              </Button>
              
              <p className="text-gray-600 text-xs">
                Your admin will use this code to join and set timing &amp; rules for this room.
              </p>
            </div>
          ) : (
            <>
              {/* Room Name */}
              <div className="mb-5">
                <label className="block text-gray-400 text-sm mb-2">Room Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Gym, Work, Study..."
                  className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
                  autoFocus
                  maxLength={30}
                />
                {codePreview && (
                  <p className="text-gray-600 text-xs mt-1.5">
                    Invite code will be like: <span className="text-accent font-mono">{codePreview}</span>
                  </p>
                )}
              </div>
              
              {/* Description */}
              <div className="mb-5">
                <label className="block text-gray-400 text-sm mb-2">
                  Description <span className="text-gray-600">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this room for?"
                  rows={2}
                  className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                  maxLength={200}
                />
              </div>
              
              {/* Emoji Selection */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Choose Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {ROOM_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`
                        w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all
                        ${emoji === e 
                          ? 'bg-accent/20 border-2 border-accent scale-110' 
                          : 'bg-charcoal-500/30 border border-charcoal-400/20 hover:bg-charcoal-500/50'
                        }
                      `}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Info note about timing */}
              <div className="p-3 rounded-lg bg-charcoal-500/20 border border-charcoal-400/10">
                <p className="text-gray-500 text-xs leading-relaxed">
                  Timing and rules will be set by your admin after you invite them.
                </p>
              </div>
            </>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {/* Footer */}
        <div className="p-4 border-t border-charcoal-400/10">
          {createdRoom ? (
            <Button size="full" variant="secondary" onClick={handleClose}>
              Done
            </Button>
          ) : (
            <Button 
              size="full"
              disabled={!canCreate || isCreating}
              onClick={handleCreate}
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creating...
                </span>
              ) : (
                'Create Room'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateRoomModal
