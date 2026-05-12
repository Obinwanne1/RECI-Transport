import { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/auth'
import { apiGet } from '@/lib/api'

interface Booking {
  id: string
  booking_ref: string
  status: string
  pickup_datetime: string
  dropoff_datetime: string
  total_price: number
  vehicle: { make: string; model: string; year: number } | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#407E3C',
  active: '#3B82F6',
  completed: '#9CA3AF',
  cancelled: '#DC2626',
  no_show: '#EF4444',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] ?? '#9CA3AF' }]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  )
}

export default function BookingsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    apiGet<Booking[]>('/api/account/bookings')
      .then(setBookings)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Sign in to view your bookings.</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#407E3C" /></View>
  }

  if (error) {
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No bookings yet.</Text>
        <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.searchBtnText}>Search Vehicles</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <FlatList
      data={bookings}
      keyExtractor={(b) => b.id}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/booking/${item.id}`)}
        >
          <View style={styles.cardTop}>
            <Text style={styles.ref}>{item.booking_ref}</Text>
            <StatusBadge status={item.status} />
          </View>
          {item.vehicle && (
            <Text style={styles.vehicle}>
              {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
            </Text>
          )}
          <Text style={styles.dates}>
            {item.pickup_datetime.split('T')[0]} → {item.dropoff_datetime.split('T')[0]}
          </Text>
          <Text style={styles.total}>€{Number(item.total_price).toFixed(2)}</Text>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  list: { padding: 16, paddingBottom: 32 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  errorText: { fontSize: 15, color: '#DC2626' },
  signInBtn: {
    backgroundColor: '#407E3C',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  signInBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  searchBtn: {
    borderWidth: 1,
    borderColor: '#407E3C',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  searchBtnText: { color: '#407E3C', fontSize: 15, fontWeight: '600' },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  vehicle: { fontSize: 14, color: '#374151' },
  dates: { fontSize: 13, color: '#6B7280' },
  total: { fontSize: 15, fontWeight: '700', color: '#407E3C' },
})
