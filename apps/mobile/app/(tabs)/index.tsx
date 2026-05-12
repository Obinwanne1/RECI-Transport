import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import ConversationalSearch from '@/components/ConversationalSearch'
import { useBookingStore } from '@/store/bookingStore'

const CATEGORIES = [
  { label: 'Any', value: '' },
  { label: 'Economy', value: 'economy' },
  { label: 'Compact', value: 'compact' },
  { label: 'SUV', value: 'suv' },
  { label: 'Van', value: 'van' },
]

// Supabase location ID — Berlin HQ (matches seed data)
const DEFAULT_LOCATION_ID = '00000000-0000-0000-0000-000000000001'

function toDateString(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function HomeScreen() {
  const router = useRouter()
  const { setDates } = useBookingStore()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 3)

  const [pickupDate, setPickupDate] = useState(tomorrow)
  const [dropoffDate, setDropoffDate] = useState(dayAfter)
  const [category, setCategory] = useState('')
  const [showPickup, setShowPickup] = useState(false)
  const [showDropoff, setShowDropoff] = useState(false)

  function handleAIResult(params: {
    pickup_date: string | null
    dropoff_date: string | null
    category_slug: string | null
  }) {
    if (params.pickup_date) setPickupDate(new Date(params.pickup_date))
    if (params.dropoff_date) setDropoffDate(new Date(params.dropoff_date))
    if (params.category_slug) setCategory(params.category_slug)
  }

  function handleSearch() {
    setDates(toDateString(pickupDate), toDateString(dropoffDate), DEFAULT_LOCATION_ID)
    router.push({
      pathname: '/vehicles',
      params: {
        pickup_date: toDateString(pickupDate),
        dropoff_date: toDateString(dropoffDate),
        category_slug: category,
        location_id: DEFAULT_LOCATION_ID,
      },
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RECI Transport</Text>
        <Text style={styles.headerSub}>Berlin's AI-native vehicle rental</Text>
      </View>

      <ConversationalSearch onResult={handleAIResult} />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or search manually</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.form}>
        <Text style={styles.formLabel}>Pickup Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPickup(true)}>
          <Text style={styles.dateBtnText}>{toDateString(pickupDate)}</Text>
        </TouchableOpacity>
        {showPickup && (
          <DateTimePicker
            value={pickupDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(_e, d) => { setShowPickup(Platform.OS === 'ios'); if (d) setPickupDate(d) }}
          />
        )}

        <Text style={styles.formLabel}>Dropoff Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDropoff(true)}>
          <Text style={styles.dateBtnText}>{toDateString(dropoffDate)}</Text>
        </TouchableOpacity>
        {showDropoff && (
          <DateTimePicker
            value={dropoffDate}
            mode="date"
            minimumDate={pickupDate}
            onChange={(_e, d) => { setShowDropoff(Platform.OS === 'ios'); if (d) setDropoffDate(d) }}
          />
        )}

        <Text style={styles.formLabel}>Vehicle Type</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.catBtn, category === c.value && styles.catBtnActive]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={[styles.catBtnText, category === c.value && styles.catBtnTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search Vehicles</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 16 },
  header: { paddingVertical: 8, gap: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  headerSub: { fontSize: 14, color: '#6B7280' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, color: '#9CA3AF' },
  form: { gap: 8 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 8 },
  dateBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  dateBtnText: { fontSize: 15, color: '#1A1A1A' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  catBtnActive: { backgroundColor: '#407E3C', borderColor: '#407E3C' },
  catBtnText: { fontSize: 13, color: '#6B7280' },
  catBtnTextActive: { color: '#fff', fontWeight: '600' },
  searchBtn: {
    backgroundColor: '#407E3C',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
