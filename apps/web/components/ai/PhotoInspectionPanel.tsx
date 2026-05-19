'use client'

import { useRef } from 'react'

export type Angle = 'front' | 'back' | 'left' | 'right'

interface PhotoInspectionPanelProps {
  angle: Angle
  preview: string | null
  onFile: (angle: Angle, file: File) => void
  disabled?: boolean
}

const ANGLE_LABELS: Record<Angle, string> = {
  front: 'Front',
  back: 'Rear',
  left: 'Driver Side',
  right: 'Passenger Side',
}

const ANGLE_ICONS: Record<Angle, string> = {
  front: '⬆',
  back: '⬇',
  left: '⬅',
  right: '➡',
}

export default function PhotoInspectionPanel({
  angle,
  preview,
  onFile,
  disabled,
}: PhotoInspectionPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(angle, file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-center">
        {ANGLE_ICONS[angle]} {ANGLE_LABELS[angle]}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        id={`photo-${angle}`}
        onChange={handleChange}
        disabled={disabled}
      />

      <label
        htmlFor={`photo-${angle}`}
        className={`relative aspect-[4/3] rounded-card overflow-hidden cursor-pointer border-2 transition-colors flex items-center justify-center ${
          preview
            ? 'border-[#407E3C]'
            : 'border-dashed border-[#E5E7EB] dark:border-gray-600 hover:border-primary/50 bg-[#F9FAFB] dark:bg-gray-800'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={`${angle} view`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded transition-opacity">
                Retake
              </span>
            </div>
          </>
        ) : (
          <div className="text-center p-3">
            <svg
              className="w-8 h-8 text-[#D1D5DB] mx-auto mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs text-[#9CA3AF]">Tap to photograph</p>
          </div>
        )}
      </label>

      {preview && (
        <div className="flex items-center justify-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#407E3C]" />
          <span className="text-xs text-[#407E3C] font-medium">Captured</span>
        </div>
      )}
    </div>
  )
}
