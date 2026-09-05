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
    <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-emerald-600" />
          <h4 className="text-sm font-bold text-slate-900">Citizen Resolution Verification</h4>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
          isClosed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          isDisputed ? 'bg-red-50 text-red-800 border-red-200' :
          isResolved ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
          'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          {report.status}
        </span>
      </div>

      {/* Show Officer's Completed Work Details */}
      {resolution.officer_name && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-700">
            <span>Resolved by: <strong className="text-slate-900 font-bold">{resolution.officer_name}</strong></span>
            <span className="text-slate-400 text-[11px] font-medium">{resolution.resolved_at ? new Date(resolution.resolved_at).toLocaleDateString() : ''}</span>
          </div>
          {resolution.resolution_notes && (
            <p className="text-slate-700 text-xs italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed shadow-2xs">
              "{resolution.resolution_notes}"
            </p>
          )}

          {/* AI Verification Score */}
          {resolution.ai_confidence_score && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-medium">
              <Sparkles size={14} className="text-indigo-600 shrink-0" />
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Before (Reported Incident)</span>
                  <img
                    src={report.evidence.image_url}
                    alt="Before"
                    className="mt-1 h-36 w-full object-cover rounded-xl border border-slate-200 shadow-2xs"
                  />
                </div>
              )}
              {resolution.after_image_url && (
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">After (Field Resolution Proof)</span>
                  <img
                    src={resolution.after_image_url}
                    alt="After"
                    className="mt-1 h-36 w-full object-cover rounded-xl border border-emerald-300 shadow-2xs"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Citizen Verification Decision Controls */}
      {isResolved && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            Duty Officer has submitted the completion proof above. Please inspect the site and confirm closure or submit a dispute.
          </p>

          {!mode && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMode('accept')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <CheckCircle size={15} />
                <span>Approve & Close</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('dispute')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-200 transition-colors"
              >
                <AlertTriangle size={15} />
                <span>Dispute Resolution</span>
              </button>
            </div>
          )}

          {mode === 'accept' && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Rate Municipal Service:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5 text-amber-500 hover:scale-110 transition-transform"
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
                className="w-full text-xs p-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                rows={2}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCitizenAction('accept')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Closing...' : 'Confirm Closure'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === 'dispute' && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <p className="text-[11px] text-red-600 font-medium">
                Disputing will escalate this complaint to Senior Department Leadership with an automatic +15% risk surge.
              </p>

              <textarea
                placeholder="Describe what is still broken or incomplete (Required)..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-white border border-red-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600"
                rows={2}
              />

              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCitizenAction('dispute')}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Escalating...' : 'Submit Dispute'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 font-medium"
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
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle size={15} className="text-emerald-600" />
            <span>Citizen Verified & Approved (Rating: {report.citizen_verification.rating}/5)</span>
          </div>
          {report.citizen_verification.feedback && (
            <p className="text-[11px] text-slate-700 italic">"{report.citizen_verification.feedback}"</p>
          )}
        </div>
      )}

      {isDisputed && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={15} className="text-red-600" />
            <span>Resolution Disputed — Priority Escalation Active (+15% Risk Surge)</span>
          </div>
          {report.citizen_verification?.feedback && (
            <p className="text-[11px] text-slate-700 italic">"{report.citizen_verification.feedback}"</p>
          )}
        </div>
      )}
    </div>
  )
}
