import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiGet, apiPatch } from '@/lib/api'

interface BookingDetail {
  id: string
  booking_ref: string
  status: string
  driver_first_name: string
  driver_last_name: string
  driver_email: string
  pickup_datetime: string
  dropoff_datetime: string
  total_price: number
  vehicle: {
    make: string
    model: string
    year: number
    category?: { name: string }
  }
  extras: { name: string; quantity: number; price_snapshot: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#407E3C',
  active: '#3B82F6',
  completed: '#9CA3AF',
  cancelled: '#DC2626',
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    apiGet<BookingDetail>(`/api/bookings/${id}`)
      .then(setBooking)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  function confirmCancel() {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This cannot be undone.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        { text: 'Cancel Booking', style: 'destructive', onPress: doCancel },
      ]
    )
  }

  async function doCancel() {
    setCancelling(true)
    try {
      await apiPatch(`/api/bookings/${id}`, { status: 'cancelled' })
      setBooking((b) => b ? { ...b, status: 'cancelled' } : b)
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Cancel failed')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#407E3C" /></View>
  }

  if (!booking) {
    return <View style={styles.center}><Text style={styles.error}>Booking not found.</Text></View>
  }

  const canCancel = ['pending', 'confirmed'].includes(booking.status)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.refRow}>
        <Text style={styles.ref}>{booking.booking_ref}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[booking.status] ?? '#9CA3AF' }]}>
          <Text style={styles.badgeText}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <Text style={styles.value}>
          {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
        </Text>
        {booking.vehicle.category && (
          <Text style={styles.muted}>{booking.vehicle.category.name}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dates</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Pickup</Text>
          <Text style={styles.rowValue}>{booking.pickup_datetime.split('T')[0]}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dropoff</Text>
          <Text style={styles.rowValue}>{booking.dropoff_datetime.split('T')[0]}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver</Text>
        <Text style={styles.value}>{booking.driver_first_name} {booking.driver_last_name}</Text>
        <Text style={styles.muted}>{booking.driver_email}</Text>
      </View>

      {booking.extras.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extras</Text>
          {booking.extras.map((e, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowLabel}>{e.name}</Text>
              <Text style={styles.rowValue}>€{Number(e.price_snapshot).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.section, styles.totalSection]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>€{Number(booking.total_price).toFixed(2)}</Text>
      </View>

      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
          onPress={confirmCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="#DC2626" size="small" />
          ) : (
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Back to Bookings</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 15, color: '#DC2626' },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  badge: { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  section: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  muted: { fontSize: 13, color: '#6B7280' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  totalSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#407E3C' },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 6,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '600' },
  backBtn: { paddingVertical: 8, alignItems: 'center' },
  backBtnText: { color: '#407E3C', fontSize: 14 },
})
