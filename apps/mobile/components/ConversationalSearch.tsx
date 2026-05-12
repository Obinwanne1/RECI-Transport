import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { apiPost } from '@/lib/api'

interface SearchParams {
  pickup_date: string | null
  dropoff_date: string | null
  category_slug: string | null
  passenger_capacity: number | null
  fuel_type: string | null
  transmission: string | null
}

interface AISearchResponse {
  params: SearchParams
  message: string
  confidence: number
}

interface Props {
  onResult: (params: SearchParams, message: string) => void
}

export default function ConversationalSearch({ onResult }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState<string | null>(null)

  async function handleSearch() {
    const trimmed = query.trim()
    if (trimmed.length < 3) return
    setLoading(true)
    setAiMessage(null)
    try {
      const res = await apiPost<AISearchResponse>('/api/ai/search', { query: trimmed })
      setAiMessage(res.message)
      onResult(res.params, res.message)
    } catch {
      setAiMessage('Could not parse your query — try the form below.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>What are you looking for?</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder='e.g. "Van for 3 days next Friday"'
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      {aiMessage && <Text style={styles.aiMessage}>{aiMessage}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F7EF',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#407E3C' },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#fff',
  },
  sendBtn: {
    backgroundColor: '#407E3C',
    borderRadius: 8,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  aiMessage: { fontSize: 13, color: '#407E3C', fontStyle: 'italic' },
})
