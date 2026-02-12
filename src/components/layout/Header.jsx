/**
 * Top Header Component
 * Mobile only - shows page title and optional actions
 */

import { useLocation } from 'react-router-dom'
import { Icon } from '../ui'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/rooms': 'Rooms',
  '/history': 'History',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

function Header({ title, showBack = false, onBack, rightAction }) {
  const location = useLocation()
  const displayTitle = title || PAGE_TITLES[location.pathname] || 'Daylock'

  return (
    <header className="md:hidden sticky top-0 z-40 bg-charcoal-900/95 backdrop-blur-sm border-b border-charcoal-400/10">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
            >
              <Icon name="chevronLeft" className="w-5 h-5" />
            </button>
          ) : (
            <img 
              src="/Assets/daylock_logo.png" 
              alt="Daylock" 
              className="w-24 h-24 object-contain -my-6"
            />
          )}
          <h1 className="text-white font-semibold text-lg">{displayTitle}</h1>
        </div>
        
        {/* Right side */}
        {rightAction && (
          <div className="flex items-center">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
