/**
 * Attendance Room Page
 * End-of-day summary - review all rooms and reflect on daily performance
 * This is a special room that aggregates data from all other rooms
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Badge, Button, Icon } from '../components/ui'

// Mock data - will be replaced with Supabase
const todayData = {
  date: new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  timeWindow: '9:00 PM - 10:00 PM',
  status: 'open', // or 'locked'
  rooms: [
    {
      id: 'gym',
      name: 'Gym',
      emoji: '🏋️',
      timeWindow: '6:00 AM - 7:00 AM',
      status: 'completed', // completed, missed, pending
      proofUploaded: true,
      note: 'Full workout - legs day',
      completedAt: '6:45 AM'
    },
    {
      id: 'work',
      name: 'Work',
      emoji: '💼',
      timeWindow: '9:00 AM - 11:00 AM',
      status: 'completed',
      proofUploaded: true,
      note: 'Finished project milestone',
      completedAt: '10:30 AM'
    },
    {
      id: 'other',
      name: 'Other',
      emoji: '📚',
      timeWindow: '12:00 PM - 2:00 PM',
      status: 'missed',
      proofUploaded: false,
      note: null,
      completedAt: null
    }
  ],
  streak: 12,
  weeklyScore: 85
}

// Status styling helper
const getStatusConfig = (status) => {
  switch (status) {
    case 'completed':
      return { 
        color: 'text-accent', 
        bg: 'bg-accent/20', 
        icon: 'check',
        label: 'Completed'
      }
    case 'missed':
      return { 
        color: 'text-red-400', 
        bg: 'bg-red-500/20', 
        icon: 'close',
        label: 'Missed'
      }
    case 'pending':
      return { 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/20', 
        icon: 'history',
        label: 'Pending'
      }
    default:
      return { 
        color: 'text-gray-400', 
        bg: 'bg-charcoal-500/50', 
        icon: 'lock',
        label: 'Unknown'
      }
  }
}

function AttendanceRoom() {
  const navigate = useNavigate()
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dayCompleted, setDayCompleted] = useState(false)
  
  const isOpen = todayData.status === 'open'
  const completedRooms = todayData.rooms.filter(r => r.status === 'completed').length
  const totalRooms = todayData.rooms.length
  const completionRate = Math.round((completedRooms / totalRooms) * 100)
  
  const handleCompleteDay = async () => {
    if (!isOpen) return
    setIsSubmitting(true)
    // Simulate API call - will be replaced with Supabase
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setDayCompleted(true)
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Back button (mobile) */}
      <button 
        onClick={() => navigate(-1)}
        className="md:hidden flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
      >
        <Icon name="chevronLeft" className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`
            w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0
            ${isOpen ? 'bg-accent/20' : 'bg-charcoal-500/50'}
          `}>
            ✅
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${isOpen ? 'text-accent' : 'text-white'}`}>
              Daily Attendance
            </h1>
            <p className="text-gray-400 text-sm">{todayData.timeWindow}</p>
          </div>
        </div>
        <Badge variant={isOpen ? 'open' : 'locked'} size="lg">
          {todayData.status}
        </Badge>
      </div>
      
      {/* Date */}
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Icon name="calendar" className="w-4 h-4" />
        <span>{todayData.date}</span>
      </div>
      
      {/* Daily Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-accent">{completedRooms}/{totalRooms}</div>
          <div className="text-xs text-gray-500 mt-1">Rooms Done</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-white">{completionRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Today</div>
        </Card>
        <Card className="text-center py-4">
          <div className="flex items-center justify-center gap-1">
            <Icon name="fire" className="w-5 h-5 text-orange-400" />
            <span className="text-2xl font-bold text-orange-400">{todayData.streak}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Day Streak</div>
        </Card>
      </div>
      
      {/* Today's Room Summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="rooms" className="w-4 h-4 text-gray-400" />
            <h2 className="text-white font-semibold">Today's Summary</h2>
          </div>
          <span className="text-xs text-gray-500">
            {completedRooms} of {totalRooms} completed
          </span>
        </div>
        
        <div className="space-y-3">
          {todayData.rooms.map((room) => {
            const config = getStatusConfig(room.status)
            return (
              <div 
                key={room.id}
                className={`
                  p-4 rounded-xl border transition-colors
                  ${room.status === 'completed' 
                    ? 'bg-accent/5 border-accent/20' 
                    : room.status === 'missed'
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-charcoal-500/30 border-charcoal-400/10'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${config.bg}`}>
                      {room.emoji}
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm">{room.name}</h3>
                      <p className="text-gray-500 text-xs">{room.timeWindow}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${config.color}`}>{config.label}</span>
                    <div className={`p-1 rounded-full ${config.bg}`}>
                      <Icon name={config.icon} className={`w-3 h-3 ${config.color}`} />
                    </div>
                  </div>
                </div>
                
                {/* Additional info for completed rooms */}
                {room.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-charcoal-400/10">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {room.proofUploaded && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Icon name="camera" className="w-3 h-3" />
                            Proof uploaded
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500">
                        Completed at {room.completedAt}
                      </span>
                    </div>
                    {room.note && (
                      <p className="text-gray-400 text-xs mt-2 italic">"{room.note}"</p>
                    )}
                  </div>
                )}
                
                {/* Missed room info */}
                {room.status === 'missed' && (
                  <div className="mt-3 pt-3 border-t border-charcoal-400/10">
                    <p className="text-gray-500 text-xs">
                      No proof submitted during open hours
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
      
      {/* Daily Reflection */}
      <Card variant={isOpen && !dayCompleted ? 'active' : 'locked'}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="note" className="w-4 h-4 text-gray-400" />
            <h2 className="text-white font-semibold">Daily Reflection</h2>
          </div>
          {dayCompleted && (
            <Badge variant="present" size="sm">Submitted</Badge>
          )}
        </div>
        
        {dayCompleted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Icon name="check" className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-white font-medium mb-1">Day Completed!</h3>
            <p className="text-gray-500 text-sm">Your attendance has been recorded</p>
            {reflection && (
              <div className="mt-4 p-3 bg-charcoal-500/30 rounded-lg">
                <p className="text-gray-400 text-sm italic">"{reflection}"</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">
              Take a moment to reflect on your day. What went well? What could be improved?
            </p>
            
            <textarea
              placeholder="Write your daily reflection..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              disabled={!isOpen}
              rows={4}
              className={`
                w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg 
                px-4 py-3 text-white placeholder-gray-600 text-sm resize-none
                focus:outline-none focus:border-accent/50 transition-colors
                ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">
                {reflection.length > 0 && (
                  <span>{reflection.length} characters</span>
                )}
              </div>
            </div>
            
            <Button 
              size="full" 
              disabled={!isOpen || isSubmitting}
              onClick={handleCompleteDay}
              className="mt-4"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Completing Day...
                </span>
              ) : (
                'Complete Day'
              )}
            </Button>
            
            {!isOpen && (
              <p className="text-gray-600 text-xs text-center mt-3 flex items-center justify-center gap-1.5">
                <Icon name="lock" className="w-3 h-3" />
                Attendance room opens at 9:00 PM
              </p>
            )}
          </>
        )}
      </Card>
      
      {/* Weekly Progress */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="history" className="w-4 h-4 text-gray-400" />
            <h2 className="text-white font-semibold">Weekly Progress</h2>
          </div>
          <span className="text-accent font-medium">{todayData.weeklyScore}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-charcoal-500/50 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${todayData.weeklyScore}%` }}
          />
        </div>
        
        {/* Week days */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
            // Mock data - some days completed, some not
            const isCompleted = index < 5 // Mon-Fri completed
            const isToday = index === 5 // Saturday is today
            return (
              <div key={index} className="flex flex-col items-center gap-1">
                <span className="text-gray-500 text-xs">{day}</span>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs
                  ${isToday 
                    ? 'ring-2 ring-accent bg-accent/20 text-accent' 
                    : isCompleted 
                      ? 'bg-accent/20 text-accent'
                      : 'bg-charcoal-500/50 text-gray-500'
                  }
                `}>
                  {isCompleted ? (
                    <Icon name="check" className="w-3 h-3" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <p className="text-gray-500 text-xs text-center mt-4">
          Keep your streak going! You're doing great.
        </p>
      </Card>
    </div>
  )
}

export default AttendanceRoom
