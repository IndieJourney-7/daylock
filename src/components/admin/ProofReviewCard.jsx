/**
 * ProofReviewCard - Enhanced proof review with quality rating and feedback
 * Phase 2: Admin Authority System
 */

import { useState } from 'react'
import { Card, Badge, Icon, Button } from '../ui'
import { QUALITY_LEVELS, getQualityLevel, FEEDBACK_TEMPLATES } from '../../lib/adminAuthority'

// ============ STAR RATING (Interactive) ============

export function StarRating({ value, onChange, size = 'md' }) {
  const [hoverValue, setHoverValue] = useState(0)
  const display = hoverValue || value || 0
  const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  const quality = display > 0 ? getQualityLevel(display) : null

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star === value ? 0 : star)}
            className={`${sizeClass} transition-all duration-150 ${
              star <= display
                ? 'text-yellow-400 scale-110'
                : 'text-gray-600 hover:text-gray-500'
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {quality && (
        <span className={`text-xs ml-1.5 ${quality.color}`}>
          {quality.emoji} {quality.label}
        </span>
      )}
    </div>
  )
}

// ============ STAR DISPLAY (Read-only) ============

export function StarDisplay({ rating, size = 'sm' }) {
  if (!rating) return null
  const quality = getQualityLevel(rating)
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={`${sizeClass} ${star <= rating ? 'text-yellow-400' : 'text-gray-700'}`}>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </span>
      ))}
      <span className={`text-[10px] ml-1 ${quality.color}`}>{quality.label}</span>
    </div>
  )
}

// ============ FEEDBACK TEMPLATES ============

function FeedbackTemplatesPanel({ type, onSelect }) {
  const templates = FEEDBACK_TEMPLATES[type] || []
  
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {templates.map((template, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(template)}
          className="text-[11px] px-2.5 py-1 rounded-full bg-charcoal-500/30 border border-charcoal-400/10 text-gray-400 hover:text-white hover:border-accent/30 transition-all"
        >
          {template}
        </button>
      ))}
    </div>
  )
}

// ============ PROOF REVIEW CARD ============

export default function ProofReviewCard({ 
  proof, 
  rules = [], 
  onApprove, 
  onReject, 
  onImageClick,
  formatDate,
  formatTime 
}) {
  const [qualityRating, setQualityRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onApprove(proof.id, {
        quality_rating: qualityRating || undefined,
        admin_feedback: feedback || undefined
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      await onReject(proof.id, feedback || 'Rejected', {
        quality_rating: qualityRating || undefined,
        admin_feedback: feedback || undefined
      })
    } finally {
      setIsSubmitting(false)
      setShowRejectConfirm(false)
    }
  }

  const enabledRules = rules.filter(r => r.enabled)

  return (
    <div className="p-4 rounded-xl bg-charcoal-500/20 border border-yellow-500/15 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium text-sm">{formatDate?.(proof.date) || proof.date}</p>
          <p className="text-gray-500 text-xs">Uploaded {formatTime?.(proof.submitted_at) || ''}</p>
        </div>
        <Badge variant="warning" size="sm">Pending</Badge>
      </div>

      {/* Proof Image */}
      {proof.proof_url ? (
        <button 
          onClick={() => onImageClick?.(proof.proof_url)}
          className="w-full aspect-video rounded-xl overflow-hidden bg-charcoal-500/30 hover:opacity-90 transition-opacity"
        >
          <img src={proof.proof_url} alt="Proof" className="w-full h-full object-cover" />
        </button>
      ) : (
        <div className="aspect-video rounded-xl bg-charcoal-500/30 border border-charcoal-400/10 flex items-center justify-center">
          <div className="text-center">
            <Icon name="image" className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">No image</p>
          </div>
        </div>
      )}

      {/* Note */}
      {proof.note && (
        <div className="p-3 rounded-lg bg-charcoal-500/30">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Note</p>
          <p className="text-white text-sm">{proof.note}</p>
        </div>
      )}

      {/* Rules checklist */}
      {enabledRules.length > 0 && (
        <div className="p-3 rounded-lg bg-charcoal-500/10 border border-charcoal-400/5">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Check Against Rules</p>
          <div className="space-y-1.5">
            {enabledRules.map(rule => (
              <div key={rule.id} className="flex items-start gap-2">
                <div className="w-4 h-4 mt-0.5 rounded border border-gray-500/50 flex items-center justify-center flex-shrink-0">
                  <Icon name="check" className="w-2.5 h-2.5 text-gray-600" />
                </div>
                <span className="text-gray-400 text-xs leading-relaxed">{rule.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Rating */}
      <div className="p-3 rounded-lg bg-charcoal-500/10 border border-charcoal-400/5">
        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Quality Rating</p>
        <StarRating value={qualityRating} onChange={setQualityRating} />
      </div>

      {/* Feedback */}
      <div>
        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1.5">Feedback</p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback for the user..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent/30 resize-none"
        />
        <FeedbackTemplatesPanel
          type={showRejectConfirm ? 'reject' : 'approve'}
          onSelect={setFeedback}
        />
      </div>

      {/* Actions */}
      {!showRejectConfirm ? (
        <div className="flex gap-2">
          <Button onClick={handleApprove} className="flex-1" size="sm" disabled={isSubmitting}>
            <span className="flex items-center justify-center gap-1.5">
              <Icon name="check" className="w-4 h-4" /> Approve
            </span>
          </Button>
          <Button variant="danger" onClick={() => setShowRejectConfirm(true)} className="flex-1" size="sm" disabled={isSubmitting}>
            <span className="flex items-center justify-center gap-1.5">
              <Icon name="close" className="w-4 h-4" /> Reject
            </span>
          </Button>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 space-y-2">
          <p className="text-red-400 text-xs font-medium">Confirm rejection</p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={handleReject} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowRejectConfirm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
