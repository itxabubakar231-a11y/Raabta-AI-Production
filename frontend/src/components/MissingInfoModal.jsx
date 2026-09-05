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
      <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2.5 shadow-xs">
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
        <span className="font-medium">Thank you! Your clarifying answers have been appended to the civic dossier and dispatched to the field unit.</span>
      </div>
    )
  }

  return (
    <div className="p-5 rounded-2xl border border-amber-200/90 bg-amber-50/50 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <HelpCircle size={18} className="text-amber-600 shrink-0" />
        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
          AI Missing Information Assistant
        </h4>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed font-normal">
        To expedite field dispatch, please provide quick answers to the following clarifying questions:
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        {questions.map((q, idx) => (
          <div key={q.id || idx} className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <p className="text-xs font-bold text-slate-900">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
                className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            )}
          </div>
        ))}

        {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
        >
          <Send size={14} />
          <span>{submitting ? 'Submitting...' : 'Submit Clarifications'}</span>
        </button>
      </form>
    </div>
  )
}
