'use client'

import { useState, useRef } from 'react'
import type { ConversationalSearchResponse, SearchParams } from '@/lib/schemas'

interface ConversationalSearchProps {
  onResult: (params: SearchParams, message: string) => void
}

export default function ConversationalSearch({ onResult }: ConversationalSearchProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
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
        // AI unavailable — hide silently, handled by null render below
        return
      }

      const data: ConversationalSearchResponse = await res.json()

      if (!res.ok || data.confidence < 0.5) {
        setFeedback({
          text: "Couldn't understand that — please use the form below.",
          type: 'error',
        })
        return
      }

      setFeedback({ text: data.message, type: 'success' })
      setQuery('')
      onResult(data.params, data.message)
    } catch {
      setFeedback({
        text: "Couldn't understand that — please use the form below.",
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try: "I need a van for moving next Saturday to Sunday"'
          className="input-field flex-1"
          disabled={loading}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary whitespace-nowrap flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <span>✦</span> AI Search
            </>
          )}
        </button>
      </form>

      {feedback && (
        <p
          className={`mt-2 text-sm ${
            feedback.type === 'success' ? 'text-[#16A34A]' : 'text-[#DC2626]'
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  )
}
