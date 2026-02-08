/**
 * Create Room Modal
 * User creates a new room with name, emoji, and time window
 */

import { useState } from 'react'
import { Card, Button, Icon } from '../ui'

// Available emojis for rooms
const ROOM_EMOJIS = ['🏋️', '💼', '📚', '🧘', '🏃', '💻', '🎨', '🎵', '🍳', '🛏️', '📝', '🎯']

// Preset time windows
const TIME_PRESETS = [
  { label: 'Early Morning', start: '05:00', end: '06:00' },
  { label: 'Morning', start: '06:00', end: '08:00' },
  { label: 'Work Hours', start: '09:00', end: '11:00' },
  { label: 'Midday', start: '12:00', end: '14:00' },
  { label: 'Afternoon', start: '15:00', end: '17:00' },
  { label: 'Evening', start: '18:00', end: '20:00' },
  { label: 'Night', start: '21:00', end: '22:00' },
]

function CreateRoomModal({ isOpen, onClose, onCreateRoom }) {
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Time Window
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)
  
  if (!isOpen) return null
  
  const timeStart = selectedPreset !== null
    ? TIME_PRESETS[selectedPreset].start
    : customStart
  
  const timeEnd = selectedPreset !== null
    ? TIME_PRESETS[selectedPreset].end
    : customEnd
  
  const canProceed = step === 1 ? name.trim().length > 0 : (timeStart && timeEnd)
  
  const handleCreate = async () => {
    if (!canProceed) return
    
    setIsCreating(true)
    setError(null)
    
    try {
      const roomData = {
        name: name.trim(),
        emoji,
        time_start: timeStart,
        time_end: timeEnd
      }
      
      await onCreateRoom(roomData)
      handleClose()
    } catch (err) {
      setError(err.message || 'Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }
  
  const handleClose = () => {
    setStep(1)
    setName('')
    setEmoji('🎯')
    setSelectedPreset(null)
    setCustomStart('')
    setCustomEnd('')
    setError(null)
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
            {step === 1 ? 'Create New Room' : 'Set Time Window'}
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
          {step === 1 ? (
            <>
              {/* Room Name */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Room Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Gym, Work, Study..."
                  className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
                  autoFocus
                />
              </div>
              
              {/* Emoji Selection */}
              <div>
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
            </>
          ) : (
            <>
              {/* Time Presets */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Quick Select</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedPreset(index)
                        setCustomStart('')
                        setCustomEnd('')
                      }}
                      className={`
                        p-3 rounded-xl text-left transition-all
                        ${selectedPreset === index 
                          ? 'bg-accent/20 border border-accent' 
                          : 'bg-charcoal-500/30 border border-charcoal-400/20 hover:bg-charcoal-500/50'
                        }
                      `}
                    >
                      <p className={`text-sm font-medium ${selectedPreset === index ? 'text-accent' : 'text-white'}`}>
                        {preset.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {preset.start} - {preset.end}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom Time */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Or Custom Time</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="time"
                      value={customStart}
                      onChange={(e) => {
                        setCustomStart(e.target.value)
                        setSelectedPreset(null)
                      }}
                      className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                    />
                    <p className="text-xs text-gray-600 mt-1">Start</p>
                  </div>
                  <div className="flex items-center text-gray-500">to</div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={customEnd}
                      onChange={(e) => {
                        setCustomEnd(e.target.value)
                        setSelectedPreset(null)
                      }}
                      className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                    />
                    <p className="text-xs text-gray-600 mt-1">End</p>
                  </div>
                </div>
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
        <div className="p-4 border-t border-charcoal-400/10 flex gap-3">
          {step === 2 && (
            <Button 
              variant="secondary" 
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          
          {step === 1 ? (
            <Button 
              size="full"
              disabled={!canProceed}
              onClick={() => setStep(2)}
            >
              Next
            </Button>
          ) : (
            <Button 
              size="full"
              disabled={!canProceed || isCreating}
              onClick={handleCreate}
              className="flex-1"
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
