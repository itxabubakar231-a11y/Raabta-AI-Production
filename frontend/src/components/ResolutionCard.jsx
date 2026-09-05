import { useState } from 'react'
import { CheckCircle, AlertTriangle, Star, ShieldCheck, Sparkles } from 'lucide-react'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ResolutionCard({ report, onUpdated }) {
  const { role } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(5)
  const [mode, setMode] = useState(null) // 'accept' or 'dispute'
  const [error, setError] = useState('')

  if (!report) return null

  const isResolved = report.status === 'resolved'
  const isClosed = report.status === 'closed'
  const isDisputed = report.status === 'disputed'
  const resolution = report.resolution || {}

  async function handleCitizenAction(action) {
    if (action === 'dispute' && !feedback.trim()) {
      setError('Please provide a reason for disputing the resolution.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await api.verifyResolution(report.id || report._id, {
        action,
        feedback,
        rating
      })
      setMode(null)
      if (onUpdated) onUpdated()
    } catch (err) {
      setError(err.message || 'Verification update failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Citizen Resolution Verification</h4>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
          isClosed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
          isDisputed ? 'bg-red-500/20 text-red-400 border-red-500/30' :
          isResolved ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
          'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {report.status}
        </span>
      </div>

      {/* Show Officer's Completed Work Details */}
      {resolution.officer_name && (
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Resolved by: <strong className="text-white">{resolution.officer_name}</strong></span>
            <span className="text-slate-500 text-[11px]">{resolution.resolved_at ? new Date(resolution.resolved_at).toLocaleDateString() : ''}</span>
          </div>
          {resolution.resolution_notes && (
            <p className="text-slate-300 text-xs italic bg-slate-900/80 p-2.5 rounded border border-slate-800">
              "{resolution.resolution_notes}"
            </p>
          )}

          {/* AI Verification Score */}
          {resolution.ai_confidence_score && (
            <div className="flex items-center gap-2 p-2 rounded bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 text-[11px]">
              <Sparkles size={14} className="text-indigo-400 shrink-0" />
              <span>
                AI Vision Confidence: <strong>{Math.round(resolution.ai_confidence_score * 100)}%</strong> — {resolution.ai_summary || 'Resolution verified against initial hazard.'}
              </span>
            </div>
          )}

          {/* Before & After Photo Comparison */}
          {(report.evidence?.image_url || resolution.after_image_url) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {report.evidence?.image_url && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Before (Reported Incident)</span>
                  <img
                    src={report.evidence.image_url}
                    alt="Before"
                    className="mt-1 h-32 w-full object-cover rounded-lg border border-slate-800"
                  />
                </div>
              )}
              {resolution.after_image_url && (
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">After (Field Resolution Proof)</span>
                  <img
                    src={resolution.after_image_url}
                    alt="After"
                    className="mt-1 h-32 w-full object-cover rounded-lg border border-emerald-500/40"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Citizen Verification Decision Controls */}
      {isResolved && (
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
          <p className="text-xs text-slate-200 font-medium">
            Duty Officer has submitted the completion proof above. Please inspect the site and confirm closure or submit a dispute.
          </p>

          {!mode && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMode('accept')}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg"
              >
                <CheckCircle size={15} />
                <span>Approve & Close</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('dispute')}
                className="flex-1 py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-500/40 transition-colors"
              >
                <AlertTriangle size={15} />
                <span>Dispute Resolution</span>
              </button>
            </div>
          )}

          {mode === 'accept' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Rate Municipal Service:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star size={16} fill={rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Optional feedback for the duty officer..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                rows={2}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCitizenAction('accept')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Closing...' : 'Confirm Closure'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === 'dispute' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <p className="text-[11px] text-red-400 font-medium">
                Disputing will escalate this complaint to Senior Department Leadership with an automatic +15% risk surge.
              </p>

              <textarea
                placeholder="Describe what is still broken or incomplete (Required)..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-900 border border-red-500/50 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                rows={2}
              />

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCitizenAction('dispute')}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Escalating...' : 'Submit Dispute'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmed / Disputed status badges */}
      {isClosed && report.citizen_verification && (
        <div className="p-3 rounded-lg bg-emerald-950/25 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle size={15} className="text-emerald-400" />
            <span>Citizen Verified & Approved (Rating: {report.citizen_verification.rating}/5)</span>
          </div>
          {report.citizen_verification.feedback && (
            <p className="text-[11px] text-slate-300 italic">"{report.citizen_verification.feedback}"</p>
          )}
        </div>
      )}

      {isDisputed && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={15} className="text-red-400" />
            <span>Resolution Disputed — Priority Escalation Active</span>
          </div>
          {report.citizen_verification?.feedback && (
            <p className="text-[11px] text-slate-300 italic">"{report.citizen_verification.feedback}"</p>
          )}
        </div>
      )}
    </div>
  )
}
