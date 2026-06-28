/**
 * Patch image_urls on all 20 demo vehicles.
 * Uses Unsplash CDN — no hotlink restrictions, no auth needed for browser loads.
 * Run from apps/web/: node ../../update_images.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ewrknfmpdifdgxlmqbzi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cmtuZm1wZGlmZGd4bG1xYnppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MDYyOCwiZXhwIjoyMDk0MTY2NjI4fQ.W9yt2J63AjLGPM3n7xgzfHoZIzTxUKbAXCl1MulnTq8'
)

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`

const patches = [
  // ECONOMY
  { id: 'e0000000-0000-0000-0000-000000000001', image_urls: [U('1583121274602-3e2820c69888')] }, // VW Polo - compact blue hatchback
  { id: 'e0000000-0000-0000-0000-000000000002', image_urls: [U('1502877338535-766e1452684a')] }, // Toyota Yaris
  { id: 'e0000000-0000-0000-0000-000000000021', image_urls: [U('1568605117036-5fe5e7bab0b7')] }, // Renault Clio - red car
  { id: 'e0000000-0000-0000-0000-000000000022', image_urls: [U('1593941707882-a5bba14938c7')] }, // Opel Corsa-e - electric

  // COMPACT
  { id: 'e0000000-0000-0000-0000-000000000003', image_urls: [U('1494976388531-d1058494cdd8')] }, // VW Golf
  { id: 'e0000000-0000-0000-0000-000000000004', image_urls: [U('1583121274602-3e2820c69888')] }, // SEAT Leon - compact
  { id: 'e0000000-0000-0000-0000-000000000023', image_urls: [U('1555215695-3004980ad54e')] },   // BMW 118i - BMW studio
  { id: 'e0000000-0000-0000-0000-000000000024', image_urls: [U('1606664515524-ed2f786a0bd6')] }, // Audi A3

  // SUV
  { id: 'e0000000-0000-0000-0000-000000000005', image_urls: [U('1533473359331-0135ef1b58bf')] }, // VW Tiguan - SUV mountains
  { id: 'e0000000-0000-0000-0000-000000000006', image_urls: [U('1580273916550-e323be2ae537')] }, // Toyota RAV4 - white SUV road
  { id: 'e0000000-0000-0000-0000-000000000025', image_urls: [U('1519641471654-76ce0107ad1b')] }, // BMW X3 - black SUV
  { id: 'e0000000-0000-0000-0000-000000000026', image_urls: [U('1541899481282-d53bffe3c35d')] }, // Mercedes GLC - Mercedes SUV
  { id: 'e0000000-0000-0000-0000-000000000027', image_urls: [U('1619767886558-6af7483f7bc3')] }, // Audi Q5
  { id: 'e0000000-0000-0000-0000-000000000028', image_urls: [U('1533473359331-0135ef1b58bf')] }, // Volvo XC60 - SUV

  // VAN
  { id: 'e0000000-0000-0000-0000-000000000007', image_urls: [U('1558618666-fcd25c85cd64')] },   // Mercedes Sprinter - white van
  { id: 'e0000000-0000-0000-0000-000000000008', image_urls: [U('1558618666-fcd25c85cd64')] },   // Ford Transit
  { id: 'e0000000-0000-0000-0000-000000000029', image_urls: [U('1558618666-fcd25c85cd64')] },   // VW Transporter
  { id: 'e0000000-0000-0000-0000-000000000030', image_urls: [U('1558618666-fcd25c85cd64')] },   // Renault Trafic

  // PREMIUM
  { id: 'e0000000-0000-0000-0000-000000000031', image_urls: [U('1616422285623-13ff0162193c')] }, // Mercedes E 300 - luxury sedan
  { id: 'e0000000-0000-0000-0000-000000000032', image_urls: [U('1555215695-3004980ad54e')] },   // BMW 520d - BMW studio
]

let ok = 0
for (const { id, image_urls } of patches) {
  const { error } = await supabase
    .from('vehicles')
    .update({ image_urls })
    .eq('id', id)

  if (error) {
    console.error(`✗ ${id}: ${error.message}`)
  } else {
    ok++
    console.log(`✓ ${id}`)
  }
}

console.log(`\n${ok}/${patches.length} vehicles updated.`)
