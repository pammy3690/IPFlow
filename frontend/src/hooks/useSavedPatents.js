import { useCallback, useEffect, useState } from 'react'

// Persists "saved to dashboard" patent ids per-browser. There is no
// saved-patents table in Supabase yet, so this is scoped per signed-in
// email (or a shared "guest" bucket) via localStorage.
export function useSavedPatents(scopeKey) {
  const storageKey = `ipflow.saved.${scopeKey || 'guest'}`
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setSavedIds(raw ? JSON.parse(raw) : [])
    } catch {
      setSavedIds([])
    }
  }, [storageKey])

  const savePatent = useCallback((patentId) => {
    setSavedIds((ids) => {
      if (ids.includes(patentId)) return ids
      const next = [...ids, patentId]
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* ignore quota errors */ }
      return next
    })
  }, [storageKey])

  return { savedIds, savePatent }
}
