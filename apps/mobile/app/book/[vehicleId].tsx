import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiGet } from '@/lib/api'
import { useBookingStore } from '@/store/bookingStore'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  color: string
  fuel_type: string
  transmission: string
  daily_rate: number | null
  category: { name: string } | null
}

interface PricingSignal {
  signal_type: 'normal' | 'high' | 'peak'
  message: string
}

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.max(1, Math.round(ms / 86400000))
}

export default function BookVehicleScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>()
  const router = useRouter()
  const { pickupDate, dropoffDate, setVehicle } = useBookingStore()

  const [vehicle, setVehicleData] = useState<Vehicle | null>(null)
  const [signal, setSignal] = useState<PricingSignal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [v, signals] = await Promise.all([
          apiGet<Vehicle>(`/api/vehicles/${vehicleId}`),
          apiGet<PricingSignal[]>('/api/pricing-signals').catch(() => []),
        ])
        setVehicleData(v)
        const active = (signals as PricingSignal[]).find((s) => s.signal_type !== 'normal')
        if (active) setSignal(active)
        setVehicle(vehicleId)
      } catch {
        // handled by null check below
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [vehicleId])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#407E3C" /></View>
  }

  if (!vehicle) {
    return <View style={styles.center}><Text style={styles.error}>Vehicle not found.</Text></View>
  }

  const days = pickupDate && dropoffDate ? daysBetween(pickupDate, dropoffDate) : 1
  const total = vehicle.daily_rate != null ? vehicle.daily_rate * days : null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {signal && (
        <View style={styles.signalBanner}>
          <Text style={styles.signalText}>
            {signal.signal_type === 'peak' ? '🔥 Peak demand' : '⚡ High demand'} · {signal.message}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{vehicle.make[0]}{vehicle.model[0]}</Text>
        </View>
        <Text style={styles.vehicleName}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
        {vehicle.category && <Text style={styles.category}>{vehicle.category.name}</Text>}
        <Text style={styles.specs}>{vehicle.color} · {vehicle.fuel_type} · {vehicle.transmission}</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pickup</Text>
          <Text style={styles.summaryValue}>{pickupDate ?? '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Dropoff</Text>
          <Text style={styles.summaryValue}>{dropoffDate ?? '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>{days} day{days !== 1 ? 's' : ''}</Text>
        </View>
        {vehicle.daily_rate != null && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate</Text>
            <Text style={styles.summaryValue}>€{vehicle.daily_rate}/day</Text>
          </View>
        )}
        {total != null && (
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>€{total.toFixed(2)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.continueBtn} onPress={() => router.push('/book/extras')}>
        <Text style={styles.continueBtnText}>Continue to Extras →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#DC2626', fontSize: 15 },
  signalBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  signalText: { fontSize: 13, color: '#92400E' },
  card: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  placeholder: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 28, fontWeight: '700', color: '#9CA3AF' },
  vehicleName: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  category: { fontSize: 13, color: '#407E3C', fontWeight: '600' },
  specs: { fontSize: 13, color: '#6B7280' },
  summary: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#407E3C' },
  continueBtn: {
    backgroundColor: '#407E3C',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
