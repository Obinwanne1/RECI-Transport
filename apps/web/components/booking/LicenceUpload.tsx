'use client'

import { useRef, useState } from 'react'

interface LicenceUploadProps {
  firstName: string
  lastName: string
  onVerified: (licenceNumber: string) => void
}

type UploadState =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'verified'; confidence: number; licenceNumber: string | null }
  | { kind: 'review'; confidence: number }
  | { kind: 'failed'; message: string }
  | { kind: 'error' }

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

function resizeImageToBase64(file: File, maxPx: number): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas unavailable')); return }
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
      resolve({ base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}

export default function LicenceUpload({ firstName, lastName, onVerified }: LicenceUploadProps) {
  const [state, setState] = useState<UploadState>({ kind: 'idle' })
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setState({ kind: 'failed', message: 'Unsupported file type. Use JPEG, PNG, or WebP.' })
      return
    }
    if (file.size > MAX_BYTES) {
      setState({ kind: 'failed', message: 'File too large. Maximum 5 MB.' })
      return
    }

    setState({ kind: 'uploading' })

    try {
      const { base64, mediaType } = await resizeImageToBase64(file, 1200)

      const res = await fetch('/api/ai/licence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64,
          media_type: mediaType,
          booking_first_name: firstName,
          booking_last_name: lastName,
        }),
      })

      if (!res.ok) {
        setState({ kind: 'error' })
        return
      }

      const data: {
        status: 'verified' | 'pending' | 'failed'
        confidence: number
        name_match: boolean
        licence_number: string | null
        message: string
      } = await res.json()

      if (data.status === 'verified') {
        setState({ kind: 'verified', confidence: data.confidence, licenceNumber: data.licence_number })
        if (data.licence_number) onVerified(data.licence_number)
      } else if (data.status === 'pending') {
        setState({ kind: 'review', confidence: data.confidence })
      } else {
        setState({ kind: 'failed', message: data.message })
      }
    } catch {
      setState({ kind: 'error' })
    }

    // Reset file input so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="mt-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
        id="licence-upload-input"
      />

      {state.kind === 'idle' && (
        <label
          htmlFor="licence-upload-input"
          className="inline-flex items-center gap-2 text-sm text-primary border border-primary/40 rounded-md px-3 py-1.5 cursor-pointer hover:bg-[#F0FDF4] dark:hover:bg-green-900/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Licence — get Verified Driver badge
        </label>
      )}

      {state.kind === 'uploading' && (
        <div className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Analysing your licence…
        </div>
      )}

      {state.kind === 'verified' && (
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[#16A34A] bg-[#F0FDF4] dark:bg-green-900/20 border border-[#BBF7D0] dark:border-green-800 rounded-md px-3 py-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Verified Driver — {Math.round(state.confidence * 100)}% confidence
          </div>
          <label
            htmlFor="licence-upload-input"
            className="text-xs text-[#6B7280] hover:text-[#1A1A1A] cursor-pointer underline"
          >
            Retake
          </label>
        </div>
      )}

      {state.kind === 'review' && (
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md px-3 py-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Under review — staff will verify before pickup ({Math.round(state.confidence * 100)}% read)
          </div>
          <label
            htmlFor="licence-upload-input"
            className="text-xs text-[#6B7280] hover:text-[#1A1A1A] cursor-pointer underline"
          >
            Retry
          </label>
        </div>
      )}

      {(state.kind === 'failed' || state.kind === 'error') && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#6B7280]">
            {state.kind === 'failed' ? state.message : 'Verification unavailable — please enter licence number manually.'}
          </p>
          <label
            htmlFor="licence-upload-input"
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            Try again
          </label>
        </div>
      )}
    </div>
  )
}
