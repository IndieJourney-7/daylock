/**
 * ConsequenceTracker - Escalating consequences management
 * Phase 2: Admin Authority System
 */

import { useState } from 'react'
import { Icon, Button } from '../ui'
import { CONSEQUENCE_LEVELS, getNextConsequenceLevel, getConsequenceSummary } from '../../lib/adminAuthority'

// ============ ESCALATION BAR ============

export function EscalationBar({ consequences = [] }) {
  const summary = getConsequenceSummary(consequences)
  const levels = Object.entries(CONSEQUENCE_LEVELS)
  
  return (
    <div className="flex items-center gap-1">
      {levels.map(([key, config], i) => {
        const isActive = summary.active.some(c => c.level === key)
        const isResolved = summary.resolved.some(c => c.level === key)
        
        return (
          <div
            key={key}
            className={`
              flex-1 h-2 rounded-full transition-all
              ${isActive ? config.bg.replace('/10', '/60') : isResolved ? 'bg-charcoal-500/50' : 'bg-charcoal-600/30'}
              ${isActive ? `border ${config.border}` : ''}
            `}
            title={`${config.label}: ${isActive ? 'Active' : isResolved ? 'Resolved' : 'Not issued'}`}
          />
        )
      })}
    </div>
  )
}

// ============ CONSEQUENCE CARD ============

function ConsequenceCard({ consequence, onResolve }) {
  const config = CONSEQUENCE_LEVELS[consequence.level] || CONSEQUENCE_LEVELS.warning
  const isActive = consequence.active
  const dateStr = new Date(consequence.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  
  return (
    <div className={`p-3 rounded-xl border ${isActive ? config.border : 'border-charcoal-400/10'} ${isActive ? config.bg : 'bg-charcoal-500/10 opacity-60'}`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
          <span className="text-sm">{config.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
            {!isActive && <span className="text-[10px] text-gray-500">Resolved</span>}
          </div>
          <p className="text-white text-sm mt-0.5">{consequence.reason}</p>
          {consequence.notes && (
            <p className="text-gray-500 text-xs mt-0.5">{consequence.notes}</p>
          )}
          <p className="text-gray-600 text-[10px] mt-1">{dateStr}</p>
        </div>
        {isActive && onResolve && (
          <button
            onClick={() => onResolve(consequence.id)}
            className="text-xs px-2.5 py-1 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-gray-400 hover:text-accent hover:border-accent/20 transition-colors flex-shrink-0"
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  )
}

// ============ ISSUE CONSEQUENCE FORM ============

export function IssueConsequenceForm({ suggestedLevel, onSubmit, isLoading }) {
  const [level, setLevel] = useState(suggestedLevel || 'warning')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [expiryDays, setExpiryDays] = useState('')
  const [showForm, setShowForm] = useState(false)
  
  const levels = Object.entries(CONSEQUENCE_LEVELS)

  const handleSubmit = () => {
    if (!reason.trim()) return
    const expires_at = expiryDays 
      ? new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString()
      : undefined
    
    onSubmit({
      level,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      expires_at
    })
    setReason('')
    setNotes('')
    setExpiryDays('')
    setShowForm(false)
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-charcoal-400/20 text-gray-500 hover:text-white hover:border-accent/30 transition-colors"
      >
        <Icon name="plus" className="w-4 h-4" />
        <span className="text-xs">Issue Consequence</span>
      </button>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 space-y-3">
      <p className="text-white text-sm font-medium">Issue Consequence</p>
      
      {/* Level selector */}
      <div>
        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1.5">Level</p>
        <div className="flex flex-wrap gap-1.5">
          {levels.map(([key, config]) => (
            <button
              key={key}
              onClick={() => setLevel(key)}
              className={`
                text-xs px-2.5 py-1.5 rounded-lg border transition-all
                ${level === key ? `${config.bg} ${config.border} ${config.color}` : 'bg-charcoal-500/20 border-charcoal-400/10 text-gray-500'}
              `}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Reason */}
      <div>
        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1.5">Reason *</p>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this consequence being issued?"
          className="w-full px-3 py-2 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent/30"
        />
      </div>
      
      {/* Notes */}
      <div>
        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1.5">Notes (optional)</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Additional context..."
          className="w-full px-3 py-2 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent/30 resize-none"
        />
      </div>
      
      {/* Expiry */}
      <div>
        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1.5">Expires in (days, optional)</p>
        <input
          type="number"
          min="1"
          value={expiryDays}
          onChange={(e) => setExpiryDays(e.target.value)}
          placeholder="e.g. 7"
          className="w-32 px-3 py-2 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent/30"
        />
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit} size="sm" disabled={!reason.trim() || isLoading} className="flex-1">
          {isLoading ? 'Issuing...' : 'Issue Consequence'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
      </div>
    </div>
  )
}

// ============ CONSEQUENCE TRACKER (Full) ============

export function ConsequenceTracker({ consequences = [], onIssue, onResolve, isLoading }) {
  const summary = getConsequenceSummary(consequences)
  const suggestedLevel = getNextConsequenceLevel(consequences)

  return (
    <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Discipline Record</p>
        {summary.highest && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${summary.highest.bg} ${summary.highest.color}`}>
            {summary.highest.icon} {summary.highest.label}
          </span>
        )}
      </div>
      
      {/* Escalation bar */}
      <EscalationBar consequences={consequences} />
      
      {/* Stats */}
      <div className="flex gap-4 text-center">
        <div>
          <p className="text-white font-bold text-sm">{summary.active.length}</p>
          <p className="text-gray-500 text-[10px]">Active</p>
        </div>
        <div>
          <p className="text-gray-400 font-bold text-sm">{summary.resolved.length}</p>
          <p className="text-gray-500 text-[10px]">Resolved</p>
        </div>
        <div>
          <p className="text-gray-400 font-bold text-sm">{summary.total}</p>
          <p className="text-gray-500 text-[10px]">Total</p>
        </div>
      </div>
      
      {/* Active consequences */}
      {summary.active.length > 0 && (
        <div className="space-y-2">
          {summary.active.map(c => (
            <ConsequenceCard key={c.id} consequence={c} onResolve={onResolve} />
          ))}
        </div>
      )}
      
      {/* Resolved (collapsed) */}
      {summary.resolved.length > 0 && (
        <details className="group">
          <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-300 transition-colors">
            {summary.resolved.length} resolved consequence{summary.resolved.length > 1 ? 's' : ''}
          </summary>
          <div className="space-y-2 mt-2">
            {summary.resolved.map(c => (
              <ConsequenceCard key={c.id} consequence={c} />
            ))}
          </div>
        </details>
      )}
      
      {/* Issue new */}
      {onIssue && (
        <IssueConsequenceForm 
          suggestedLevel={suggestedLevel} 
          onSubmit={onIssue} 
          isLoading={isLoading} 
        />
      )}
    </div>
  )
}

// ============ CONSEQUENCE BADGE (compact) ============

export function ConsequenceBadge({ consequences = [] }) {
  const summary = getConsequenceSummary(consequences)
  if (!summary.highest || summary.active.length === 0) return null
  
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${summary.highest.bg} ${summary.highest.color}`}>
      {summary.highest.icon} {summary.active.length}
    </span>
  )
}

export default ConsequenceTracker
