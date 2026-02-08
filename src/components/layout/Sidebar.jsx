/**
 * Sidebar Navigation Component
 * Desktop only - hidden on mobile
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { Icon } from '../ui'
import { NAV_ITEMS } from '../../constants'
import { useAuth } from '../../contexts'

function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }
  
  return (
    <aside className="hidden md:flex flex-col w-56 bg-charcoal-800 border-r border-charcoal-400/10 min-h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-charcoal-400/10">
        <div className="flex items-center gap-3">
          <img 
            src="/Assets/daylock_logo.png" 
            alt="Daylock" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-white font-bold text-lg">Daylock</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-6 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-charcoal-600/50 text-accent' 
                    : 'text-gray-400 hover:text-white hover:bg-charcoal-600/30'
                  }
                `}
              >
                <Icon name={item.icon} className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User Profile & Logout */}
      <div className="p-4 border-t border-charcoal-400/10">
        {user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              {(profile?.avatar_url || user.user_metadata?.avatar_url) ? (
                <img 
                  src={profile?.avatar_url || user.user_metadata?.avatar_url} 
                  alt="" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-accent text-sm font-medium">
                  {(profile?.name || user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">
                {profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
              </p>
              <p className="text-gray-500 text-xs truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm px-2 py-2 w-full transition-colors"
        >
          <Icon name="logout" className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
