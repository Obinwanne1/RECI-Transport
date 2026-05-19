import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ewrknfmpdifdgxlmqbzi.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cmtuZm1wZGlmZGd4bG1xYnppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MDYyOCwiZXhwIjoyMDk0MTY2NjI4fQ.W9yt2J63AjLGPM3n7xgzfHoZIzTxUKbAXCl1MulnTq8'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const EMAIL = 'admin@reci.test'
const PASSWORD = 'Admin123!'

// Create user
const { data: user, error: createError } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
})

if (createError) {
  if (createError.message.includes('already been registered')) {
    console.log('User already exists — skipping creation')
  } else {
    console.error('Create user failed:', createError.message)
    process.exit(1)
  }
}

const userId = user?.user?.id

// Get ID if user already existed
let finalId = userId
if (!finalId) {
  const { data } = await admin.auth.admin.listUsers()
  const existing = data?.users?.find(u => u.email === EMAIL)
  finalId = existing?.id
}

if (!finalId) {
  console.error('Could not find user ID')
  process.exit(1)
}

console.log('User ID:', finalId)

// Upsert admin profile
const { error: profileError } = await admin
  .from('user_profiles')
  .upsert({ id: finalId, email: EMAIL, role: 'admin' }, { onConflict: 'id' })

if (profileError) {
  console.error('Profile upsert failed:', profileError.message)
  process.exit(1)
}

console.log('Done! Login with:')
console.log('  Email:', EMAIL)
console.log('  Password:', PASSWORD)
