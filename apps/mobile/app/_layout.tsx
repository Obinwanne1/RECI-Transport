import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StripeProvider } from '@stripe/stripe-react-native'
import { AuthProvider, useAuth } from '@/context/auth'

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

function RootNavigator() {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!session && !inAuth) {
      router.replace('/(auth)/login')
    } else if (session && inAuth) {
      router.replace('/(tabs)')
    }
  }, [session, loading, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="vehicles" options={{ headerShown: true, title: 'Available Vehicles' }} />
      <Stack.Screen name="book/[vehicleId]" options={{ headerShown: true, title: 'Vehicle Details' }} />
      <Stack.Screen name="book/extras" options={{ headerShown: true, title: 'Add Extras' }} />
      <Stack.Screen name="book/driver" options={{ headerShown: true, title: 'Driver Details' }} />
      <Stack.Screen name="book/payment" options={{ headerShown: true, title: 'Payment' }} />
      <Stack.Screen name="book/confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="booking/[id]" options={{ headerShown: true, title: 'Booking Details' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StripeProvider publishableKey={STRIPE_KEY}>
        <RootNavigator />
      </StripeProvider>
    </AuthProvider>
  )
}
