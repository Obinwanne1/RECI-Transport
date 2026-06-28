import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ewrknfmpdifdgxlmqbzi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cmtuZm1wZGlmZGd4bG1xYnppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MDYyOCwiZXhwIjoyMDk0MTY2NjI4fQ.W9yt2J63AjLGPM3n7xgzfHoZIzTxUKbAXCl1MulnTq8'
)

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`

const patches = [
  { id: 'e0000000-0000-0000-0000-000000000011', image_urls: [U('1568605117036-5fe5e7bab0b7')] }, // Opel Corsa - economy red car
  { id: 'e0000000-0000-0000-0000-000000000012', image_urls: [U('1494976388531-d1058494cdd8')] }, // Skoda Octavia - compact
  { id: 'e0000000-0000-0000-0000-000000000013', image_urls: [U('1580273916550-e323be2ae537')] }, // Hyundai Tucson - SUV
  { id: 'e0000000-0000-0000-0000-000000000014', image_urls: [U('1558618666-fcd25c85cd64')] },   // VW Crafter - van
]

for (const { id, image_urls } of patches) {
  const { error } = await supabase.from('vehicles').update({ image_urls }).eq('id', id)
  if (error) console.error(`✗ ${id}: ${error.message}`)
  else console.log(`✓ ${id}`)
}
console.log('Done.')
