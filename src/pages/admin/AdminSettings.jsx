/**
 * Admin Settings
 * Clean, minimal admin preferences
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon, Button } from '../../components/ui'
import { useAuth } from '../../contexts'
import { useAdminRooms } from '../../hooks'

function ToggleSwitch({ enabled, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        relative w-11 h-6 rounded-full transition-colors flex-shrink-0
        ${enabled ? 'bg-accent' : 'bg-charcoal-500'}
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

function SettingsRow({ icon, iconColor = 'text-gray-400', title, desc, children, onClick, danger }) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3.5 rounded-xl transition-colors text-left
        ${danger 
          ? 'bg-red-500/5 border border-red-500/10 hover:bg-red-500/10' 
          : 'bg-charcoal-500/20 border border-charcoal-400/10 hover:bg-charcoal-500/30'}
      `}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/10' : 'bg-charcoal-500/30'}`}>
        <Icon name={icon} className={`w-4 h-4 ${danger ? 'text-red-400' : iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{title}</p>
        {desc && <p className="text-gray-500 text-xs mt-0.5">{desc}</p>}
      </div>
      {children || (onClick && <Icon name="chevronRight" className={`w-4 h-4 flex-shrink-0 ${danger ? 'text-red-500/50' : 'text-gray-600'}`} />)}
    </Wrapper>
  )
}

function AdminSettings() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const { data: rooms } = useAdminRooms(user?.id)
  const navigate = useNavigate()
  
  const [notifications, setNotifications] = useState({
    newInvites: true,
    attendanceAlerts: true,
    dailySummary: false,
    missedAttendance: true,
    ...(profile?.settings?.notifications || {})
  })
  const [isSaving, setIsSaving] = useState(false)
  
  const totalRooms = rooms?.length || 0
  const pendingProofs = rooms?.reduce((sum, r) => sum + (r.pending_proofs_count || 0), 0) || 0
  const joinedAt = profile?.created_at || user?.created_at
  const joinedDate = joinedAt ? new Date(joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'
  
  const name = profile?.name || user?.user_metadata?.name || 'Admin'
  const email = user?.email || ''
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
  
  const toggleNotification = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    try {
      setIsSaving(true)
      await updateProfile({ settings: { ...profile?.settings, notifications: updated } })
    } catch (err) { console.error('Failed to save:', err) }
    finally { setIsSaving(false) }
  }
  
  const handleSignOut = async () => { await signOut(); navigate('/login') }
  
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Profile Card */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-2xl object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-charcoal-500/50 flex items-center justify-center">
            <span className="text-lg text-gray-400">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg truncate">{name}</h2>
          <p className="text-gray-500 text-sm truncate">{email}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider">Since</p>
          <p className="text-white text-sm">{joinedDate}</p>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
          <p className="text-accent text-2xl font-bold">{totalRooms}</p>
          <p className="text-gray-500 text-xs mt-1">Rooms Managing</p>
        </div>
        <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
          <p className={`text-2xl font-bold ${pendingProofs > 0 ? 'text-yellow-400' : 'text-white'}`}>{pendingProofs}</p>
          <p className="text-gray-500 text-xs mt-1">Pending Proofs</p>
        </div>
      </div>
      
      {/* Notifications */}
      <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Notifications</p>
          {isSaving && <span className="text-gray-600 text-[10px]">Saving...</span>}
        </div>
        
        {[
          { key: 'newInvites', icon: 'plus', title: 'New Invites', desc: 'When users invite you to manage rooms' },
          { key: 'attendanceAlerts', icon: 'camera', title: 'Proof Submissions', desc: 'When users submit proof for review' },
          { key: 'dailySummary', icon: 'calendar', title: 'Daily Summary', desc: 'Daily performance reports' },
          { key: 'missedAttendance', icon: 'alertCircle', title: 'Missed Attendance', desc: 'When users miss their window' },
        ].map(item => (
          <div key={item.key} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-charcoal-500/30 flex items-center justify-center flex-shrink-0">
              <Icon name={item.icon} className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{item.title}</p>
              <p className="text-gray-500 text-xs">{item.desc}</p>
            </div>
            <ToggleSwitch 
              enabled={notifications[item.key]} 
              onChange={() => toggleNotification(item.key)} 
              disabled={isSaving} 
            />
          </div>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-2">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider px-1">Quick Actions</p>
        
        <SettingsRow 
          icon="user" 
          iconColor="text-accent" 
          title="Switch to User Mode" 
          desc="Go back to your personal dashboard" 
          onClick={() => navigate('/dashboard')} 
        />
        
        <SettingsRow 
          icon="plus" 
          iconColor="text-blue-400" 
          title="Accept New Invite" 
          desc="Join a new room as an admin" 
          onClick={() => navigate('/admin/join')} 
        />
        
        <SettingsRow 
          icon="logout" 
          title="Sign Out" 
          onClick={handleSignOut} 
          danger 
        />
      </div>
      
      {/* App Info */}
      <div className="text-center pt-2 pb-8">
        <p className="text-gray-600 text-xs">DayLock Admin v1.0</p>
      </div>
    </div>
  )
}

export default AdminSettings
