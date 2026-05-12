import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useBookingStore } from '@/store/bookingStore'

const DriverSchema = z.object({
  driverFirstName: z.string().min(1, 'Required'),
  driverLastName: z.string().min(1, 'Required'),
  driverEmail: z.string().email('Invalid email'),
  driverPhone: z.string().min(6, 'Invalid phone'),
  driverLicenceNumber: z.string().min(1, 'Required'),
})

type DriverForm = z.infer<typeof DriverSchema>

export default function DriverScreen() {
  const router = useRouter()
  const { setDriver, driverFirstName, driverLastName, driverEmail, driverPhone, driverLicenceNumber } = useBookingStore()

  const { control, handleSubmit, formState: { errors } } = useForm<DriverForm>({
    resolver: zodResolver(DriverSchema),
    defaultValues: {
      driverFirstName,
      driverLastName,
      driverEmail,
      driverPhone,
      driverLicenceNumber,
    },
  })

  function onSubmit(data: DriverForm) {
    setDriver(data)
    router.push('/book/payment')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Driver Information</Text>

      {(
        [
          { name: 'driverFirstName', label: 'First Name', placeholder: 'John', autoCapitalize: 'words' },
          { name: 'driverLastName', label: 'Last Name', placeholder: 'Doe', autoCapitalize: 'words' },
          { name: 'driverEmail', label: 'Email', placeholder: 'john@example.com', keyboardType: 'email-address', autoCapitalize: 'none' },
          { name: 'driverPhone', label: 'Phone', placeholder: '+49 170 1234567', keyboardType: 'phone-pad' },
          { name: 'driverLicenceNumber', label: 'Licence Number', placeholder: 'B123456789', autoCapitalize: 'characters' },
        ] as const
      ).map((field) => (
        <View key={field.name} style={styles.field}>
          <Text style={styles.label}>{field.label}</Text>
          <Controller
            control={control}
            name={field.name}
            render={({ field: f }) => (
              <TextInput
                style={[styles.input, errors[field.name] && styles.inputError]}
                placeholder={field.placeholder}
                placeholderTextColor="#9CA3AF"
                autoCapitalize={field.autoCapitalize as never}
                keyboardType={('keyboardType' in field ? field.keyboardType : 'default') as never}
                value={f.value}
                onChangeText={f.onChange}
                onBlur={f.onBlur}
              />
            )}
          />
          {errors[field.name] && (
            <Text style={styles.errorText}>{errors[field.name]?.message}</Text>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.continueBtn} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.continueBtnText}>Continue to Payment →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  inputError: { borderColor: '#DC2626' },
  errorText: { fontSize: 12, color: '#DC2626' },
  continueBtn: {
    backgroundColor: '#407E3C',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
