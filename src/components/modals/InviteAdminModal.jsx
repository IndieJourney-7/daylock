/**
 * Invite Admin Modal
 * Generates unique invite code for a room
 * User shares this code with someone who will manage the room
 */

import { useState, useEffect } from 'react'
import { Button, Icon, Badge } from '../ui'
import { invitesService } from '../../lib'

function InviteAdminModal({ isOpen, onClose, room, onInviteCreated }) {
  const [inviteCode, setInviteCode] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  
  // Check for existing pending invite
  useEffect(() => {
    if (room?.pending_invite) {
      setInviteCode(room.pending_invite.invite_code)
    } else {
      setInviteCode(null)
    }
  }, [room])
  
  if (!isOpen || !room) return null
  
  const handleGenerateCode = async () => {
    console.log('Generating invite for room:', room?.id, room)
    setIsGenerating(true)
    setError(null)
    
    if (!room?.id) {
      setError('Room ID is missing')
      setIsGenerating(false)
      return
    }
    
    try {
      const invite = await invitesService.createInvite(room.id)
      console.log('Invite created:', invite)
      setInviteCode(invite.invite_code)
      onInviteCreated?.()
    } catch (err) {
      console.error('Failed to create invite:', err)
      setError(err.message || 'Failed to generate code')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleCopyCode = async () => {
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
      text: `Join my "${room.name}" room on Daylock as an admin. Use code: ${inviteCode}`,
      url: window.location.origin + '/admin/join?code=' + inviteCode
    }
    
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        handleCopyCode()
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleCopyCode()
      }
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-charcoal-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-charcoal-400/10">
          <h2 className="text-lg font-semibold text-white">Invite Admin</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-charcoal-500/50 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Room Info */}
          <div className="flex items-center gap-3 p-4 bg-charcoal-500/30 rounded-xl mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
              {room.emoji || '🚪'}
            </div>
            <div>
              <p className="text-white font-medium">{room.name}</p>
              <p className="text-gray-500 text-sm">{room.time_start} - {room.time_end}</p>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {/* Current Admin Status */}
          {room.admin_id ? (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Icon name="profile" className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {room.admin?.name || 'Admin'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {room.admin?.email || 'Managing this room'}
                    </p>
                  </div>
                </div>
                <Badge variant="open" size="sm">Active</Badge>
              </div>
              <p className="text-gray-500 text-xs mt-3">
                This person currently manages this room.
              </p>
            </div>
          ) : (
            <>
              {/* No Admin Yet */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-charcoal-500/50 flex items-center justify-center mx-auto mb-4">
                  <Icon name="profile" className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-400 text-sm">No admin assigned yet</p>
                <p className="text-gray-600 text-xs mt-1">
                  Generate a code and share it with someone to manage this room
                </p>
              </div>
              
              {/* Invite Code Section */}
              {inviteCode ? (
                <div className="space-y-4">
                  {/* Code Display */}
                  <div className="p-4 bg-charcoal-900 rounded-xl border border-charcoal-400/20">
                    <p className="text-gray-500 text-xs mb-2 text-center">Your Invite Code</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-mono font-bold text-accent tracking-wider">
                        {inviteCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="p-2 hover:bg-charcoal-500/50 rounded-lg transition-colors"
                      >
                        <Icon 
                          name={copied ? 'check' : 'copy'} 
                          className={`w-5 h-5 ${copied ? 'text-accent' : 'text-gray-400'}`} 
                        />
                      </button>
                    </div>
                    {copied && (
                      <p className="text-accent text-xs text-center mt-2">Copied to clipboard!</p>
                    )}
                  </div>
                  
                  {/* Instructions */}
                  <div className="p-3 bg-charcoal-500/20 rounded-lg">
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Share this code with someone you trust. They will use it to sign up as an 
                      admin and manage the rules for your <span className="text-white">{room.name}</span> room.
                    </p>
                  </div>
                  
                  {/* Share Button */}
                  <Button size="full" onClick={handleShare}>
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="chevronRight" className="w-4 h-4" />
                      Share Code
                    </span>
                  </Button>
                  
                  {/* Regenerate */}
                  <button
                    onClick={handleGenerateCode}
                    className="w-full text-center text-gray-500 text-sm hover:text-gray-400 transition-colors"
                  >
                    Generate new code
                  </button>
                </div>
              ) : (
                <Button 
                  size="full"
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Generating...
                    </span>
                  ) : (
                    'Generate Invite Code'
                  )}
                </Button>
              )}
            </>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="p-4 border-t border-charcoal-400/10">
          <div className="flex items-start gap-2">
            <Icon name="lock" className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 text-xs">
              Once an admin accepts, they can set rules and view your attendance for this room only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InviteAdminModal
