import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

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

interface Props {
  vehicle: Vehicle
  onBook: (id: string) => void
}

export default function VehicleCard({ vehicle, onBook }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>
          {vehicle.make[0]}{vehicle.model[0]}
        </Text>
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          {vehicle.category && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{vehicle.category.name}</Text>
            </View>
          )}
        </View>
        <Text style={styles.specs}>
          {vehicle.color} · {vehicle.fuel_type} · {vehicle.transmission}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>
            {vehicle.daily_rate != null ? `€${vehicle.daily_rate}/day` : 'Price on request'}
          </Text>
          <TouchableOpacity style={styles.bookBtn} onPress={() => onBook(vehicle.id)}>
            <Text style={styles.bookBtnText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { fontSize: 20, fontWeight: '700', color: '#9CA3AF' },
  info: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  badge: {
    backgroundColor: '#F0F7EF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, color: '#407E3C', fontWeight: '600' },
  specs: { fontSize: 13, color: '#6B7280' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 16, fontWeight: '700', color: '#407E3C' },
  bookBtn: {
    backgroundColor: '#407E3C',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
