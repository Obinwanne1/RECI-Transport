'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: string
  licence_verified: boolean
  corporate_account_id: string | null
}

const UpdateSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  phone: z.string().min(6, 'Valid phone required').or(z.literal('')),
})
type UpdateForm = z.infer<typeof UpdateSchema>

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateForm>({
    resolver: zodResolver(UpdateSchema),
  })

  useEffect(() => {
    fetch('/api/account/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        setProfile(data)
        reset({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
        })
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [reset])

  async function onSubmit(form: UpdateForm) {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) setSaved(true)
    else setError('Save failed. Try again.')
  }

  if (loading) {
    return (
      <div className="card text-center py-10">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (error && !profile) {
    return <div className="card text-center py-10 text-[#DC2626]">{error}</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1A1A1A]">Profile</h1>

      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5E7EB]">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
            {(profile?.email ?? '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-[#1A1A1A]">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#6B7280] capitalize">{profile?.role?.replace('_', ' ')}</span>
              {profile?.licence_verified && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#F0FDF4] text-[#407E3C]">
                  Verified Driver
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">First name</label>
              <input className="input w-full" {...register('first_name')} />
              {errors.first_name && <p className="mt-1 text-xs text-[#DC2626]">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Last name</label>
              <input className="input w-full" {...register('last_name')} />
              {errors.last_name && <p className="mt-1 text-xs text-[#DC2626]">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Phone</label>
            <input className="input w-full" type="tel" {...register('phone')} />
            {errors.phone && <p className="mt-1 text-xs text-[#DC2626]">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
            <input className="input w-full bg-[#F9FAFB]" value={profile?.email ?? ''} disabled />
            <p className="mt-1 text-xs text-[#6B7280]">Email cannot be changed here.</p>
          </div>

          {error && (
            <p className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          {saved && (
            <p className="text-sm text-[#407E3C] bg-[#F0FDF4] border border-[#BBF7D0] rounded px-3 py-2">
              Profile saved.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
