

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
            {/* Social proof pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-accent text-sm font-medium">Live — real people locking their days right now</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Stop Planning.<br />
              <span className="text-gradient">Start Proving.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-400 font-light mb-6">
              The accountability app that actually works — because someone else holds the keys.
            </p>
            
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
              Create rooms for gym, work, study. Assign a partner who sets the rules and verifies your proof. Miss the window? The door stays locked. No excuses, no second chances.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {user ? (
                <Link 
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-glow text-lg"
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login"
                    state={{ from: { pathname: '/rooms' } }}
                    className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-glow text-lg"
                  >
                    Lock Your First Day — Free
                  </Link>
                  <a 
                    href="#how-it-works"
                    className="inline-flex items-center justify-center px-8 py-4 border border-charcoal-400/30 text-gray-300 hover:text-white hover:border-charcoal-400/50 font-medium rounded-lg transition-all duration-300"
                  >
                    See How It Works ↓
                  </a>
                </>
              )}
            </div>
            
            {/* Trust signals */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Works on mobile
              </span>
            </div>
          </div>
          
          {/* Right — App screenshot with device frame */}
          <div className="fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              {/* Glowing background effect */}
              <div className="absolute -inset-8 bg-gradient-to-b from-accent/10 to-transparent rounded-3xl blur-xl" />
              
              <div className="relative">
                {/* App screenshot in a phone-like frame */}
                <div className="relative mx-auto max-w-sm">
                  <div className="rounded-3xl border-2 border-charcoal-400/20 bg-charcoal-800/80 p-3 shadow-2xl shadow-accent/10">
                    <img 
                      src="/Assets/dayblocks.png" 
                      alt="Daylock — Gym, Work, and Attendance rooms with live countdown timers"
                      className="w-full rounded-2xl"
                    />
                  </div>
                  
                  {/* Floating badge — streak */}
                  <div className="absolute -top-4 -right-4 sm:-right-8 px-4 py-2 rounded-xl bg-charcoal-800 border border-accent/30 shadow-lg shadow-accent/10 fade-in" style={{ animationDelay: '0.6s' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔥</span>
                      <div>
                        <p className="text-white font-bold text-sm">12-Day Streak</p>
                        <p className="text-gray-500 text-[10px]">Don't break the chain</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating badge — proof verified */}
                  <div className="absolute -bottom-4 -left-4 sm:-left-8 px-4 py-2 rounded-xl bg-charcoal-800 border border-green-500/30 shadow-lg shadow-green-500/10 fade-in" style={{ animationDelay: '0.8s' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Proof Verified</p>
                        <p className="text-gray-500 text-[10px]">Trainer approved your gym photo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
