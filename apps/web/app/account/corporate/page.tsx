'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface CorporateAccount {
  id: string
  company_name: string
  company_registration: string | null
  vat_number: string | null
  billing_address: string
  billing_email: string
  discount_pct: number
  credit_limit: number
  payment_terms_days: number
  travel_policy: string | null
  is_active: boolean
}

const ApplySchema = z.object({
  company_name: z.string().min(2, 'Company name required'),
  company_registration: z.string().optional(),
  vat_number: z.string().optional(),
  billing_address: z.string().min(5, 'Billing address required'),
  billing_email: z.string().email('Valid email required'),
  travel_policy: z.string().optional(),
})
type ApplyForm = z.infer<typeof ApplySchema>

export default function CorporatePage() {
  const [account, setAccount] = useState<CorporateAccount | null>(null)
  const [appStatus, setAppStatus] = useState<string>('none')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(ApplySchema),
  })

  useEffect(() => {
    fetch('/api/corporate')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        setAccount(data.account)
        setAppStatus(data.application_status ?? 'none')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  async function onSubmit(form: ApplyForm) {
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/corporate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error ?? 'Failed'); return }
    setSuccess(true)
  }

  if (loading) {
    return (
      <div className="card text-center py-10">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  // Existing account
  if (account) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Corporate Account</h1>

        <div className="card">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E5E7EB]">
            <div>
              <p className="font-semibold text-[#1A1A1A] text-lg">{account.company_name}</p>
              {account.vat_number && <p className="text-sm text-[#6B7280]">VAT: {account.vat_number}</p>}
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${account.is_active ? 'bg-[#F0FDF4] text-[#407E3C] border-[#BBF7D0]' : 'bg-red-50 text-[#DC2626] border-red-200'}`}>
              {account.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mb-1">Discount</dt>
              <dd className="font-medium text-[#1A1A1A]">{account.discount_pct}%</dd>
            </div>
            <div>
              <dt className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mb-1">Credit limit</dt>
              <dd className="font-medium text-[#1A1A1A]">€{Number(account.credit_limit).toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mb-1">Payment terms</dt>
              <dd className="font-medium text-[#1A1A1A]">{account.payment_terms_days} days</dd>
            </div>
            <div>
              <dt className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mb-1">Billing email</dt>
              <dd className="font-medium text-[#1A1A1A] truncate">{account.billing_email}</dd>
            </div>
            {account.billing_address && (
              <div className="col-span-2">
                <dt className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mb-1">Billing address</dt>
                <dd className="font-medium text-[#1A1A1A]">{account.billing_address}</dd>
              </div>
            )}
            {account.travel_policy && (
              <div className="col-span-2">
                <dt className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mb-1">Travel policy</dt>
                <dd className="text-[#1A1A1A] text-sm whitespace-pre-wrap bg-[#F9FAFB] rounded p-3 border border-[#E5E7EB]">
                  {account.travel_policy}
                </dd>
              </div>
            )}
          </dl>

          <p className="mt-6 text-xs text-[#6B7280]">
            To update account details, discount rates, or travel policy — contact your RECI account manager.
          </p>
        </div>
      </div>
    )
  }

  // Post-submit success
  if (success) {
    return (
      <div className="card text-center py-10">
        <div className="w-14 h-14 bg-[#F0FDF4] border-2 border-[#407E3C] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#407E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Corporate account created</h2>
        <p className="text-sm text-[#6B7280]">Your account is active. Reload to see your details.</p>
      </div>
    )
  }

  // Apply form
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1A1A1A]">Corporate Account</h1>

      <div className="card">
        <h2 className="font-semibold text-[#1A1A1A] mb-1">Apply for a corporate account</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Corporate accounts get custom pricing, invoiced billing, and AI policy enforcement on bookings.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Company name</label>
            <input className="input w-full" {...register('company_name')} />
            {errors.company_name && <p className="mt-1 text-xs text-[#DC2626]">{errors.company_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Registration number</label>
              <input className="input w-full" placeholder="Optional" {...register('company_registration')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">VAT number</label>
              <input className="input w-full" placeholder="Optional" {...register('vat_number')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Billing address</label>
            <input className="input w-full" {...register('billing_address')} />
            {errors.billing_address && <p className="mt-1 text-xs text-[#DC2626]">{errors.billing_address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Billing email</label>
            <input className="input w-full" type="email" {...register('billing_email')} />
            {errors.billing_email && <p className="mt-1 text-xs text-[#DC2626]">{errors.billing_email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Travel policy <span className="text-[#6B7280] font-normal">(optional)</span>
            </label>
            <textarea
              className="input w-full h-28 resize-none"
              placeholder="e.g. Economy or Compact vehicles only. No chauffeur. Bookings must be made 48h in advance. Maximum daily rate €80."
              {...register('travel_policy')}
            />
            <p className="mt-1 text-xs text-[#6B7280]">
              Plain text. The AI agent will enforce this on every booking from your account.
            </p>
          </div>

          {error && (
            <p className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Create corporate account'}
          </button>
        </form>
      </div>
    </div>
  )
}
