import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { apiGet } from '@/lib/api'
import { useBookingStore, ExtraSelection } from '@/store/bookingStore'

interface Extra {
  id: string
  name: string
  description: string | null
  price_per_day: number
  is_one_time_fee: boolean
  exclusive_group: string | null
  is_active: boolean
}

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.max(1, Math.round(ms / 86400000))
}

export default function ExtrasScreen() {
  const router = useRouter()
  const { pickupDate, dropoffDate, extras: selected, setExtras } = useBookingStore()
  const [extras, setExtrasData] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)

  const days = pickupDate && dropoffDate ? daysBetween(pickupDate, dropoffDate) : 1

  useEffect(() => {
    apiGet<Extra[]>('/api/extras')
      .then(setExtrasData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function isSelected(id: string) {
    return selected.some((s) => s.extra_id === id)
  }

  function toggle(extra: Extra) {
    const extraCost = extra.is_one_time_fee ? extra.price_per_day : extra.price_per_day * days

    if (extra.exclusive_group) {
      // Remove others in same exclusive group, then toggle this one
      const withoutGroup = selected.filter((s) => {
        const e = extras.find((ex) => ex.id === s.extra_id)
        return e?.exclusive_group !== extra.exclusive_group
      })
      if (isSelected(extra.id)) {
        setExtras(withoutGroup)
      } else {
        setExtras([...withoutGroup, { extra_id: extra.id, quantity: 1, price_snapshot: extraCost }])
      }
    } else {
      if (isSelected(extra.id)) {
        setExtras(selected.filter((s) => s.extra_id !== extra.id))
      } else {
        setExtras([...selected, { extra_id: extra.id, quantity: 1, price_snapshot: extraCost }])
      }
    }
  }

  const extrasTotal = selected.reduce((sum, s) => sum + s.price_snapshot, 0)

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#407E3C" /></View>
  }

  // Group by exclusive_group
  const groups: { label: string | null; items: Extra[] }[] = []
  const seen = new Set<string>()
  for (const e of extras) {
    const key = e.exclusive_group ?? `__single__${e.id}`
    if (!seen.has(key)) {
      seen.add(key)
      groups.push({
        label: e.exclusive_group,
        items: extras.filter((ex) => (ex.exclusive_group ?? `__single__${ex.id}`) === key),
      })
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {groups.map((group) => (
        <View key={group.label ?? group.items[0].id} style={styles.group}>
          {group.label && (
            <Text style={styles.groupLabel}>
              {group.label.replace(/_/g, ' ')} · choose one
            </Text>
          )}
          {group.items.map((extra) => (
            <TouchableOpacity
              key={extra.id}
              style={[styles.extraRow, isSelected(extra.id) && styles.extraRowSelected]}
              onPress={() => toggle(extra)}
            >
              <View style={[styles.checkbox, isSelected(extra.id) && styles.checkboxSelected]}>
                {isSelected(extra.id) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.extraInfo}>
                <Text style={styles.extraName}>{extra.name}</Text>
                {extra.description && (
                  <Text style={styles.extraDesc}>{extra.description}</Text>
                )}
              </View>
              <Text style={styles.extraPrice}>
                €{extra.is_one_time_fee
                  ? `${extra.price_per_day}`
                  : `${extra.price_per_day}/day`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {extrasTotal > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Extras total</Text>
          <Text style={styles.totalValue}>€{extrasTotal.toFixed(2)}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.continueBtn} onPress={() => router.push('/book/driver')}>
        <Text style={styles.continueBtnText}>Continue to Driver Details →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  group: { gap: 8 },
  groupLabel: { fontSize: 12, fontWeight: '600', color: '#407E3C', textTransform: 'uppercase', letterSpacing: 0.5 },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  extraRowSelected: { borderColor: '#407E3C', backgroundColor: '#F0F7EF' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#407E3C', borderColor: '#407E3C' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  extraInfo: { flex: 1 },
  extraName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  extraDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  extraPrice: { fontSize: 14, fontWeight: '600', color: '#407E3C' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#407E3C' },
  continueBtn: {
    backgroundColor: '#407E3C',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
