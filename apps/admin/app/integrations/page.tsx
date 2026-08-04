'use client'

const INTEGRATIONS = [
  {
    category: 'Keyless Entry',
    icon: null,
    items: [
      {
        name: 'Sharebox API',
        description: 'Remote key handover via smart lockbox. Customers unlock with a code from their booking confirmation. No staff presence required for pickup or return.',
        status: 'coming_soon',
        benefits: ['24/7 self-service pickup', 'Eliminates key handover logistics', 'Audit log per booking'],
      },
      {
        name: 'Keynest',
        description: 'Partner shop key storage network across Berlin. Customers collect and return keys from nearby convenience stores.',
        status: 'coming_soon',
        benefits: ['400+ collection points in Berlin', 'No hardware installation needed', 'Real-time key tracking'],
      },
    ],
  },
  {
    category: 'GPS Tracking',
    icon: null,
    items: [
      {
        name: 'Teltonika FMB920',
        description: 'Compact GPS tracker with live location, trip history, geofence alerts, and ignition detection. Mounts discretely under dashboard.',
        status: 'coming_soon',
        benefits: ['Live fleet map in admin portal', 'Automatic return detection', 'Theft & unauthorised use alerts'],
      },
      {
        name: 'Rewire Security',
        description: 'SaaS GPS fleet platform with API. Connects directly to RECI admin to auto-update vehicle location and mileage after each trip.',
        status: 'coming_soon',
        benefits: ['No self-hosted infrastructure', 'Auto-mileage sync to bookings', 'Insurance-grade tamper evidence'],
      },
    ],
  },
  {
    category: 'OBD-II Telemetry',
    icon: null,
    items: [
      {
        name: 'Geotab GO9',
        description: 'Plug-in OBD-II dongle that reads mileage, fuel level, engine faults, harsh braking, and speeding events. Data syncs to RECI after each trip end.',
        status: 'coming_soon',
        benefits: ['Auto-mileage on return — no manual staff entry', 'Fuel level disputes eliminated', 'Engine fault early warning'],
      },
      {
        name: 'Bouncie',
        description: 'Consumer-grade OBD tracker with a REST API. Lower cost per vehicle for smaller fleets, with trip-level mileage and fuel data.',
        status: 'coming_soon',
        benefits: ['~$8/month per vehicle', 'REST API for RECI integration', 'Trip start/end webhooks'],
      },
    ],
  },
]

export default function IntegrationsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Hardware Integrations</h1>
        <p className="text-sm text-[#6B7280] mt-1.5 max-w-2xl">
          RECI is designed to connect with fleet hardware. These integrations will automate mileage tracking, keyless entry, and GPS — eliminating manual staff inputs and reducing operational costs.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-8 flex gap-3">
        <span className="text-yellow-500 text-lg shrink-0">ℹ</span>
        <div>
          <p className="text-sm font-semibold text-yellow-800">Hardware partnerships required</p>
          <p className="text-xs text-yellow-700 mt-0.5">
            Each integration requires a hardware device or partner API subscription. Contact us to enable any of these for your fleet.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {INTEGRATIONS.map((group) => (
          <section key={group.category}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-[#1A1A1A]">{group.category}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((integration) => (
                <div
                  key={integration.name}
                  className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-[#1A1A1A] text-sm">{integration.name}</h3>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[#F3F4F6] text-[#9CA3AF]">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{integration.description}</p>
                  <ul className="space-y-1">
                    {integration.benefits.map((b) => (
                      <li key={b} className="text-xs text-[#374151] flex items-start gap-1.5">
                        <span className="text-[#407E3C] font-bold mt-px shrink-0">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled
                    className="mt-auto w-full border border-[#E5E7EB] text-[#9CA3AF] text-xs font-semibold py-2 rounded-lg cursor-not-allowed"
                  >
                    Request Access
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
