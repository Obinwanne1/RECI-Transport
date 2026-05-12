import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getKpis() {
  const supabase = createAdminClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  const [
    { count: pickupsToday },
    { data: revenueData },
    { count: activeBookings },
    { count: fleetTotal },
    { count: pendingPayment },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .gte('pickup_datetime', `${todayStr}T00:00:00`)
      .lte('pickup_datetime', `${todayStr}T23:59:59`)
      .in('status', ['confirmed', 'active']),
    supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', monthStart),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'active']),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings')
      .select(`id, booking_ref, status, total_price, created_at, driver_first_name, driver_last_name,
               vehicle:vehicles(make, model)`)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const revenueThisMonth = (revenueData ?? []).reduce((sum, r) => sum + Number(r.amount), 0)

  return {
    pickups_today: pickupsToday ?? 0,
    revenue_this_month: revenueThisMonth,
    active_bookings: activeBookings ?? 0,
    fleet_total: fleetTotal ?? 0,
    pending_payment: pendingPayment ?? 0,
    recent_bookings: recentBookings ?? [],
  }
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-purple-100 text-purple-700',
  payment_failed: 'bg-red-100 text-red-700',
}

export default async function DashboardPage() {
  const kpis = await getKpis()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Dashboard</h1>

      {kpis.pending_payment > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-yellow-800">
            <strong>{kpis.pending_payment}</strong> booking{kpis.pending_payment !== 1 ? 's' : ''} awaiting payment or review.{' '}
            <Link href="/bookings?status=pending" className="underline font-medium">View</Link>
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Pickups Today</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{kpis.pickups_today}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Monthly Revenue</p>
          <p className="text-3xl font-bold text-[#407E3C]">€{kpis.revenue_this_month.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Active Bookings</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{kpis.active_bookings}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Fleet Size</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{kpis.fleet_total}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3 mb-8">
        <Link href="/bookings" className="bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
          View all bookings
        </Link>
        <Link href="/fleet" className="border border-[#407E3C] text-[#407E3C] hover:bg-[#F0FDF4] text-sm font-semibold px-4 py-2 rounded-md transition-colors">
          Manage fleet
        </Link>
      </div>

      {/* Recent bookings */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['Ref', 'Vehicle', 'Driver', 'Status', 'Total'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kpis.recent_bookings.map((b: any) => {
                const v = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
                return (
                  <tr key={b.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[#407E3C]">
                      <Link href={`/bookings/${b.id}`} className="hover:underline">{b.booking_ref}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-[#1A1A1A]">{v ? `${v.make} ${v.model}` : '—'}</td>
                    <td className="px-4 py-2.5 text-[#6B7280]">{b.driver_first_name} {b.driver_last_name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[#1A1A1A]">€{Number(b.total_price).toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
