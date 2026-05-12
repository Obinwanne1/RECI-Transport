import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ewrknfmpdifdgxlmqbzi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cmtuZm1wZGlmZGd4bG1xYnppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MDYyOCwiZXhwIjoyMDk0MTY2NjI4fQ.W9yt2J63AjLGPM3n7xgzfHoZIzTxUKbAXCl1MulnTq8',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data, error } = await supabase.auth.admin.createUser({
  email: 'iromanus@gmail.com',
  password: 'Admin1234!',
  email_confirm: true,
  user_metadata: { first_name: 'Romanus', last_name: 'Igwe' }
})

if (error) { console.error('Error:', error.message); process.exit(1) }
console.log('User created:', data.user.id)

// Set role to admin in user_profiles
const { error: profileErr } = await supabase
  .from('user_profiles')
  .update({ role: 'admin' })
  .eq('id', data.user.id)

if (profileErr) console.error('Profile update error:', profileErr.message)
else console.log('Role set to admin. Done.')
