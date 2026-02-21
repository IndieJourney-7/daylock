/**
 * RoomReminderSettings Component
 * Per-room reminder configuration with preset + custom timing options.
 * Shows as an expandable card on the RoomDetail page.
 */

import { useState, useEffect } from 'react'
import { useRoomReminders } from '../../hooks'
import { remindersService, REMINDER_PRESETS } from '../../lib/reminders'

function RoomReminderSettings({ roomId, roomName, roomEmoji }) {
  const { reminders, loading, setReminders } = useRoomReminders(roomId)
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState([])
  const [customMinutes, setCustomMinutes] = useState('')
  const [saving, setSaving] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState('default')

  // Sync selected from DB data
  useEffect(() => {
    if (reminders && reminders.length > 0) {
      setSelected(reminders.map(r => r.minutes_before))
    }
  }, [reminders])

  // Check notification permission
  useEffect(() => {
    if (remindersService.isSupported()) {
      setPermissionStatus(Notification.permission)
    } else {
      setPermissionStatus('unsupported')
    }
  }, [])

  const handleRequestPermission = async () => {
    const result = await remindersService.requestPermission()
    setPermissionStatus(result)
  }

  const togglePreset = (minutes) => {
    setSelected(prev =>
      prev.includes(minutes)
        ? prev.filter(m => m !== minutes)
        : [...prev, minutes].sort((a, b) => a - b)
    )
  }

  const addCustom = () => {
    const min = parseInt(customMinutes)
    if (!min || min < 1 || min > 1440) return
    if (!selected.includes(min)) {
      setSelected(prev => [...prev, min].sort((a, b) => a - b))
    }
    setCustomMinutes('')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setReminders(selected)
    } catch (err) {
      console.error('Failed to save reminders:', err)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = (() => {
    const current = (reminders || []).map(r => r.minutes_before).sort((a, b) => a - b)
    const next = [...selected].sort((a, b) => a - b)
    return JSON.stringify(current) !== JSON.stringify(next)
  })()

  const activeCount = reminders?.filter(r => r.enabled)?.length || 0

  return (
    <div className="rounded-xl border border-charcoal-400/20 bg-charcoal-500/20 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-charcoal-500/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
            <span className="text-lg">🔔</span>
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-medium">Room Reminders</p>
            <p className="text-gray-500 text-xs">
              {activeCount > 0
                ? `${activeCount} alert${activeCount > 1 ? 's' : ''} set`
                : 'No alerts configured'}
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-charcoal-400/10 pt-4 space-y-4">
          {/* Permission check */}
          {permissionStatus === 'unsupported' && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
              <p className="text-yellow-400 text-xs">
                Your browser doesn't support notifications
              </p>
            </div>
          )}

          {permissionStatus === 'denied' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              <p className="text-red-400 text-xs">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          )}

          {permissionStatus === 'default' && (
            <button
              onClick={handleRequestPermission}
              className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              🔔 Enable Notifications
            </button>
          )}

          {/* Preset options */}
          {permissionStatus !== 'unsupported' && permissionStatus !== 'denied' && (
            <>
              <div>
                <p className="text-gray-400 text-xs font-medium mb-2">Alert me before room opens</p>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_PRESETS.map(preset => {
                    const isSelected = selected.includes(preset.value)
                    return (
                      <button
                        key={preset.value}
                        onClick={() => togglePreset(preset.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                          isSelected
                            ? 'bg-green-600 border-green-500 text-white'
                            : 'bg-charcoal-500/30 border-charcoal-400/20 text-gray-400 hover:border-charcoal-400/40 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom minutes input */}
              <div>
                <p className="text-gray-400 text-xs font-medium mb-2">Custom timing</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={customMinutes}
                    onChange={e => setCustomMinutes(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustom()}
                    placeholder="e.g. 45"
                    className="w-24 bg-charcoal-500/50 border border-charcoal-400/20 rounded-lg px-3 py-1.5 text-white text-sm text-center placeholder-gray-600 focus:outline-none focus:border-green-500/50"
                  />
                  <span className="text-gray-500 text-xs self-center">minutes before</span>
                  <button
                    onClick={addCustom}
                    disabled={!customMinutes || parseInt(customMinutes) < 1}
                    className="px-3 py-1.5 bg-charcoal-500/30 hover:bg-charcoal-500/50 border border-charcoal-400/20 rounded-lg text-white text-xs disabled:opacity-30 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Selected reminders summary */}
              {selected.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-2">Active alerts</p>
                  <div className="space-y-1.5">
                    {selected.map(min => (
                      <div
                        key={min}
                        className="flex items-center justify-between bg-charcoal-500/30 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 text-xs">🔔</span>
                          <span className="text-white text-sm">
                            {remindersService.formatReminder(min)}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelected(prev => prev.filter(m => m !== min))}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save button */}
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Reminders'}
                </button>
              )}

              {/* Info note */}
              <p className="text-gray-600 text-[10px] text-center">
                Alerts work while the app is open in your browser. Keep a tab open to receive reminders.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default RoomReminderSettings
