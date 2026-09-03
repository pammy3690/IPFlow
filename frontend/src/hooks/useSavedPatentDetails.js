import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

// usePatentsOverview only carries the 30 patents with the soonest expiry —
// a saved patent may well fall outside that window. This fetches full
// details for exactly the saved ids, so the Dashboard shows them regardless
// of where they land in the overview's ordering/limit.
export function useSavedPatentDetails(savedIds) {
  const [savedPatents, setSavedPatents] = useState([])

  useEffect(() => {
    if (!savedIds.length || !isSupabaseConfigured) {
      setSavedPatents([])
      return
    }
    let live = true

    supabase
      .from('patents')
      .select('patent_id,title,status,inventor_name,abstract,expiry_date,filing_date,publication_date')
      .in('patent_id', savedIds)
      .then(({ data, error }) => {
        if (!live) return
        if (error) {
          console.error('Failed to load saved patent details', error)
          return
        }
        setSavedPatents(data ?? [])
      })

    return () => { live = false }
  }, [savedIds])

  return savedPatents
}
