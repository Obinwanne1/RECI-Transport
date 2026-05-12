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
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/auth'
import { apiGet } from '@/lib/api'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: string
  licence_verified: boolean
  corporate_account_id: string | null
}

export default function AccountScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    apiGet<UserProfile>('/api/account/profile')
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Sign in to view your account.</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#407E3C" /></View>
  }

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
    : user.email

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.first_name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{profile?.email ?? user.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Role</Text>
          <Text style={styles.rowValue}>{profile?.role ?? '—'}</Text>
        </View>
        {profile?.phone && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Phone</Text>
            <Text style={styles.rowValue}>{profile.phone}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Licence Verified</Text>
          <Text style={[styles.rowValue, { color: profile?.licence_verified ? '#407E3C' : '#9CA3AF' }]}>
            {profile?.licence_verified ? '✓ Verified' : 'Not verified'}
          </Text>
        </View>
        {profile?.corporate_account_id && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Account Type</Text>
            <Text style={styles.rowValue}>Corporate</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  signInBtn: {
    backgroundColor: '#407E3C',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  signInBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#407E3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  email: { fontSize: 14, color: '#6B7280' },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 6,
    paddingVertical: 13,
    alignItems: 'center',
  },
  signOutBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '600' },
})
