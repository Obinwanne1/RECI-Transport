$sql = Get-Content 'C:\Users\rigwe\Desktop\reci-transport\supabase\seed_vehicles.sql' -Raw -Encoding UTF8
npx supabase@latest db execute --sql $sql
