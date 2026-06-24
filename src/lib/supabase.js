import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

export let supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export function setAccessToken(token) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  })
}
