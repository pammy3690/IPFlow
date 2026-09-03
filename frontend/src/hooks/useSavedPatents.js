import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

const GUEST_STORAGE_KEY = 'ipflow.saved.guest'

function persistGuest(ids) {
  try { localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(ids)) } catch { /* ignore quota errors */ }
}

// Signed-in users: saved patents live in the `saved_patents` table in
// Supabase (RLS-scoped to auth.uid()), synced across devices.
// Guests (no userId): kept in localStorage only — there's no user to
// attach the rows to, and RLS would reject the insert anyway.
export function useSavedPatents(userId) {
  const [savedIds, setSavedIds] = useState([])
  // Mirrors savedIds so toggleSavedPatent can read the latest value without
  // being recreated every time savedIds changes, and without doing the
  // Supabase call inside a setState updater (StrictMode invokes those twice
  // in dev, which double-fires network side effects).
  const savedIdsRef = useRef(savedIds)
  savedIdsRef.current = savedIds

  useEffect(() => {
    let live = true

    if (userId && isSupabaseConfigured) {
      supabase
        .from('saved_patents')
        .select('patent_id')
        .eq('user_id', userId)
        .then(({ data, error }) => {
          if (!live) return
          if (error) {
            console.error('Failed to load saved patents', error)
            return
          }
          setSavedIds((data ?? []).map((row) => row.patent_id))
        })
    } else {
      try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY)
        setSavedIds(raw ? JSON.parse(raw) : [])
      } catch {
        setSavedIds([])
      }
    }

    return () => { live = false }
  }, [userId])

  // Saves a patent if it isn't already saved, or unsaves it if it is.
  const toggleSavedPatent = useCallback((patentId) => {
    const previous = savedIdsRef.current
    const isSaved = previous.includes(patentId)
    const next = isSaved ? previous.filter((id) => id !== patentId) : [...previous, patentId]
    setSavedIds(next)

    if (userId && isSupabaseConfigured) {
      const request = isSaved
        ? supabase.from('saved_patents').delete().eq('user_id', userId).eq('patent_id', patentId)
        : supabase.from('saved_patents').insert({ user_id: userId, patent_id: patentId })

      request.then(({ error }) => {
        if (error && error.code !== '23505') { // ignore unique-violation races on insert
          console.error(isSaved ? 'Failed to remove saved patent' : 'Failed to save patent', error)
          setSavedIds(previous) // roll back the optimistic update
        }
      })
    } else {
      persistGuest(next)
    }
  }, [userId])

  return { savedIds, savePatent: toggleSavedPatent }
}
