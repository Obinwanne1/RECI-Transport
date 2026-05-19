'use client'

import { useState, useRef } from 'react'
import type { ConversationalSearchResponse, SearchParams } from '@/lib/schemas'

interface ConversationalSearchProps {
  onResult: (params: SearchParams, message: string) => void
}

export default function ConversationalSearch({ onResult }: ConversationalSearchProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
      if (res.status === 503) {
        setFeedback({ text: 'AI search unavailable — use the form below.', type: 'error' })
        return
      }
      const data: ConversationalSearchResponse = await res.json()
      if (!res.ok) {
        setFeedback({ text: "Couldn't understand that — try the form below.", type: 'error' })
        return
      }
      if (data.confidence < 0.3) {
        setFeedback({ text: "Partial match — check the form fields below.", type: 'warn' })
      } else {
        setFeedback({ text: data.message, type: 'success' })
      }
      setQuery('')
      onResult(data.params, data.message)
    } catch {
      setFeedback({ text: "Couldn't reach AI — try the form below.", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-[#407E3C] uppercase tracking-widest">✦ AI Search</span>
        <span className="text-xs text-[#9CA3AF]">— describe what you need in plain language</span>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "I need a van for moving next Saturday, 3 days"'
          disabled={loading}
          maxLength={500}
          className="flex-1 border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] dark:text-gray-100 placeholder:text-[#9CA3AF] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-shadow bg-[#F9FAFB] dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 bg-[#407E3C] hover:bg-[#356834] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Thinking…
            </>
          ) : (
            <>✦ Search</>
          )}
        </button>
      </form>
      {feedback && (
        <p className={`mt-1.5 text-xs font-medium ${feedback.type === 'success' ? 'text-[#16A34A]' : feedback.type === 'warn' ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
          {feedback.type === 'success' ? '✓ ' : '⚠ '}{feedback.text}
        </p>
      )}
    </div>
  )
}
