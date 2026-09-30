import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import SearchBar from '../design-system/SearchBar.jsx'
import StatusFilter from '../design-system/StatusFilter.jsx'
import ExpiryFilter from '../design-system/ExpiryFilter.jsx'
import PatentDetail from '../design-system/PatentDetail.jsx'
import GlassPanel from '../design-system/GlassPanel.jsx'
import StatusPill from '../design-system/StatusPill.jsx'
import Button from '../design-system/Button.jsx'

// patent_id is a bigint identity column — ilike isn't valid on it, so it's
// only searchable via an exact numeric match, not substring matching.
const TEXT_SEARCH_COLUMNS = ['title', 'inventor_name', 'status']
const RESULT_LIMIT = 8
// The status list below the filter shows the most recently published patents
// for the selected status; capped so the panel stays a bounded, scrollable box.
const STATUS_LIST_LIMIT = 50

const daysUntil = (date) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
const toISODate = (date) => date.toISOString().slice(0, 10)

export default function SearchScreen({ statuses, selected, onSelect, savedIds = [], onSave }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [expirySoon, setExpirySoon] = useState(false)
  const [expiryDays, setExpiryDays] = useState('90')
  const [filterTouched, setFilterTouched] = useState(false)
  const [statusList, setStatusList] = useState([])
  const [statusListLoading, setStatusListLoading] = useState(false)
  const [statusListError, setStatusListError] = useState(null)
  const [fetchingLive, setFetchingLive] = useState(false)
  const [fetchLiveError, setFetchLiveError] = useState(null)
  const [associated, setAssociated] = useState([])
  const [associatedLoading, setAssociatedLoading] = useState(false)
  const [associatedError, setAssociatedError] = useState(null)

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
    setFetchLiveError(null)

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

  // Whenever a filter changes, load patents for the list — up to STATUS_LIST_LIMIT.
  // Default order is most recently published; with "Expiring soon" on it's instead
  // the patents whose expiry_date falls within the chosen window, soonest first.
  useEffect(() => {
    if (!isSupabaseConfigured || !filterTouched) return
    let live = true
    setStatusListLoading(true)
    setStatusListError(null)

    let request = supabase.from('patents').select('*')
    if (statusFilter !== 'All') {
      request = request.eq('status', statusFilter)
    }
    if (expirySoon) {
      const days = Math.max(1, Math.floor(Number(expiryDays)) || 1)
      request = request
        .gte('expiry_date', toISODate(new Date()))
        .lte('expiry_date', toISODate(new Date(Date.now() + days * 86400000)))
        .order('expiry_date', { ascending: true })
    } else {
      request = request.order('publication_date', { ascending: false, nullsFirst: false })
    }

    request.limit(STATUS_LIST_LIMIT).then(({ data, error }) => {
      if (!live) return
      if (error) {
        setStatusListError(error.message)
        setStatusList([])
      } else {
        setStatusList(data ?? [])
      }
      setStatusListLoading(false)
    })

    return () => { live = false }
  }, [statusFilter, filterTouched, expirySoon, expiryDays])

  useEffect(() => {
  if (!isSupabaseConfigured || !selected?.patent_id) {
    setAssociated([])
    setAssociatedError(null)
    return
  }
  let live = true
  setAssociatedLoading(true)
  setAssociatedError(null)

  ;(async () => {
    const { data: links, error: linkError } = await supabase
      .from('patent_associations')
      .select('associated_patent_id, association_type')
      .eq('patent_id', selected.patent_id)

    if (!live) return
    if (linkError) {
      setAssociatedError(linkError.message)
      setAssociated([])
      setAssociatedLoading(false)
      return
    }
    if (!links?.length) {
      setAssociated([])
      setAssociatedLoading(false)
      return
    }

    const { data: patents, error: patentError } = await supabase
      .from('patents')
      .select('*')
      .in('patent_id', links.map((l) => l.associated_patent_id))

    if (!live) return
    if (patentError) {
      setAssociatedError(patentError.message)
      setAssociated([])
    } else {
      const found = new Map((patents ?? []).map((p) => [String(p.patent_id), p]))
      setAssociated(
        links
          .map((l) => {
            const p = found.get(String(l.associated_patent_id))
            return {
              ...(p ?? { patent_id: l.associated_patent_id }),
              association_type: l.association_type,
              inDb: !!p,
            }
          })
          .sort((a, b) => (a.association_type ?? '').localeCompare(b.association_type ?? ''))
      )
    }
    setAssociatedLoading(false)
  })()

  return () => { live = false }
}, [selected?.patent_id])

  function handleStatusChange(status) {
    setFilterTouched(true)
    setStatusFilter(status)
    onSelect(null)
  }

  function handleExpiryToggle() {
    setFilterTouched(true)
    setExpirySoon((on) => !on)
    onSelect(null)
  }

  function handleSelect(patent) {
    onSelect(patent)
    setQuery(patent.title || patent.patent_id || '')
    setDropdownOpen(false)
  }

  async function handleFetchLive() {
    const patentId = query.trim()
    setFetchingLive(true)
    setFetchLiveError(null)
    const { data, error } = await supabase.functions.invoke('fetch-patent', { body: { patent_id: patentId } })
    setFetchingLive(false)
    if (error) {
      let message = error.message || 'Failed to fetch patent from IPONZ.'
      if (typeof error.context?.json === 'function') {
        try {
          const body = await error.context.json()
          if (body?.error) message = body.error
        } catch { /* keep default message */ }
      }
      setFetchLiveError(message)
      return
    }
    if (data?.patent) {
      handleSelect(data.patent)
    } else {
      setFetchLiveError('Patent not found in IPONZ.')
    }
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
       canFetchLive={isSupabaseConfigured && !searchLoading && !searchError && results.length === 0 && /^\d+$/.test(query.trim())}
       fetchingLive={fetchingLive}
       fetchLiveError={fetchLiveError}
       onFetchLive={handleFetchLive}
     />

    <StatusFilter options={statuses} value={statusFilter} onChange={handleStatusChange} />

      <ExpiryFilter active={expirySoon} days={expiryDays} onToggle={handleExpiryToggle} onDaysChange={setExpiryDays} />

     {!selected && (
     <GlassPanel style={{ width: '100%', maxWidth: 'var(--ipf-max-content)', display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-2)', textAlign: 'left' }}>
       {!filterTouched ? (
         <div style={{ padding: '12px 14px', fontSize: 'var(--ipf-type-sm-size)', color: 'var(--ipf-text-secondary)' }}>
           Search for patent details here.
         </div>
       ) : statusListError ? (
         <div style={{ padding: '12px 14px', fontSize: 'var(--ipf-type-sm-size)', color: 'var(--ipf-text-danger)' }}>{statusListError}</div>
       ) : statusListLoading ? (
         <div style={{ padding: '12px 14px', fontSize: 'var(--ipf-type-sm-size)', color: 'var(--ipf-text-secondary)' }}>Loading patents…</div>
       ) : statusList.length === 0 ? (
         <div style={{ padding: '12px 14px', fontSize: 'var(--ipf-type-sm-size)', color: 'var(--ipf-text-secondary)' }}>
           {expirySoon
             ? `No ${statusFilter === 'All' ? 'patents' : `“${statusFilter}” patents`} expiring within ${expiryDays || 0} days.`
             : `No patents found for “${statusFilter}”.`}
         </div>
       ) : (
         statusList.map((p) => {
           const active = selected?.patent_id === p.patent_id
           return (
             <button
               key={p.patent_id} type="button"
               onClick={() => onSelect(p)}
               style={{
                 display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ipf-space-4)',
                 width: '100%', padding: '10px 14px', border: 'none', borderRadius: 'var(--ipf-radius-sm)',
                background: active ? 'var(--ipf-state-active)' : 'transparent',
                color: 'var(--ipf-text-heading)', textAlign: 'left', cursor: 'pointer', font: 'inherit',