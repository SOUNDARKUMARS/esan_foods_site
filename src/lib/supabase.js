import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tacyfcsyswlwbdtminnz.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhY3lmY3N5c3dsd2JkdG1pbm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODA0OTcsImV4cCI6MjEwNjk1NjQ5N30.cj2RGE7PPoIirnGncF7-MSFlovQ4Vuv4ynJ3Y8yupYE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)