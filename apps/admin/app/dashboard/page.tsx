import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import DemandCard from '@/components/DemandCard'

export const dynamic = 'force-dynamic'

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

const MOCK_KPIS = {
  pickups_today: 3,
  revenue_this_month: 4280,
  active_bookings: 7,
  fleet_total: 6,
  pending_payment: 1,
  recent_bookings: [
    { id: 'mock-1', booking_ref: 'REC-0001', status: 'confirmed', total_price: 357, created_at: new Date().toISOString(), driver_first_name: 'Hans', driver_last_name: 'Müller', vehicle: { make: 'BMW', model: '3 Series' } },
    { id: 'mock-2', booking_ref: 'REC-0002', status: 'pending', total_price: 245, created_at: new Date().toISOString(), driver_first_name: 'Anna', driver_last_name: 'Schmidt', vehicle: { make: 'Volkswagen', model: 'Golf' } },
    { id: 'mock-3', booking_ref: 'REC-0003', status: 'active', total_price: 596, created_at: new Date().toISOString(), driver_first_name: 'Klaus', driver_last_name: 'Weber', vehicle: { make: 'Mercedes', model: 'Sprinter' } },
  ],
  demand_rows: [],
}

async function getKpis() {
  if (!SUPABASE_CONFIGURED) return MOCK_KPIS

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
      .select(`id, booking_ref, status, total_price, created_at, driver_first_name, driver_last_name, vehicle:vehicles(make, model)`)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const { data: demandSignals } = await supabase
    .from('pricing_signals')
    .select('demand_score, signal_type, vehicles_remaining, computed_at, vehicle_categories(name)')
    .eq('date', todayStr)
    .order('demand_score', { ascending: false })

  const demandRows = (demandSignals ?? []).map((row: any) => {
    const cat = Array.isArray(row.vehicle_categories) ? row.vehicle_categories[0] : row.vehicle_categories
    return {
      category_name: cat?.name ?? 'Unknown',
      demand_score: row.demand_score,
      signal_type: row.signal_type as 'normal' | 'high' | 'peak',
      vehicles_remaining: row.vehicles_remaining ?? null,
      computed_at: row.computed_at ?? null,
    }
  })

  return {
    pickups_today: pickupsToday ?? 0,
    revenue_this_month: (revenueData ?? []).reduce((sum, r) => sum + Number(r.amount), 0),
    active_bookings: activeBookings ?? 0,
    fleet_total: fleetTotal ?? 0,
    pending_payment: pendingPayment ?? 0,
    recent_bookings: recentBookings ?? [],
    demand_rows: demandRows,
  }
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:        { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-400' },
  confirmed:      { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500' },
  active:         { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400',    dot: 'bg-blue-500' },
  completed:      { bg: 'bg-gray-100 dark:bg-gray-800',       text: 'text-gray-600 dark:text-gray-400',    dot: 'bg-gray-400' },
  cancelled:      { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',      dot: 'bg-red-400' },
  no_show:        { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400',dot: 'bg-purple-400' },
  payment_failed: { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',      dot: 'bg-red-400' },
}

const KPI_CARDS = (kpis: Awaited<ReturnType<typeof getKpis>>) => [
  {
    label: 'Pickups Today',
    value: kpis.pickups_today,
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    iconBg: 'bg-blue-500',
    format: (v: number) => String(v),
  },
  {
    label: 'Monthly Revenue',
    value: kpis.revenue_this_month,
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconBg: 'bg-[#407E3C]',
    format: (v: number) => `€${v.toLocaleString('de-DE')}`,
  },
  {
    label: 'Active Bookings',
    value: kpis.active_bookings,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    iconBg: 'bg-violet-500',
    format: (v: number) => String(v),
  },
  {
    label: 'Fleet Size',
    value: kpis.fleet_total,
    icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
    iconBg: 'bg-orange-500',
    format: (v: number) => String(v),
  },
]

export default async function DashboardPage() {
  const kpis = await getKpis()
  const cards = KPI_CARDS(kpis)

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alert */}
      {kpis.pending_payment > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/50 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex-1">
            {kpis.pending_payment} booking{kpis.pending_payment !== 1 ? 's' : ''} awaiting payment or review
          </p>
          <Link href="/bookings?status=pending" className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 bg-amber-100 dark:bg-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-700/50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Review →
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {cards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider leading-tight">{card.label}</p>
              <div className={`${card.iconBg} w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight">{card.format(card.value as number)}</p>
          </div>
        ))}
      </div>

      {/* Recent + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F3F4F6] dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">Recent Bookings</h2>
            <Link href="/bookings" className="text-xs font-medium text-[#407E3C] hover:text-[#356834] transition-colors">View all →</Link>
          </div>
          <div className="divide-y divide-[#F3F4F6] dark:divide-gray-800">
            {kpis.recent_bookings.length === 0 ? (
              <p className="px-5 py-10 text-sm text-[#6B7280] dark:text-gray-400 text-center">No bookings yet.</p>
            ) : kpis.recent_bookings.map((b: any) => {
              const v = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
              const s = STATUS_STYLES[b.status] ?? STATUS_STYLES.completed
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F9FAFB] dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-[#407E3C]">{b.booking_ref}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#1A1A1A] dark:text-gray-200 font-medium truncate">
                      {b.driver_first_name} {b.driver_last_name}
                      {v && <span className="text-[#6B7280] dark:text-gray-400 font-normal"> · {v.make} {v.model}</span>}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A] dark:text-gray-100 shrink-0">€{Number(b.total_price).toFixed(0)}</p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: '/bookings', label: 'All Bookings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', primary: true },
                { href: '/fleet', label: 'Manage Fleet', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0', primary: false },
                { href: '/calendar', label: 'Fleet Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', primary: false },
                { href: '/availability', label: 'Block Dates', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', primary: false },
              ].map(({ href, label, icon, primary }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    primary
                      ? 'bg-[#407E3C] hover:bg-[#356834] text-white shadow-sm'
                      : 'bg-[#F9FAFB] dark:bg-gray-800 hover:bg-[#F3F4F6] dark:hover:bg-gray-700 text-[#374151] dark:text-gray-300 border border-[#E5E7EB] dark:border-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">Status Overview</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Active', value: kpis.active_bookings, color: 'bg-blue-500' },
                { label: 'Pending', value: kpis.pending_payment, color: 'bg-amber-400' },
                { label: 'Fleet', value: kpis.fleet_total, color: 'bg-[#407E3C]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                  <span className="text-sm text-[#6B7280] dark:text-gray-400 flex-1">{label}</span>
                  <span className="text-sm font-bold text-[#1A1A1A] dark:text-gray-100">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <DemandCard rows={kpis.demand_rows} />
        </div>
      </div>
    </div>
  )
}
