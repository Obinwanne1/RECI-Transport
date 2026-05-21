'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/hooks/useBookingStore'
import type { ChatResponse } from '@/app/api/ai/chat/route'

type VehicleResult = NonNullable<ChatResponse['vehicles']>[number]

interface Message {
  role: 'user' | 'assistant'
  content: string
  vehicles?: VehicleResult[]
  searchParams?: ChatResponse['search_params']
}

interface AgentChatProps {
  onSearchParams?: (params: { pickup_date?: string | null; dropoff_date?: string | null; category_slug?: string | null }) => void
}

function VehicleCard({ vehicle, searchParams }: { vehicle: VehicleResult; searchParams?: ChatResponse['search_params'] }) {
  const router = useRouter()
  const { setDates } = useBookingStore()

  const fuelIcon = { petrol: '⛽', diesel: '🛢️', electric: '⚡', hybrid: '🌿' }[vehicle.fuel_type] ?? '⛽'
  const transIcon = vehicle.transmission === 'automatic' ? 'Auto' : 'Manual'

  const handleBook = () => {
    // Pre-fill dates from AI search params; booking page re-fetches the vehicle
    if (searchParams?.pickup_date && searchParams?.dropoff_date) {
      setDates(
        new Date(searchParams.pickup_date).toISOString(),
        new Date(searchParams.dropoff_date).toISOString()
      )
    }
    router.push(`/book/${vehicle.id}`)
  }

  return (
    <div className="flex items-start justify-between gap-3 bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-3 hover:border-[#407E3C] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100 truncate">
          {vehicle.make} {vehicle.model} <span className="font-normal text-[#6B7280]">· {vehicle.year}</span>
        </p>
        <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
          {fuelIcon} {vehicle.fuel_type} · {transIcon} · {vehicle.category.passenger_capacity} seats
        </p>
        {vehicle.features.length > 0 && (
          <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-0.5 truncate">
            {vehicle.features.slice(0, 3).join(' · ')}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {vehicle.daily_rate !== null && (
          <p className="text-sm font-bold text-[#407E3C]">€{vehicle.daily_rate}<span className="text-xs font-normal text-[#9CA3AF]">/day</span></p>
        )}
        <button
          onClick={handleBook}
          className="text-xs font-semibold bg-[#407E3C] hover:bg-[#356834] text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Book →
        </button>
      </div>
    </div>
  )
}

export default function AgentChat({ onSearchParams }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    setExpanded(true)
    const userMsg: Message = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (res.status === 503) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'AI assistant is currently unavailable. Please use the search form below.' },
        ])
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: err.error ?? 'Something went wrong. Please try again.' },
        ])
        return
      }

      const data: ChatResponse = await res.json()
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply,
        vehicles: data.vehicles,
        searchParams: data.search_params,
      }
      setMessages((prev) => [...prev, assistantMsg])

      // Propagate search params to SearchWidget for pre-fill
      if (data.search_params && onSearchParams) {
        onSearchParams({
          pickup_date: data.search_params.pickup_date ?? null,
          dropoff_date: data.search_params.dropoff_date ?? null,
          category_slug: data.search_params.category_slug ?? null,
        })
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Couldn't reach the AI assistant. Please try again." },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleClear = () => {
    setMessages([])
    setExpanded(false)
    setInput('')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#407E3C] uppercase tracking-widest">✦ AI Assistant</span>
          <span className="text-xs text-[#9CA3AF]">— ask anything about our fleet</span>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Chat history */}
      {expanded && messages.length > 0 && (
        <div className="mb-3 max-h-80 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                {/* Bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#407E3C] text-white rounded-tr-sm'
                      : 'bg-[#F3F4F6] dark:bg-gray-700 text-[#1A1A1A] dark:text-gray-100 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Vehicle cards inline */}
                {msg.vehicles && msg.vehicles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.vehicles.slice(0, 5).map((v) => (
                      <VehicleCard key={v.id} vehicle={v} searchParams={msg.searchParams} />
                    ))}
                    {msg.vehicles.length > 5 && (
                      <p className="text-xs text-[#9CA3AF] text-center">
                        +{msg.vehicles.length - 5} more — refine your search below
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#F3F4F6] dark:bg-gray-700 px-3.5 py-2.5 rounded-2xl rounded-tl-sm">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#407E3C] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#407E3C] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#407E3C] rounded-full animate-bounce" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => { if (!expanded && messages.length === 0) setExpanded(false) }}
          placeholder={
            messages.length === 0
              ? 'e.g. "Do you have any electric cars available next weekend?"'
              : 'Ask a follow-up question…'
          }
          disabled={loading}
          maxLength={1000}
          className="flex-1 border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] dark:text-gray-100 placeholder:text-[#9CA3AF] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-shadow bg-[#F9FAFB] dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center gap-2 bg-[#407E3C] hover:bg-[#356834] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Thinking…
            </>
          ) : (
            <>✦ Ask</>
          )}
        </button>
      </form>
    </div>
  )
}
