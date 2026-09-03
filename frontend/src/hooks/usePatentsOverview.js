import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

const OVERVIEW_LIMIT = 30

// Shared, once-per-session fetch of patents ordered by soonest expiry, plus
// the distinct set of statuses — used by the Dashboard, Calendar, Analytics
// and Search screens so they don't each re-query the same table.
export function usePatentsOverview(enabled) {
  const [patents, setPatents] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let live = true
    setLoading(true)

    Promise.all([
      supabase
        .from('patents')
        .select('patent_id,title,status,inventor_name,abstract,expiry_date,filing_date,publication_date')
        .order('expiry_date', { ascending: true, nullsFirst: false })
        .limit(OVERVIEW_LIMIT),
      supabase.from('patents').select('status'),
    ]).then(([overview, statusRows]) => {
      if (!live) return
      setPatents(overview.data ?? [])
      const unique = Array.from(new Set((statusRows.data ?? []).map((r) => r.status).filter(Boolean))).sort()
      setStatuses(unique)
      setLoading(false)
    })

    return () => { live = false }
  }, [enabled])

  return { patents, statuses, loading }
}
