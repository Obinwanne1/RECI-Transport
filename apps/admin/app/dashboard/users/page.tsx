'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

interface InternalUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'admin' | 'staff'
  password_reset_required: boolean
  created_at: string
}

function UsersSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-[#F3F4F6] dark:border-gray-800">
          {[140, 180, 70, 90, 80].map((w, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-3.5 bg-[#F3F4F6] dark:bg-gray-800 rounded animate-pulse" style={{ width: w, opacity: 1 - i * 0.12 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function UsersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<InternalUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Get current user's id and role via browser Supabase client
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      setCurrentUserId(session.user.id)
      // Fetch own profile role
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (data?.role === 'admin') setIsAdmin(true)
    })
  }, [])

  const fetchUsers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(page))

    fetch(`/admin/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleDelete(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setDeletingId(id)
    const res = await fetch(`/admin/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setTotal((t) => t - 1)
    } else {
      const d = await res.json()
      alert(d.error ?? 'Failed to delete user')
    }
    setDeletingId(null)
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight">Internal Users</h1>
          {!loading && <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-0.5">{total} total</p>}
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/users/create"
            className="inline-flex items-center gap-2 bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </Link>
        )}
      </div>

      <div className="mb-4">
        <div className="relative inline-block">
          <svg className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm w-64 bg-white dark:bg-gray-900 text-[#1A1A1A] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] transition-colors"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-gray-700 bg-[#F9FAFB] dark:bg-gray-800/50">
              {['Name', 'Email', 'Role', 'Status', 'Joined', ...(isAdmin ? ['Actions'] : [])].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <UsersSkeleton />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-4 py-12 text-center">
                  <p className="text-sm text-[#6B7280] dark:text-gray-400">No internal users found.</p>
                  {isAdmin && (
                    <Link href="/dashboard/users/create" className="text-xs text-[#407E3C] hover:underline mt-1 inline-block">
                      Create the first one
                    </Link>
                  )}
                </td>
              </tr>
            ) : users.map((u) => {
              const initials = `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || u.email.slice(0, 2).toUpperCase()
              return (
                <tr key={u.id} className="border-b border-[#F3F4F6] dark:border-gray-800 hover:bg-[#F9FAFB] dark:hover:bg-gray-800/40 transition-colors last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#407E3C]/10 dark:bg-[#407E3C]/20 flex items-center justify-center text-[#407E3C] text-[10px] font-bold shrink-0">
                        {initials}
                      </div>
                      <span className="font-medium text-[#1A1A1A] dark:text-gray-100">{u.first_name} {u.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-[#407E3C]/10 text-[#407E3C] dark:bg-[#407E3C]/20'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.password_reset_required ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Reset pending
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF] dark:text-gray-500 text-xs">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString('en-DE')}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id || u.id === currentUserId}
                        title={u.id === currentUserId ? 'Cannot delete yourself' : 'Delete user'}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {deletingId === u.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#6B7280] dark:text-gray-400">{total} total</p>
          <div className="flex gap-2 items-center">
            {page > 1 && (
              <button onClick={() => router.push(`/dashboard/users?page=${page - 1}`)} className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm text-[#6B7280] dark:text-gray-400 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors">← Prev</button>
            )}
            <span className="px-3 py-1.5 text-xs text-[#6B7280] dark:text-gray-400">{page} / {totalPages}</span>
            {page < totalPages && (
              <button onClick={() => router.push(`/dashboard/users?page=${page + 1}`)} className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm text-[#6B7280] dark:text-gray-400 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors">Next →</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function UsersPage() {
  return <Suspense><UsersContent /></Suspense>
}
