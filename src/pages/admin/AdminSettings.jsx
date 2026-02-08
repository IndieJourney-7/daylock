/**
 * Admin Settings
 * Admin preferences and account settings
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Icon, Button } from '../../components/ui'

// Mock admin data
const adminData = {
  name: 'Coach Mike',
  email: 'mike@gym.com',
  phone: '+1 (555) 123-4567',
  avatar: null,
  joinedAt: '2024-01-01',
  totalRooms: 3,
  activeInvites: 1
}

function AdminSettings() {
  const [notifications, setNotifications] = useState({
    newInvites: true,
    attendanceAlerts: true,
    dailySummary: false,
    missedAttendance: true
  })
  
  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
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
          <div className="w-16 h-16 rounded-full bg-charcoal-500 flex items-center justify-center">
            <span className="text-xl text-gray-400">
              {adminData.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-medium">{adminData.name}</h4>
            <p className="text-gray-500 text-sm">{adminData.email}</p>
          </div>
          <button className="p-2 rounded-lg bg-charcoal-500/50 hover:bg-charcoal-500 transition-colors">
            <Icon name="edit" className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-charcoal-500">
            <span className="text-gray-400 text-sm">Email</span>
            <span className="text-white text-sm">{adminData.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-charcoal-500">
            <span className="text-gray-400 text-sm">Phone</span>
            <span className="text-white text-sm">{adminData.phone}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Admin Since</span>
            <span className="text-white text-sm">
              {new Date(adminData.joinedAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </Card>
      
      {/* Stats */}
      <Card>
        <h3 className="text-white font-medium mb-4">Admin Stats</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-charcoal-500/30 text-center">
            <p className="text-accent text-2xl font-bold">{adminData.totalRooms}</p>
            <p className="text-gray-500 text-xs mt-1">Rooms Managing</p>
          </div>
          <div className="p-4 rounded-lg bg-charcoal-500/30 text-center">
            <p className="text-white text-2xl font-bold">{adminData.activeInvites}</p>
            <p className="text-gray-500 text-xs mt-1">Pending Invites</p>
          </div>
        </div>
      </Card>
      
      {/* Notifications */}
      <Card>
        <h3 className="text-white font-medium mb-4">Notifications</h3>
        
        <div className="space-y-4">
          {/* New Invites */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm">New Room Invites</p>
              <p className="text-gray-500 text-xs">Get notified when you receive a new invite</p>
            </div>
            <button
              onClick={() => toggleNotification('newInvites')}
              className={`
                w-12 h-6 rounded-full transition-all duration-200 relative
                ${notifications.newInvites ? 'bg-accent' : 'bg-charcoal-500'}
              `}
            >
              <div className={`
                absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200
                ${notifications.newInvites ? 'left-7' : 'left-1'}
              `} />
            </button>
          </div>
          
          {/* Attendance Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm">Attendance Alerts</p>
              <p className="text-gray-500 text-xs">Get notified when users mark attendance</p>
            </div>
            <button
              onClick={() => toggleNotification('attendanceAlerts')}
              className={`
                w-12 h-6 rounded-full transition-all duration-200 relative
                ${notifications.attendanceAlerts ? 'bg-accent' : 'bg-charcoal-500'}
              `}
            >
              <div className={`
                absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200
                ${notifications.attendanceAlerts ? 'left-7' : 'left-1'}
              `} />
            </button>
          </div>
          
          {/* Missed Attendance */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm">Missed Attendance</p>
              <p className="text-gray-500 text-xs">Get notified when users miss attendance</p>
            </div>
            <button
              onClick={() => toggleNotification('missedAttendance')}
              className={`
                w-12 h-6 rounded-full transition-all duration-200 relative
                ${notifications.missedAttendance ? 'bg-accent' : 'bg-charcoal-500'}
              `}
            >
              <div className={`
                absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200
                ${notifications.missedAttendance ? 'left-7' : 'left-1'}
              `} />
            </button>
          </div>
          
          {/* Daily Summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm">Daily Summary</p>
              <p className="text-gray-500 text-xs">Receive end-of-day summary for all rooms</p>
            </div>
            <button
              onClick={() => toggleNotification('dailySummary')}
              className={`
                w-12 h-6 rounded-full transition-all duration-200 relative
                ${notifications.dailySummary ? 'bg-accent' : 'bg-charcoal-500'}
              `}
            >
              <div className={`
                absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200
                ${notifications.dailySummary ? 'left-7' : 'left-1'}
              `} />
            </button>
          </div>
        </div>
      </Card>
      
      {/* Quick Actions */}
      <Card>
        <h3 className="text-white font-medium mb-4">Quick Actions</h3>
        
        <div className="space-y-2">
          <Link 
            to="/admin/join"
            className="flex items-center justify-between p-3 rounded-lg bg-charcoal-500/30 
                     hover:bg-charcoal-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Icon name="plus" className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-white text-sm">Accept New Invite</p>
                <p className="text-gray-500 text-xs">Enter a code to join a new room</p>
              </div>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 text-gray-500 group-hover:text-gray-300" />
          </Link>
          
          <Link 
            to="/admin/rooms"
            className="flex items-center justify-between p-3 rounded-lg bg-charcoal-500/30 
                     hover:bg-charcoal-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-charcoal-500 flex items-center justify-center">
                <Icon name="rooms" className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-white text-sm">View All Rooms</p>
                <p className="text-gray-500 text-xs">See all rooms you manage</p>
              </div>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 text-gray-500 group-hover:text-gray-300" />
          </Link>
        </div>
      </Card>
      
      {/* Switch to User Mode */}
      <Card className="border-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Icon name="user" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-white text-sm">Switch to User Mode</p>
              <p className="text-gray-500 text-xs">Go back to your personal rooms</p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="secondary" size="sm">
              Switch
            </Button>
          </Link>
        </div>
      </Card>
      
      {/* Danger Zone */}
      <Card className="border-red-500/20">
        <h3 className="text-red-400 font-medium mb-4">Danger Zone</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm">Leave All Rooms</p>
            <p className="text-gray-500 text-xs">
              Remove yourself as admin from all rooms
            </p>
          </div>
          <Button variant="danger" size="sm">
            Leave All
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default AdminSettings
