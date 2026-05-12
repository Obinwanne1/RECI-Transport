import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { apiPost } from '@/lib/api'
import { useBookingStore } from '@/store/bookingStore'

interface TripCopiloResponse {
  summary: string
  fuel_estimate: string
  top_stops: string[]
  parking_tips: string
}

export default function ConfirmationScreen() {
  const router = useRouter()
  const { bookingRef, bookingId, totalPrice, pickupDate, dropoffDate, reset } = useBookingStore()
  const [tripData, setTripData] = useState<TripCopiloResponse | null>(null)
  const [tripLoading, setTripLoading] = useState(false)
  const [tripExpanded, setTripExpanded] = useState(false)

  async function loadTripCopilot() {
    if (tripData) { setTripExpanded(!tripExpanded); return }
    setTripLoading(true)
    try {
      const res = await apiPost<TripCopiloResponse>('/api/ai/trip', { booking_id: bookingId })
      setTripData(res)
      setTripExpanded(true)
    } catch {
      // silently fail — trip co-pilot is optional
    } finally {
      setTripLoading(false)
    }
  }

  function handleDone() {
    reset()
    router.replace('/(tabs)/bookings')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.successIcon}>
        <Text style={styles.successEmoji}>✓</Text>
      </View>

      <Text style={styles.title}>Booking Confirmed!</Text>
      <Text style={styles.subtitle}>Your vehicle is reserved.</Text>

      <View style={styles.refCard}>
        <Text style={styles.refLabel}>Booking Reference</Text>
        <Text style={styles.refValue}>{bookingRef}</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Pickup</Text>
          <Text style={styles.rowValue}>{pickupDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dropoff</Text>
          <Text style={styles.rowValue}>{dropoffDate}</Text>
        </View>
        {totalPrice != null && (
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>€{totalPrice.toFixed(2)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.copiloBtn} onPress={loadTripCopilot}>
        {tripLoading ? (
          <ActivityIndicator color="#407E3C" size="small" />
        ) : (
          <Text style={styles.copiloBtnText}>
            {tripExpanded ? 'Hide Trip Co-pilot ▲' : '✨ Plan my trip with AI ▼'}
          </Text>
        )}
      </TouchableOpacity>

      {tripExpanded && tripData && (
        <View style={styles.tripCard}>
          <Text style={styles.tripTitle}>Trip Co-pilot</Text>
          <Text style={styles.tripText}>{tripData.summary}</Text>

          <Text style={styles.tripSubtitle}>Fuel Estimate</Text>
          <Text style={styles.tripText}>{tripData.fuel_estimate}</Text>

          {tripData.top_stops.length > 0 && (
            <>
              <Text style={styles.tripSubtitle}>Top Stops</Text>
              {tripData.top_stops.map((stop, i) => (
                <Text key={i} style={styles.tripText}>• {stop}</Text>
              ))}
            </>
          )}

          <Text style={styles.tripSubtitle}>Parking Tips</Text>
          <Text style={styles.tripText}>{tripData.parking_tips}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
        <Text style={styles.doneBtnText}>View My Bookings</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 16, alignItems: 'center' },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#407E3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  successEmoji: { color: '#fff', fontSize: 36, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 16, color: '#6B7280' },
  refCard: {
    width: '100%',
    backgroundColor: '#F0F7EF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  refLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
  refValue: { fontSize: 24, fontWeight: '700', color: '#407E3C', letterSpacing: 1 },
  summaryCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#407E3C' },
  copiloBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#407E3C',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  copiloBtnText: { color: '#407E3C', fontSize: 14, fontWeight: '600' },
  tripCard: {
    width: '100%',
    backgroundColor: '#F0F7EF',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  tripTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  tripSubtitle: { fontSize: 13, fontWeight: '600', color: '#407E3C', marginTop: 8 },
  tripText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  doneBtn: {
    width: '100%',
    backgroundColor: '#407E3C',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
