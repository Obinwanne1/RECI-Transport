import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useStripe } from '@stripe/stripe-react-native'
import { apiPost } from '@/lib/api'
import { useBookingStore } from '@/store/bookingStore'

interface BookingResult {
  booking_id: string
  booking_ref: string
  total_price: number
}

interface PaymentIntentResult {
  client_secret: string
  amount: number
}

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.max(1, Math.round(ms / 86400000))
}

export default function PaymentScreen() {
  const router = useRouter()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const store = useBookingStore()

  const [booking, setBooking] = useState<BookingResult | null>(null)
  const [paymentReady, setPaymentReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const days =
    store.pickupDate && store.dropoffDate
      ? daysBetween(store.pickupDate, store.dropoffDate)
      : 1

  useEffect(() => {
    async function setup() {
      try {
        // Step 1: Create booking
        const bookingRes = await apiPost<BookingResult>('/api/bookings', {
          vehicle_id: store.vehicleId,
          pickup_datetime: store.pickupDate + 'T09:00:00.000Z',
          dropoff_datetime: store.dropoffDate + 'T09:00:00.000Z',
          pickup_location_id: store.pickupLocationId,
          dropoff_location_id: store.pickupLocationId,
          driver_first_name: store.driverFirstName,
          driver_last_name: store.driverLastName,
          driver_email: store.driverEmail,
          driver_phone: store.driverPhone,
          driver_licence_number: store.driverLicenceNumber,
          extras: store.extras,
        })
        setBooking(bookingRes)
        store.setBookingResult(bookingRes.booking_id, bookingRes.booking_ref, bookingRes.total_price)

        // Step 2: Create PaymentIntent
        const intentRes = await apiPost<PaymentIntentResult>('/api/payments/intent', {
          booking_id: bookingRes.booking_id,
        })

        // Step 3: Init Stripe sheet
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: intentRes.client_secret,
          merchantDisplayName: 'RECI Transport',
          style: 'automatic',
          primaryButtonLabel: `Pay €${intentRes.amount.toFixed(2)}`,
        })
        if (initError) throw new Error(initError.message)
        setPaymentReady(true)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Setup failed')
      } finally {
        setLoading(false)
      }
    }
    setup()
  }, [])

  async function handlePay() {
    setPaying(true)
    try {
      const { error: payError } = await presentPaymentSheet()
      if (payError) {
        if (payError.code !== 'Canceled') {
          Alert.alert('Payment failed', payError.message)
        }
        return
      }
      router.replace('/book/confirmation')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407E3C" />
        <Text style={styles.loadingText}>Preparing your booking…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const extrasTotal = store.extras.reduce((s, e) => s + e.price_snapshot, 0)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Order Summary</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Booking ref</Text>
          <Text style={styles.rowValue}>{booking?.booking_ref}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Pickup</Text>
          <Text style={styles.rowValue}>{store.pickupDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dropoff</Text>
          <Text style={styles.rowValue}>{store.dropoffDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Duration</Text>
          <Text style={styles.rowValue}>{days} day{days !== 1 ? 's' : ''}</Text>
        </View>
        {extrasTotal > 0 && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Extras</Text>
            <Text style={styles.rowValue}>€{extrasTotal.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total (incl. VAT)</Text>
          <Text style={styles.totalValue}>€{booking?.total_price.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payBtn, (!paymentReady || paying) && styles.payBtnDisabled]}
        onPress={handlePay}
        disabled={!paymentReady || paying}
      >
        {paying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payBtnText}>
            Pay €{booking?.total_price.toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.secureNote}>🔒 Secured by Stripe</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  backBtn: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { fontSize: 14, color: '#6B7280' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#407E3C' },
  payBtn: {
    backgroundColor: '#407E3C',
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secureNote: { textAlign: 'center', fontSize: 13, color: '#9CA3AF' },
})
