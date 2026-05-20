'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'

const Schema = z.object({
  email: z.string().email('Valid email required'),
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  role: z.enum(['staff', 'admin']),
})
type FormData = z.infer<typeof Schema>

const inputCls = 'w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-colors'
const labelCls = 'block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1.5'

interface CreatedUser {
  email: string
  temp_password: string
}

export default function CreateUserPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedUser | null>(null)
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { role: 'staff' },
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch('/admin/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) { setServerError(result.error ?? 'Failed to create user'); return }
    setCreated({ email: result.email, temp_password: result.temp_password })
  }

  async function handleCopy() {
    if (!created) return
    await navigator.clipboard.writeText(created.temp_password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Success screen — show temp password once
  if (created) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-[#F0FDF4] dark:bg-green-900/30 border-2 border-[#407E3C] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#407E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-1">User created</h2>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">{created.email}</p>

          <div className="bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-lg p-4 mb-3 text-left">
            <p className="text-[10px] font-bold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-widest mb-2">Temporary Password</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono text-sm text-[#1A1A1A] dark:text-gray-100 tracking-wider select-all">
                {created.temp_password}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 px-3 py-1.5 bg-[#407E3C] hover:bg-[#356834] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 mb-6 text-left">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This password will <strong>not</strong> be shown again. Share it securely — the user must reset it on first login.
            </p>
          </div>

          <Link
            href="/dashboard/users"
            className="inline-block w-full bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm"
          >
            Done — View Users
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-100 mb-5 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight mb-6">Add Internal User</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6 space-y-5 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-widest mb-4">Account Details</p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" autoComplete="off" className={inputCls} {...register('email')} placeholder="name@company.com" />
              {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>First name</label>
                <input type="text" className={inputCls} {...register('first_name')} />
                {errors.first_name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Last name</label>
                <input type="text" className={inputCls} {...register('last_name')} />
                {errors.last_name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.last_name.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#F3F4F6] dark:border-gray-800 pt-5">
          <p className="text-[10px] font-bold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-widest mb-4">Role</p>
          <div>
            <label className={labelCls}>Access level</label>
            <select className={inputCls} {...register('role')}>
              <option value="staff">Staff — view and manage bookings/fleet</option>
              <option value="admin">Admin — full access including user management</option>
            </select>
          </div>
        </div>

        <div className="border-t border-[#F3F4F6] dark:border-gray-800 pt-5">
          <div className="flex items-start gap-2 bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2.5">
            <svg className="w-4 h-4 text-[#407E3C] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">
              A temporary password will be generated automatically. The user must reset it on first login. No setup email is sent — share the password securely.
            </p>
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? 'Creating…' : 'Create user'}
        </button>
      </form>
    </div>
  )
}
