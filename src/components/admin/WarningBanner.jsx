/**
 * WarningBanner - Auto-detected & manual warning display
 * Phase 2: Admin Authority System
 */

import { useState } from 'react'
import { Card, Icon, Button } from '../ui'

// Severity config
const SEVERITY_CONFIG = {
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'info' },
  warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: 'alertCircle' },
  strike: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: 'close' },
  probation: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'alertCircle' }
}

// ============ SINGLE WARNING ITEM ============

function WarningItem({ warning, onDismiss, onSend, compact = false }) {
  const config = SEVERITY_CONFIG[warning.severity] || SEVERITY_CONFIG.warning
  const message = warning.message || warning.trigger?.message?.(warning.value) || 'Warning detected'
  
  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg ${config.bg} border ${config.border}`}>
        <Icon name={config.icon} className={`w-3.5 h-3.5 ${config.color} flex-shrink-0`} />
        <span className="text-xs text-gray-300 flex-1 truncate">{message}</span>
        {onSend && (
          <button onClick={() => onSend(warning)} className="text-[10px] text-accent hover:underline flex-shrink-0">
            Send
          </button>
        )}
        {onDismiss && (
          <button onClick={() => onDismiss(warning)} className="text-gray-600 hover:text-gray-400 flex-shrink-0">
            <Icon name="close" className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`p-3 rounded-xl ${config.bg} border ${config.border} space-y-2`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon name={config.icon} className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium uppercase tracking-wider ${config.color}`}>
              {warning.severity || 'warning'}
            </span>
            {warning.type === 'auto' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-charcoal-500/50 text-gray-500">Auto</span>
            )}
          </div>
          <p className="text-white text-sm mt-1">{message}</p>
          {warning.trigger?.label && (
            <p className="text-gray-500 text-xs mt-0.5">Trigger: {warning.trigger.label}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-10">
        {onSend && (
          <button 
            onClick={() => onSend(warning)}
            className="text-xs px-3 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors"
          >
            Send to User
          </button>
        )}
        {onDismiss && (
          <button 
            onClick={() => onDismiss(warning)}
            className="text-xs px-3 py-1 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-gray-400 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

// ============ WARNING BANNER ============

export function WarningBanner({ detectedWarnings = [], storedWarnings = [], onDismiss, onSend }) {
  const [expanded, setExpanded] = useState(false)
  
  const allWarnings = [
    ...detectedWarnings.map(w => ({ ...w, type: 'auto', id: w.trigger?.id || Math.random() })),
    ...storedWarnings.filter(w => w.active)
  ]
  
  if (allWarnings.length === 0) return null
  
  const displayWarnings = expanded ? allWarnings : allWarnings.slice(0, 2)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="alertCircle" className="w-4 h-4 text-yellow-400" />
          <p className="text-yellow-400 text-xs font-medium">
            {allWarnings.length} Active Warning{allWarnings.length > 1 ? 's' : ''}
          </p>
        </div>
        {allWarnings.length > 2 && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
          >
            {expanded ? 'Show Less' : `+${allWarnings.length - 2} more`}
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {displayWarnings.map((warning, i) => (
          <WarningItem 
            key={warning.id || i} 
            warning={warning} 
            onDismiss={onDismiss} 
            onSend={onSend}
          />
        ))}
      </div>
    </div>
  )
}

// ============ WARNING ALERT (compact for dashboard) ============

export function WarningAlert({ count, onClick }) {
  if (!count || count === 0) return null
  
  return (
    <button onClick={onClick} className="w-full text-left">
      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/15 hover:bg-yellow-500/10 transition-colors">
        <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <Icon name="alertCircle" className="w-3.5 h-3.5 text-yellow-400" />
        </div>
        <span className="text-yellow-400 text-xs font-medium">{count} warning{count > 1 ? 's' : ''}</span>
      </div>
    </button>
  )
}

// ============ SEND WARNING MODAL ============

export function SendWarningModal({ warning, onConfirm, onCancel, isLoading }) {
  const [severity, setSeverity] = useState(warning?.severity || 'warning')
  const [message, setMessage] = useState(warning?.message || '')

  const severities = [
    { id: 'info', label: 'Info', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { id: 'warning', label: 'Warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { id: 'strike', label: 'Strike', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    { id: 'probation', label: 'Probation', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div 
        className="w-full max-w-md bg-charcoal-800 border border-charcoal-400/20 rounded-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Icon name="alertCircle" className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-medium">Send Warning</h3>
        </div>

        {/* Severity selector */}
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Severity</p>
          <div className="grid grid-cols-4 gap-1.5">
            {severities.map(s => (
              <button
                key={s.id}
                onClick={() => setSeverity(s.id)}
                className={`
                  py-1.5 px-2 rounded-lg text-xs font-medium border transition-all
                  ${severity === s.id ? s.bg + ' ' + s.color : 'bg-charcoal-500/20 border-charcoal-400/10 text-gray-500'}
                `}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1.5">Message</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Warning message to user..."
            className="w-full px-3 py-2 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500/30 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button onClick={() => onConfirm({ severity, message })} className="flex-1" size="sm" disabled={!message.trim() || isLoading}>
            {isLoading ? 'Sending...' : 'Send Warning'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

export default WarningBanner
