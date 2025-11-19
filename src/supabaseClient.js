import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkijocroehhrlqyhwowp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWpvY3JvZWhocmxxeWh3b3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Njg1MzksImV4cCI6MjA3OTA0NDUzOX0.Id5COEeYmWq9ud0JCx-mtRMZWvOQ4A1j98h6zym21z8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)