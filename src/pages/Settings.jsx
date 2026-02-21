/**
 * Settings Page
 * User-controlled settings connected to database
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Avatar, Icon, Badge } from '../components/ui'
import { useAuth } from '../contexts'
import { useRooms, usePushSubscription } from '../hooks'

// Toggle Switch Component
function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        w-12 h-6 rounded-full transition-colors relative flex-shrink-0
        ${enabled ? 'bg-accent' : 'bg-charcoal-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className={`
        absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
        ${enabled ? 'translate-x-6' : 'translate-x-1'}
      `} />
    </button>
  )
}

// Setting Row Component
function SettingRow({ icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-charcoal-400/10 last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && <Icon name={icon} className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm">{title}</p>
          {description && <p className="text-gray-600 text-xs mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="ml-3">{children}</div>
    </div>
  )
}

// Loading skeleton
function SettingsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-32 bg-charcoal-600 rounded" />
      <div className="h-48 bg-charcoal-600 rounded-xl" />
      <div className="h-32 bg-charcoal-600 rounded-xl" />
      <div className="h-24 bg-charcoal-600 rounded-xl" />
    </div>
  )
}

function Settings() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const { data: rooms, loading: roomsLoading } = useRooms(user?.id)
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, permission: pushPermission, subscribe: subscribePush, unsubscribe: unsubscribePush, isLoading: pushLoading } = usePushSubscription()
  const navigate = useNavigate()
  
  // User settings state - initialized from profile
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [notifications, setNotifications] = useState({
    roomReminders: true,
    dailySummary: true,
    streakAlerts: true,
    weeklyReport: false,
  })
  const [theme, setTheme] = useState('dark')
  const [showSystemRules, setShowSystemRules] = useState(false)
  
  // Initialize from profile when loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.user_metadata?.full_name || '')
      // Load notification preferences from profile if stored
      if (profile.settings?.notifications) {
        setNotifications(profile.settings.notifications)
      }
    }
  }, [profile, user])
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
  }
  
  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    setSaveMessage('')
    
    try {
      await updateProfile({
        name,
        settings: {
          ...(profile?.settings || {}),
          notifications,
          theme
        }
      })
      setSaveMessage('Settings saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setSaveMessage('Failed to save')
    } finally {
      setSaving(false)
    }
  }
  
  if (!user || roomsLoading) {
    return <SettingsSkeleton />
  }
  
  // User info from auth
  const userEmail = user?.email || ''
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null
  
  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your preferences</p>
        </div>
      </div>
      
      {/* Profile Settings */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="profile" className="w-4 h-4 text-gray-400" />
          <h2 className="text-white font-semibold">Profile</h2>
        </div>
        
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-charcoal-500/30 rounded-xl">
          <Avatar src={avatarUrl} size="lg" />
          <div className="flex-1">
            <p className="text-white font-medium">{name || 'User'}</p>
            <p className="text-gray-500 text-sm">{userEmail}</p>
          </div>
        </div>
        
        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
            placeholder="Your name"
          />
        </div>
        
        {/* Email (read-only) */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">Email</label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={userEmail}
              disabled
              className="flex-1 bg-charcoal-500/30 border border-charcoal-400/10 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
            />
            <Badge variant="locked" size="sm">Verified</Badge>
          </div>
          <p className="text-gray-600 text-xs mt-1">Email is managed by Google</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            size="full" 
            variant="secondary" 
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-400' : 'text-accent'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </Card>
      
      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="fire" className="w-4 h-4 text-gray-400" />
          <h2 className="text-white font-semibold">Notifications</h2>
        </div>
        
        {/* Push notification status */}
        <div className="mb-4 p-3 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔔</span>
              <div>
                <p className="text-white text-sm">Push Notifications</p>
                <p className="text-gray-500 text-xs">
                  {!pushSupported
                    ? 'Not supported in this browser'
                    : pushSubscribed
                      ? 'Active — works even when app is closed'
                      : pushPermission === 'denied'
                        ? 'Blocked — enable in browser settings'
                        : 'Enable to get alerts even when app is closed'}
                </p>
              </div>
            </div>
            {pushSupported && !pushSubscribed && pushPermission !== 'denied' && (
              <button
                onClick={subscribePush}
                disabled={pushLoading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                {pushLoading ? '...' : 'Enable'}
              </button>
            )}
            {pushSubscribed && (
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs font-medium px-2 py-1 rounded-full bg-green-500/10">Active</span>
                <button
                  onClick={unsubscribePush}
                  disabled={pushLoading}
                  className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                >
                  Disable
                </button>
              </div>
            )}
            {pushPermission === 'denied' && (
              <span className="text-red-400 text-xs font-medium px-2 py-1 rounded-full bg-red-500/10">Blocked</span>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <SettingRow 
            title="Room Reminders"
            description="Get alerts before your rooms open"
          >
            <Toggle 
              enabled={notifications.roomReminders}
              onChange={(val) => handleNotificationChange('roomReminders', val)}
            />
          </SettingRow>
          
          <SettingRow 
            title="Streak Alerts"
            description="Warnings when streak is at risk"
          >
            <Toggle 
              enabled={notifications.streakAlerts}
              onChange={(val) => handleNotificationChange('streakAlerts', val)}
            />
          </SettingRow>
          
          <SettingRow 
            title="Daily Summary"
            description="End of day attendance report"
          >
            <Toggle 
              enabled={notifications.dailySummary}
              onChange={(val) => handleNotificationChange('dailySummary', val)}
            />
          </SettingRow>
          
          <SettingRow 
            title="Weekly Report"
            description="Performance summary every Sunday"
          >
            <Toggle 
              enabled={notifications.weeklyReport}
              onChange={(val) => handleNotificationChange('weeklyReport', val)}
            />
          </SettingRow>
        </div>
        
        <p className="text-gray-600 text-xs mt-4">
          Manage per-room alert timings on each room's detail page. Push notifications work even when the app is closed on your phone.
        </p>
      </Card>
      
      {/* Appearance */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="settings" className="w-4 h-4 text-gray-400" />
          <h2 className="text-white font-semibold">Appearance</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`
              p-4 rounded-xl border text-sm font-medium transition-all
              ${theme === 'dark' 
                ? 'bg-accent/20 border-accent text-accent' 
                : 'bg-charcoal-500/30 border-charcoal-400/20 text-gray-400 hover:border-charcoal-400/40'
              }
            `}
          >
            <div className="w-8 h-8 rounded-lg bg-charcoal-900 border border-charcoal-400/20 mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
            </div>
            Charcoal + Green
          </button>
          <button
            disabled
            className="p-4 rounded-xl border bg-charcoal-500/30 border-charcoal-400/10 text-gray-600 text-sm cursor-not-allowed"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-200 border border-gray-300 mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            </div>
            Light (Soon)
          </button>
        </div>
      </Card>
      
      {/* My Rooms (from database) */}
      <Card className="bg-charcoal-700/30 border border-charcoal-400/10">
        <button 
          onClick={() => setShowSystemRules(!showSystemRules)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-charcoal-500/50 rounded-lg">
              <Icon name="home" className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-gray-400 text-sm font-medium">My Rooms</p>
              <p className="text-gray-600 text-xs mt-0.5">{(rooms || []).length} room{(rooms || []).length !== 1 ? 's' : ''} configured</p>
            </div>
          </div>
          <Icon 
            name={showSystemRules ? 'chevronLeft' : 'chevronRight'} 
            className={`w-4 h-4 text-gray-500 transition-transform ${showSystemRules ? 'rotate-90' : ''}`}
          />
        </button>
        
        {showSystemRules && (
          <div className="mt-4 pt-4 border-t border-charcoal-400/10 space-y-4">
            {/* Room Schedules */}
            <div>
              <p className="text-gray-500 text-xs mb-3 uppercase tracking-wide">Room Schedules</p>
              {(rooms || []).length > 0 ? (
                <div className="space-y-2">
                  {(rooms || []).map((room) => (
                    <div 
                      key={room.id}
                      className="flex items-center justify-between p-3 bg-charcoal-500/20 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span>{room.emoji || '📋'}</span>
                        <span className="text-white text-sm">{room.name}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{room.time_start} - {room.time_end}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No rooms created yet</p>
              )}
            </div>
            
            <p className="text-gray-600 text-xs text-center pt-2">
              <button 
                onClick={() => navigate('/rooms')}
                className="text-accent hover:underline"
              >
                Manage rooms →
              </button>
            </p>
          </div>
        )}
      </Card>
      
      {/* App Info */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="home" className="w-4 h-4 text-gray-400" />
          <h2 className="text-white font-semibold">About</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Version</span>
            <span className="text-white text-sm">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Build</span>
            <span className="text-gray-500 text-sm">{new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-charcoal-400/10 flex flex-wrap gap-3">
          <button className="text-accent text-sm hover:underline">Privacy Policy</button>
          <button className="text-accent text-sm hover:underline">Terms of Service</button>
          <button className="text-accent text-sm hover:underline">Support</button>
        </div>
      </Card>
      
      {/* Account Actions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="profile" className="w-4 h-4 text-gray-400" />
          <h2 className="text-white font-semibold">Account</h2>
        </div>
        
        <div className="space-y-3">
          <Button size="full" variant="ghost" className="text-gray-400 hover:text-white" onClick={handleSignOut}>
            <span className="flex items-center justify-center gap-2">
              <Icon name="logout" className="w-4 h-4" />
              Sign Out
            </span>
          </Button>
        </div>
      </Card>
      
      {/* Danger Zone */}
      <Card className="border border-red-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="close" className="w-4 h-4 text-red-400" />
          <h2 className="text-red-400 font-semibold">Danger Zone</h2>
        </div>
        
        <p className="text-gray-500 text-sm mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        
        <Button size="full" variant="ghost" className="text-red-400 hover:bg-red-500/10 border border-red-500/20">
          Delete Account
        </Button>
      </Card>
    </div>
  )
}

export default Settings
