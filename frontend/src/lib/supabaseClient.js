import { createClient } from '@supabase/supabase-js'

// Flip VITE_SUPABASE_USE_INTERNAL=true in frontend/.env to point the whole app
// at the internal/testing project (VITE_SUPABASE_*_INTERNAL) instead of the
// default one. Anything falsy (unset, "false", "0") keeps the default project.
const useInternal = ['true', '1', 'yes'].includes(
  String(import.meta.env.VITE_SUPABASE_USE_INTERNAL || '').toLowerCase()
)

const supabaseUrl = useInternal
  ? import.meta.env.VITE_SUPABASE_URL_INTERNAL
  : import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = useInternal
  ? import.meta.env.VITE_SUPABASE_ANON_KEY_INTERNAL
  : import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseTarget = useInternal ? 'internal' : 'default'
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  const suffix = useInternal ? '_INTERNAL' : ''
  console.warn(
    `Supabase is not configured. Set VITE_SUPABASE_URL${suffix} and VITE_SUPABASE_ANON_KEY${suffix} in frontend/.env`
  )
} else if (useInternal) {
  console.info('Supabase: using internal/testing project (VITE_SUPABASE_*_INTERNAL)')
}

// Falls back to a harmless placeholder so createClient doesn't throw when
// env vars are missing during local setup — requests will simply fail until configured.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
