import { useEffect, useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import StatusFilter from './components/StatusFilter'
import PatentDetail from './components/PatentDetail'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'
import './App.css'

// patent_id is a bigint identity column — ilike isn't valid on it, so it's
// only searchable via an exact numeric match, not substring matching.
const TEXT_SEARCH_COLUMNS = ['title', 'inventor_name', 'status']
const RESULT_LIMIT = 8

export default function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [statusOptions, setStatusOptions] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')

  const [selectedPatent, setSelectedPatent] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('patents')
      .select('status')
      .then(({ data, error }) => {
        if (error || !data) return
        const unique = Array.from(new Set(data.map((row) => row.status).filter(Boolean))).sort()
        setStatusOptions(unique)
      })
  }, [])

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
    setSelectedPatent(patent)
    setQuery(patent.title || patent.patent_id || '')
    setDropdownOpen(false)
  }

  return (
    <div className="page">
      <Header />

      <SearchBar
        query={query}
        onQueryChange={(value) => {
          setQuery(value)
          setDropdownOpen(true)
        }}
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

      <StatusFilter options={statusOptions} value={statusFilter} onChange={setStatusFilter} />

      <PatentDetail patent={selectedPatent} loading={detailLoading} />
    </div>
  )
}
