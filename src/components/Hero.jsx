

import { Link } from 'react-router-dom'
import { useAuth } from '../contexts'

function Hero() {
  const { user } = useAuth()

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-charcoal-700 via-charcoal-900 to-charcoal-900 opacity-50" />
      
      {/* Subtle green glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 blur-[120px] rounded-full" />
      
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div className="fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight">
              Your Day. Locked.
            </h1>
            <p className="text-xl sm:text-2xl text-gray-400 font-light mb-8">
              One Room at a Time.
            </p>
            
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
              Assign accountability partners to each room.<br />
              They set the rules. They mark your attendance.<br />
              Miss the time? The door stays locked.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {user ? (
                <Link 
                  to="/rooms"
                  className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-glow"
                >
                  Create Your Room
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login"
                    state={{ from: { pathname: '/rooms' } }}
                    className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-glow"
                  >
                    Create Your Room
                  </Link>
                  <a 
                    href="#waitlist"
                    className="inline-flex items-center justify-center px-8 py-4 border border-charcoal-400/30 text-gray-300 hover:text-white hover:border-charcoal-400/50 font-medium rounded-lg transition-all duration-300"
                  >
                    Join Waitlist
                  </a>
                </>
              )}
            </div>
            
            <a 
              href="#how-it-works" 
              className="inline-flex items-center text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              See How It Works 
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          {/* Right - Room Stack Image */}
          <div className="fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              {/* Glowing background effect */}
              <div className="absolute -inset-8 bg-gradient-to-b from-accent/10 to-transparent rounded-3xl blur-xl" />
              
              <div className="relative">
                <img 
                  src="/Assets/dayblocks.png" 
                  alt="Daylock Room Blocks - Gym, Work, Other, Attendance"
                  className="w-full max-w-xl lg:max-w-2xl mx-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
