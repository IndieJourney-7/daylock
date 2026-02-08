/**
 * Admin Room Detail
 * Manage room rules, timings, and approve user's proof of work
 */

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../../components/ui'

// Mock room data assigned by user
const roomData = {
  id: 'room_1',
  name: 'Gym',
  emoji: '🏋️',
  status: 'open',
  assignedBy: { 
    id: 'user_1',
    name: 'John Doe', 
    email: 'john@email.com', 
    avatar: null
  },
  inviteCode: 'GYM-X4K9',
  assignedAt: '2024-01-15',
  timeWindow: {
    start: '06:00',
    end: '07:00'
  },
  rules: [
    { id: 1, text: 'Must wear proper gym attire', enabled: true },
    { id: 2, text: 'Minimum 30 minutes workout', enabled: true },
    { id: 3, text: 'Photo proof must show equipment', enabled: false },
  ],
  stats: {
    streak: 12,
    longestStreak: 21,
    attendanceRate: 92,
    totalDays: 45,
    approvedDays: 41,
    rejectedDays: 2,
    missedDays: 2
  }
}

// Mock pending proofs to approve
const pendingProofs = [
  {
    id: 'proof_1',
    date: '2024-01-20',
    uploadedAt: '2024-01-20T06:32:00',
    imageUrl: '/proof1.jpg',
    note: 'Morning leg workout completed!',
    status: 'pending'
  },
  {
    id: 'proof_2',
    date: '2024-01-19',
    uploadedAt: '2024-01-19T06:45:00',
    imageUrl: '/proof2.jpg',
    note: 'Cardio session done',
    status: 'pending'
  }
]

// Mock attendance history
const attendanceHistory = [
  { date: '2024-01-18', status: 'approved', proof: '/proof3.jpg', time: '6:15 AM' },
  { date: '2024-01-17', status: 'approved', proof: '/proof4.jpg', time: '6:45 AM' },
  { date: '2024-01-16', status: 'rejected', proof: '/proof5.jpg', time: '6:22 AM', reason: 'Proof unclear' },
  { date: '2024-01-15', status: 'approved', proof: '/proof6.jpg', time: '6:55 AM' },
  { date: '2024-01-14', status: 'missed', proof: null, time: null },
]

const TABS = [
  { id: 'proofs', label: 'Proofs', icon: 'camera' },
  { id: 'rules', label: 'Rules', icon: 'list' },
  { id: 'history', label: 'History', icon: 'calendar' },
]

