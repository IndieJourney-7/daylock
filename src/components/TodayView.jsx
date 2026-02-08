import LockIcon from './icons/LockIcon'

const lockedRooms = [
  { name: 'Work', lockedUntil: '9:00 AM' },
  { name: 'Other', lockedUntil: '4:00 PM' },
  { name: 'Attendance', lockedUntil: '9:00 PM' },
  { name: '', lockedUntil: '9:00 PM' },
]

function TodayView() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="glass-card rounded-2xl p-6 sm:p-8 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Today</h2>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 font-medium">Wednesday</span>
              </div>
              <p className="text-gray-500 text-sm">Streak: 5 Days</p>
            </div>
            
            {/* Progress ring */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-charcoal-400"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={125.6}
                  strokeDashoffset={31.4}
                  className="text-accent"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          
          {/* Active room - Gym */}
          <div className="room-card-active rounded-xl p-5 sm:p-6 mb-4 relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-accent/5 to-transparent" />
            
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-accent mb-1">Gym</h3>
                <p className="text-gray-400 text-sm mb-1">6:00 AM - 7:00 AM</p>
                <p className="text-gray-500 text-sm">Time to Work Out!</p>
              </div>
              
              <button className="px-6 py-3 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-glow">
                Enter Room
              </button>
            </div>
          </div>
          
          {/* Locked rooms grid */}
          <div className="grid grid-cols-2 gap-3">
            {lockedRooms.map((room, index) => (
              <div 
                key={index}
                className="room-card rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-charcoal-400/30">
                    <LockIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  {room.name && (
                    <div>
                      <p className="text-white font-medium text-sm">{room.name}</p>
                      <p className="text-gray-500 text-xs">Locked Until {room.lockedUntil}</p>
                    </div>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-charcoal-400/30">
                  <LockIcon className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TodayView
