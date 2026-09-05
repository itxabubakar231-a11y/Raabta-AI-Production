import { useState } from 'react'
import { HelpCircle, Send, CheckCircle2 } from 'lucide-react'
import * as api from '../services/api'

export default function MissingInfoModal({ reportId, questions = [], onAnswered }) {
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  if (!questions || questions.length === 0) return null

  function handleSelectOption(qId, opt) {
    setAnswers(prev => ({ ...prev, [qId]: opt }))
  }

  function handleTextChange(qId, val) {
    setAnswers(prev => ({ ...prev, [qId]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const answersList = Object.entries(answers).map(([qid, ans]) => ({
      question_id: qid,
      answer: ans
    }))

    if (answersList.length === 0) {
      setError('Please answer at least one clarifying question.')
      setSubmitting(false)
      return
    }

    try {
      await api.submitMissingInfo(reportId, answersList)
      setSubmitted(true)
      if (onAnswered) onAnswered(answersList)
    } catch (err) {
      setError(err.message || 'Failed to submit information')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2">
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
        <span>Thank you! Your clarifying answers have been appended to the civic dossier and dispatched to the field unit.</span>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle size={18} className="text-amber-400 shrink-0" />
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
          AI Missing Information Assistant
        </h4>
      </div>
      <p className="text-xs text-slate-300 mb-3">
        To expedite field dispatch, please provide quick answers to the following clarifying questions:
      </p>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {questions.map((q, idx) => (
          <div key={q.id || idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <p className="text-xs font-semibold text-white mb-2">
              {idx + 1}. {q.question}
            </p>

            {q.type === 'choice' && q.options?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id || `q${idx}`] === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(q.id || `q${idx}`, opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Type your response here..."
                value={answers[q.id || `q${idx}`] || ''}
                onChange={(e) => handleTextChange(q.id || `q${idx}`, e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>
        ))}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
        >
          <Send size={14} />
          <span>{submitting ? 'Submitting...' : 'Submit Clarifications'}</span>
        </button>
      </form>
    </div>
  )
}