function AdminRoomDetail() {
  const { roomId } = useParams()
  const [activeTab, setActiveTab] = useState('proofs')
  const [rules, setRules] = useState(roomData.rules)
  const [newRule, setNewRule] = useState('')
  const [timeWindow, setTimeWindow] = useState(roomData.timeWindow)
  const [proofs, setProofs] = useState(pendingProofs)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProof, setSelectedProof] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  
  // Toggle rule
  const toggleRule = (ruleId) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ))
  }
  
  // Add new rule
  const addRule = () => {
    if (!newRule.trim()) return
    const newId = Math.max(...rules.map(r => r.id), 0) + 1
    setRules([...rules, { id: newId, text: newRule.trim(), enabled: true }])
    setNewRule('')
  }
  
  // Delete rule
  const deleteRule = (ruleId) => {
    setRules(rules.filter(r => r.id !== ruleId))
  }
  
  // Approve proof
  const approveProof = (proofId) => {
    setProofs(proofs.filter(p => p.id !== proofId))
    setSelectedProof(null)
  }
  
  // Reject proof
  const rejectProof = (proofId) => {
    setProofs(proofs.filter(p => p.id !== proofId))
    setSelectedProof(null)
    setRejectReason('')
  }
  
  // Save changes
  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }
  
  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  
  // Format time
  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/rooms" 
            className="p-2 rounded-lg bg-charcoal-500/50 hover:bg-charcoal-500 transition-colors"
          >
            <Icon name="chevronLeft" className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className={`
              w-14 h-14 rounded-xl flex items-center justify-center text-2xl
              ${roomData.status === 'open' ? 'bg-accent/20' : 'bg-charcoal-500/50'}
            `}>
              {roomData.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{roomData.name}</h1>
                <Badge variant={roomData.status === 'open' ? 'open' : 'locked'}>
                  {roomData.status}
                </Badge>
              </div>
              <p className="text-gray-500 text-sm">
                {roomData.timeWindow.start} - {roomData.timeWindow.end}
              </p>
            </div>
          </div>
        </div>
        
        {proofs.length > 0 && (
          <Badge variant="warning">
            {proofs.length} pending
          </Badge>
        )}
      </div>
      
      {/* Assigned By Card */}
      <Card padding="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-charcoal-500 flex items-center justify-center">
              <span className="text-sm text-gray-400">
                {roomData.assignedBy.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Assigned by</p>
              <p className="text-white font-medium">{roomData.assignedBy.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Invite Code</p>
            <p className="text-accent font-mono text-sm">{roomData.inviteCode}</p>
          </div>
        </div>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="text-center py-3">
          <p className="text-accent text-xl font-bold">{roomData.stats.streak}</p>
          <p className="text-gray-500 text-[10px]">Streak</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-white text-xl font-bold">{roomData.stats.attendanceRate}%</p>
          <p className="text-gray-500 text-[10px]">Rate</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-accent text-xl font-bold">{roomData.stats.approvedDays}</p>
          <p className="text-gray-500 text-[10px]">Approved</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-red-400 text-xl font-bold">{roomData.stats.missedDays}</p>
          <p className="text-gray-500 text-[10px]">Missed</p>
        </Card>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-charcoal-500/30">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm
              transition-all duration-200 relative
              ${activeTab === tab.id
                ? 'bg-charcoal-500 text-white'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            <Icon name={tab.icon} className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.id === 'proofs' && proofs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 text-charcoal-900 text-xs flex items-center justify-center font-bold">
                {proofs.length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Proofs Tab - Approve/Reject */}
      {activeTab === 'proofs' && (
        <div className="space-y-4">
          {proofs.length > 0 ? (
            <>
              <p className="text-gray-400 text-sm">
                Review proof uploads from {roomData.assignedBy.name}
              </p>
              
              {proofs.map((proof) => (
                <Card key={proof.id} className="border-yellow-500/20">
                  <div className="space-y-4">
                    {/* Proof Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{formatDate(proof.date)}</p>
                        <p className="text-gray-500 text-xs">
                          Uploaded at {formatTime(proof.uploadedAt)}
                        </p>
                      </div>
                      <Badge variant="warning">Pending Review</Badge>
                    </div>
                    
                    {/* Proof Image Placeholder */}
                    <div className="aspect-video rounded-lg bg-charcoal-500/50 flex items-center justify-center border border-charcoal-500">
                      <div className="text-center">
                        <Icon name="camera" className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Proof Image</p>
                        <p className="text-gray-600 text-xs">{proof.imageUrl}</p>
                      </div>
                    </div>
                    
                    {/* User Note */}
                    {proof.note && (
                      <div className="p-3 rounded-lg bg-charcoal-500/30">
                        <p className="text-gray-400 text-xs mb-1">User's Note:</p>
                        <p className="text-white text-sm">{proof.note}</p>
                      </div>
                    )}
                    
                    {/* Active Rules */}
                    <div className="p-3 rounded-lg bg-charcoal-500/20">
                      <p className="text-gray-400 text-xs mb-2">Check against rules:</p>
                      <div className="space-y-1">
                        {rules.filter(r => r.enabled).map(rule => (
                          <div key={rule.id} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-gray-500 flex items-center justify-center">
                              <Icon name="check" className="w-2.5 h-2.5 text-gray-500" />
                            </div>
                            <span className="text-gray-400 text-xs">{rule.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => approveProof(proof.id)}
                        className="flex-1"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Icon name="check" className="w-4 h-4" />
                          Approve
                        </span>
                      </Button>
                      <Button 
                        variant="danger"
                        onClick={() => setSelectedProof(proof.id)}
                        className="flex-1"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Icon name="close" className="w-4 h-4" />
                          Reject
                        </span>
                      </Button>
                    </div>
                    
                    {/* Reject Reason Input */}
                    {selectedProof === proof.id && (
                      <div className="space-y-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <input
                          type="text"
                          placeholder="Reason for rejection (optional)..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-charcoal-500/50 border border-charcoal-500
                                   text-white placeholder-gray-500 text-sm
                                   focus:outline-none focus:border-red-500/50"
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => rejectProof(proof.id)}
                            className="flex-1"
                          >
                            Confirm Reject
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => {
                              setSelectedProof(null)
                              setRejectReason('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </>
          ) : (
            <Card className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="check" className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-white font-medium mb-2">All caught up!</h3>
              <p className="text-gray-500 text-sm">
                No pending proofs to review
              </p>
            </Card>
          )}
        </div>
      )}
      
      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Time Window */}
          <Card>
            <h3 className="text-white font-medium mb-4">Time Window</h3>
            <p className="text-gray-500 text-sm mb-4">
              Set when {roomData.assignedBy.name.split(' ')[0]} can mark attendance
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 text-xs mb-2">Opens At</label>
                <input
                  type="time"
                  value={timeWindow.start}
                  onChange={(e) => setTimeWindow({ ...timeWindow, start: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-charcoal-500/50 border border-charcoal-500
                           text-white text-sm focus:outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-2">Closes At</label>
                <input
                  type="time"
                  value={timeWindow.end}
                  onChange={(e) => setTimeWindow({ ...timeWindow, end: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-charcoal-500/50 border border-charcoal-500
                           text-white text-sm focus:outline-none focus:border-accent/50"
                />
              </div>
            </div>
          </Card>
          
          {/* Rules List */}
          <Card>
            <h3 className="text-white font-medium mb-2">Attendance Rules</h3>
            <p className="text-gray-500 text-sm mb-4">
              Rules user must follow when uploading proof
            </p>
            
            <div className="space-y-3 mb-4">
              {rules.map(rule => (
                <div 
                  key={rule.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-all
                    ${rule.enabled 
                      ? 'bg-charcoal-500/50 border-charcoal-500' 
                      : 'bg-charcoal-700/30 border-charcoal-600/50'
                    }
                  `}
                >
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                      transition-all
                      ${rule.enabled 
                        ? 'bg-accent border-accent' 
                        : 'border-gray-500 hover:border-gray-400'
                      }
                    `}
                  >
                    {rule.enabled && (
                      <Icon name="check" className="w-3 h-3 text-charcoal-900" />
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${rule.enabled ? 'text-white' : 'text-gray-500'}`}>
                    {rule.text}
                  </span>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Icon name="close" className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {rules.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No rules added yet
                </p>
              )}
            </div>
            
            {/* Add New Rule */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new rule..."
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRule()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-charcoal-500/50 border border-charcoal-500
                         text-white placeholder-gray-500 text-sm
                         focus:outline-none focus:border-accent/50"
              />
              <Button onClick={addRule} size="sm" disabled={!newRule.trim()}>
                Add
              </Button>
            </div>
          </Card>
          
          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
      
      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-white font-medium mb-4">Attendance History</h3>
            
            <div className="space-y-2">
              {attendanceHistory.map((entry, index) => (
                <div 
                  key={index}
                  className={`
                    flex items-center justify-between p-3 rounded-lg
                    ${entry.status === 'approved' 
                      ? 'bg-accent/10 border border-accent/20' 
                      : entry.status === 'rejected'
                      ? 'bg-yellow-500/10 border border-yellow-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${entry.status === 'approved' ? 'bg-accent/20' 
                        : entry.status === 'rejected' ? 'bg-yellow-500/20'
                        : 'bg-red-500/20'
                      }
                    `}>
                      <Icon 
                        name={entry.status === 'approved' ? 'check' : entry.status === 'rejected' ? 'history' : 'close'}
                        className={`w-5 h-5 ${
                          entry.status === 'approved' ? 'text-accent' 
                          : entry.status === 'rejected' ? 'text-yellow-400'
                          : 'text-red-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium">{formatDate(entry.date)}</p>
                      <p className="text-gray-500 text-xs">
                        {entry.status === 'approved' 
                          ? `Approved - ${entry.time}`
                          : entry.status === 'rejected'
                          ? `Rejected: ${entry.reason}`
                          : 'No proof uploaded'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {entry.proof && (
                      <button className="p-2 rounded-lg bg-charcoal-500/50 hover:bg-charcoal-500 transition-colors">
                        <Icon name="camera" className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    <Badge variant={
                      entry.status === 'approved' ? 'success' 
                      : entry.status === 'rejected' ? 'warning' 
                      : 'danger'
                    }>
                      {entry.status === 'approved' ? 'Approved' 
                       : entry.status === 'rejected' ? 'Rejected' 
                       : 'Missed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <Card className="text-center py-3">
              <p className="text-white font-bold">{roomData.stats.totalDays}</p>
              <p className="text-gray-500 text-xs">Total</p>
            </Card>
            <Card className="text-center py-3">
              <p className="text-accent font-bold">{roomData.stats.approvedDays}</p>
              <p className="text-gray-500 text-xs">Approved</p>
            </Card>
            <Card className="text-center py-3">
              <p className="text-yellow-400 font-bold">{roomData.stats.rejectedDays}</p>
              <p className="text-gray-500 text-xs">Rejected</p>
            </Card>
            <Card className="text-center py-3">
              <p className="text-red-400 font-bold">{roomData.stats.missedDays}</p>
              <p className="text-gray-500 text-xs">Missed</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRoomDetail
