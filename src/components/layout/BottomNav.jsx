/**
 * Bottom Navigation Component
 * Mobile only - hidden on desktop
 * PWA-style tab bar
 */

import { NavLink } from 'react-router-dom'
import { Icon } from '../ui'

// Mobile nav only shows key items
const MOBILE_NAV_ITEMS = [
  { id: 'home', label: 'Home', path: '/dashboard', icon: 'home' },
  { id: 'history', label: 'History', path: '/history', icon: 'history' },
  { id: 'profile', label: 'Profile', path: '/profile', icon: 'profile' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: 'settings' },
]

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-charcoal-800 border-t border-charcoal-400/10 safe-area-bottom">
      <ul className="flex items-center justify-around h-16">
        {MOBILE_NAV_ITEMS.map((item) => (
          <li key={item.id} className="flex-1">
            <NavLink
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-1 py-2
                transition-colors duration-200
                ${isActive ? 'text-accent' : 'text-gray-500'}
              `}
            >
              <Icon name={item.icon} className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNav
