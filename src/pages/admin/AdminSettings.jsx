/**
 * Admin Settings
 * Admin preferences and account settings
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Icon, Button } from '../../components/ui'
import { useAuth } from '../../contexts'
import { useAdminRooms } from '../../hooks'

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
  const joinedDate = joinedAt ? new Date(joinedAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }) : 'Recently'
  
  const toggleNotification = async (key) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key]
    }
    setNotifications(newNotifications)
    
    // Save to database
    try {
      setIsSaving(true)
      await updateProfile({
        settings: {
          ...profile?.settings,
          notifications: newNotifications
        }
      })
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Admin Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your admin preferences</p>
      </div>
      
      {/* Profile */}
      <Card>
        <h3 className="text-white font-medium mb-4">Profile</h3>
        
        <div className="flex items-center gap-4 mb-6">
          {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
            <img 
              src={profile?.avatar_url || user?.user_metadata?.avatar_url} 
              alt={profile?.name || 'Admin'}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-charcoal-500 flex items-center justify-center">
              <span className="text-xl text-gray-400">
                {(profile?.name || user?.user_metadata?.name || 'A').split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h4 className="text-white font-medium">{profile?.name || user?.user_metadata?.name || 'Admin'}</h4>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-charcoal-500">
            <span className="text-gray-400 text-sm">Email</span>
            <span className="text-white text-sm">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Admin Since</span>
            <span className="text-white text-sm">{joinedDate}</span>
          </div>
        </div>
      </Card>
      
      {/* Stats */}
      <Card>
        <h3 className="text-white font-medium mb-4">Admin Stats</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-charcoal-500/30 text-center">
            <p className="text-accent text-2xl font-bold">{totalRooms}</p>
            <p className="text-gray-500 text-xs mt-1">Rooms Managing</p>
          </div>
          <div className="p-4 rounded-lg bg-charcoal-500/30 text-center">
            <p className="text-white text-2xl font-bold">{pendingProofs}</p>
            <p className="text-gray-500 text-xs mt-1">Pending Proofs</p>
          </div>
        </div>
      </Card>
      
      {/* Notifications */}
      <Card>
        <h3 className="text-white font-medium mb-4">Notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-white text-sm">New Invite Codes</p>
              <p className="text-gray-500 text-xs">Get notified when users invite you to manage rooms</p>
            </div>
            <button
              onClick={() => toggleNotification('newInvites')}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${notifications.newInvites ? 'bg-accent' : 'bg-charcoal-500'}
              `}
              disabled={isSaving}
            >
              <span className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform
                ${notifications.newInvites ? 'left-5' : 'left-0.5'}
              `} />
            </button>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-white text-sm">Attendance Alerts</p>
              <p className="text-gray-500 text-xs">When users submit proof that needs review</p>
            </div>
            <button
              onClick={() => toggleNotification('attendanceAlerts')}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${notifications.attendanceAlerts ? 'bg-accent' : 'bg-charcoal-500'}
              `}
              disabled={isSaving}
            >
              <span className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform
                ${notifications.attendanceAlerts ? 'left-5' : 'left-0.5'}
              `} />
            </button>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-white text-sm">Daily Summary</p>
              <p className="text-gray-500 text-xs">Receive daily reports of user performance</p>
            </div>
            <button
              onClick={() => toggleNotification('dailySummary')}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${notifications.dailySummary ? 'bg-accent' : 'bg-charcoal-500'}
              `}
              disabled={isSaving}
            >
              <span className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform
                ${notifications.dailySummary ? 'left-5' : 'left-0.5'}
              `} />
            </button>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-white text-sm">Missed Attendance</p>
              <p className="text-gray-500 text-xs">Alert when users miss their scheduled time</p>
            </div>
            <button
              onClick={() => toggleNotification('missedAttendance')}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${notifications.missedAttendance ? 'bg-accent' : 'bg-charcoal-500'}
              `}
              disabled={isSaving}
            >
              <span className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform
                ${notifications.missedAttendance ? 'left-5' : 'left-0.5'}
              `} />
            </button>
          </div>
        </div>
        
        {isSaving && (
          <p className="text-gray-500 text-xs mt-3 text-center">Saving...</p>
        )}
      </Card>
      
      {/* Actions */}
      <Card>
        <h3 className="text-white font-medium mb-4">Actions</h3>
        
        <div className="space-y-3">
          <Link to="/dashboard">
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-charcoal-500/30 hover:bg-charcoal-500/50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <Icon name="user" className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm">Switch to User Mode</span>
              </div>
              <Icon name="chevronRight" className="w-4 h-4 text-gray-500" />
            </button>
          </Link>
          
          <Link to="/admin/join">
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-charcoal-500/30 hover:bg-charcoal-500/50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <Icon name="plus" className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm">Accept New Invite</span>
              </div>
              <Icon name="chevronRight" className="w-4 h-4 text-gray-500" />
            </button>
          </Link>
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Icon name="logout" className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">Sign Out</span>
            </div>
            <Icon name="chevronRight" className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </Card>
    </div>
  )
}

export default AdminSettings
