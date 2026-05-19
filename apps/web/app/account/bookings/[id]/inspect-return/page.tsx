'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import PhotoInspectionPanel, { type Angle } from '@/components/ai/PhotoInspectionPanel'
import DamageReportView from '@/components/ai/DamageReport'
import type { DamageReport } from '@/lib/schemas'

const ANGLES: Angle[] = ['front', 'back', 'left', 'right']
const MAX_BYTES = 5 * 1024 * 1024

function resizeToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      const maxPx = 1200
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = reject
    img.src = url
  })
}

async function uploadToStorage(bookingId: string, angle: Angle, dataUrl: string): Promise<string> {
  const res = await fetch('/api/inspections/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId, inspection_type: 'return', angle, data_url: dataUrl }),
  })
  if (!res.ok) throw new Error('Upload failed')
  const { url } = await res.json()
  return url
}

type State =
  | { kind: 'loading_baseline' }
  | { kind: 'capturing'; baselineUrls: string[] }
  | { kind: 'uploading'; baselineUrls: string[] }
  | { kind: 'analysing' }
  | { kind: 'done'; report: DamageReport & { dispute_raised?: boolean; needs_human_review?: boolean } }
  | { kind: 'error'; message: string }

export default function InspectReturnPage() {
  const { id: bookingId } = useParams<{ id: string }>()
  const [previews, setPreviews] = useState<Partial<Record<Angle, string>>>({})
  const [state, setState] = useState<State>({ kind: 'loading_baseline' })
  const [sizeError, setSizeError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/inspections/${bookingId}?type=pickup`)
      .then((r) => r.json())
      .then((data: { photo_urls?: string[] }) => {
        setState({ kind: 'capturing', baselineUrls: data.photo_urls ?? [] })
      })
      .catch(() => {
        setState({ kind: 'capturing', baselineUrls: [] })
      })
  }, [bookingId])

  const handleFile = useCallback(async (angle: Angle, file: File) => {
    setSizeError(null)
    if (file.size > MAX_BYTES) {
      setSizeError(`${angle} photo exceeds 5 MB.`)
      return
    }
    const dataUrl = await resizeToBase64(file)
    setPreviews((prev) => ({ ...prev, [angle]: dataUrl }))
  }, [])

  const allCaptured = ANGLES.every((a) => previews[a])

  async function handleSubmit() {
    if (!allCaptured || state.kind !== 'capturing') return
    const { baselineUrls } = state
    setState({ kind: 'uploading', baselineUrls })

    try {
      const urls: string[] = []
      for (const angle of ANGLES) {
        const url = await uploadToStorage(bookingId, angle, previews[angle]!)
        urls.push(url)
      }

      setState({ kind: 'analysing' })

      const res = await fetch('/api/ai/damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          inspection_type: 'return',
          photo_urls: urls,
          baseline_photo_urls: baselineUrls.length > 0 ? baselineUrls : undefined,
        }),
      })

      if (!res.ok) throw new Error('Analysis failed')
      const report = await res.json()
      setState({ kind: 'done', report })
    } catch (err) {
      console.error(err)
      setState({ kind: 'error', message: 'Inspection could not be completed. Photos have been saved — our team will review.' })
    }
  }

  const isCapturing = state.kind === 'capturing'
  const isProcessing = state.kind === 'uploading' || state.kind === 'analysing'

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href={`/account/bookings/${bookingId}`} className="text-sm text-primary hover:underline">
            ← Back to booking
          </Link>
          <h1 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100 mt-2">Return Inspection</h1>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">
            Photograph all 4 angles when returning the vehicle. AI will compare against pickup photos.
          </p>
        </div>

        {state.kind === 'loading_baseline' && (
          <div className="flex items-center justify-center py-16 gap-3">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#6B7280] dark:text-gray-400">Loading pickup reference photos…</p>
          </div>
        )}

        {sizeError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-[#DC2626]">
            {sizeError}
          </div>
        )}

        {(isCapturing || isProcessing) && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {ANGLES.map((angle) => (
                <PhotoInspectionPanel
                  key={angle}
                  angle={angle}
                  preview={previews[angle] ?? null}
                  onFile={handleFile}
                  disabled={!isCapturing}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[#6B7280] dark:text-gray-400">
                {ANGLES.filter((a) => previews[a]).length} / 4 photos captured
              </p>
              <div className="flex gap-1">
                {ANGLES.map((a) => (
                  <span key={a} className={`w-2 h-2 rounded-full ${previews[a] ? 'bg-[#407E3C]' : 'bg-[#E5E7EB] dark:bg-gray-600'}`} />
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!allCaptured || !isCapturing}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.kind === 'uploading' && (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading photos…</>)}
              {state.kind === 'analysing' && (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Comparing vehicle photos…</>)}
              {isCapturing && 'Submit Return Inspection'}
            </button>
          </>
        )}

        {state.kind === 'done' && (
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-gray-100">Return Inspection Complete</h2>
            <DamageReportView report={state.report} />
            <Link href={`/account/bookings/${bookingId}`} className="btn-primary w-full text-center block mt-4">
              Back to Booking
            </Link>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="card space-y-3">
            <p className="text-sm text-[#6B7280] dark:text-gray-400">{state.message}</p>
            <button onClick={() => setState({ kind: 'capturing', baselineUrls: [] })} className="btn-primary w-full">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
