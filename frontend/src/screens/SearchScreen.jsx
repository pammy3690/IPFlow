import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import SearchBar from '../design-system/SearchBar.jsx'
import StatusFilter from '../design-system/StatusFilter.jsx'
import PatentDetail from '../design-system/PatentDetail.jsx'
import Button from '../design-system/Button.jsx'

// patent_id is a bigint identity column — ilike isn't valid on it, so it's
// only searchable via an exact numeric match, not substring matching.
const TEXT_SEARCH_COLUMNS = ['title', 'inventor_name', 'status']
const RESULT_LIMIT = 8

export default function SearchScreen({ statuses, selected, onSelect, savedIds = [], onSave }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const term = query.trim()
    if (term === '') {
      setResults([])
      setSearchError(null)
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    setSearchError(null)

    const timeout = setTimeout(async () => {
      const filters = TEXT_SEARCH_COLUMNS.map((col) => `${col}.ilike.%${term}%`)
      if (/^\d+$/.test(term)) {
        filters.push(`patent_id.eq.${term}`)
      }
      let request = supabase.from('patents').select('*').or(filters.join(','))
      if (statusFilter !== 'All') {
        request = request.eq('status', statusFilter)
      }
      const { data, error } = await request.limit(RESULT_LIMIT)

      if (error) {
        setSearchError(error.message)
        setResults([])
      } else {
        setResults(data ?? [])
      }
      setSearchLoading(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, statusFilter])

  function handleSelect(patent) {
    onSelect(patent)
    setQuery(patent.title || patent.patent_id || '')
    setDropdownOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>
      <SearchBar
        query={query}
        onQueryChange={(value) => { setQuery(value); setDropdownOpen(true) }}
        results={results}
        loading={searchLoading}
        error={
          !isSupabaseConfigured
            ? 'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
            : searchError
        }
        showResults={dropdownOpen && query.trim() !== ''}
        onSelect={handleSelect}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setDropdownOpen(false)}
      />

      <StatusFilter options={statuses} value={statusFilter} onChange={setStatusFilter} />

      {selected && (
        <Button
          variant={savedIds.includes(selected.patent_id) ? 'active' : 'solid'}
          icon={savedIds.includes(selected.patent_id) ? 'circle-x' : 'bookmark-plus'}
          onClick={() => onSave(selected.patent_id)}
        >
          {savedIds.includes(selected.patent_id) ? 'Remove from dashboard' : 'Save to dashboard'}
        </Button>
      )}

      <PatentDetail patent={selected} />
    </div>
  )
}
