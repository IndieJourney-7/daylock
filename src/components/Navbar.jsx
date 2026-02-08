import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts'

function Navbar() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal-900/80 backdrop-blur-lg border-b border-charcoal-400/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center">
            <img 
              src="/Assets/daylock_logo.png" 
              alt="Daylock Logo" 
              className="w-36 h-36 object-contain"
            />
          </a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="#how-it-works" 
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#accountability" 
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
            >
              Accountability
            </a>
            <a 
              href="#features" 
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
            >
              Features
            </a>
            {user ? (
              <Link 
                to="/dashboard"
                className="px-5 py-2 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold text-sm rounded-lg transition-all duration-300 hover:shadow-glow"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                to="/login"
                className="px-5 py-2 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold text-sm rounded-lg transition-all duration-300 hover:shadow-glow"
              >
                Sign In
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-charcoal-500/50 transition-colors"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-charcoal-400/10">
            <div className="flex flex-col gap-4">
              <a 
                href="#how-it-works" 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-2 py-2"
              >
                How It Works
              </a>
              <a 
                href="#accountability" 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-2 py-2"
              >
                Accountability
              </a>
              <a 
                href="#features" 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-2 py-2"
              >
                Features
              </a>
              {user ? (
                <Link 
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-3 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold text-sm rounded-lg transition-all duration-300 text-center"
                >
                  Dashboard
                </Link>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-3 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold text-sm rounded-lg transition-all duration-300 text-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
