import { useEffect, useState } from 'react'
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import VehicleCard from '@/components/VehicleCard'
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
  category: { name: string; slug: string } | null
}

export default function VehiclesScreen() {
  const params = useLocalSearchParams<{
    pickup_date: string
    dropoff_date: string
    category_slug: string
    location_id: string
  }>()
  const router = useRouter()
  const { setVehicle } = useBookingStore()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet<Vehicle[]>('/api/vehicles', {
          pickup_date: params.pickup_date,
          dropoff_date: params.dropoff_date,
          category_slug: params.category_slug || undefined,
          location_id: params.location_id,
        })
        setVehicles(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load vehicles')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleBook(vehicleId: string) {
    setVehicle(vehicleId)
    router.push(`/book/${vehicleId}`)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407E3C" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    )
  }

  if (vehicles.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No vehicles available for these dates.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.count}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} available</Text>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => (
          <VehicleCard vehicle={item} onBook={handleBook} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  list: { padding: 16, paddingBottom: 32 },
  count: { fontSize: 13, color: '#6B7280', paddingHorizontal: 16, paddingTop: 12 },
  error: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  empty: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
})
