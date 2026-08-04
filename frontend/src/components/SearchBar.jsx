import { Search, Mic, Loader2 } from 'lucide-react'

function displayTitle(patent) {
  return patent.title || patent.patent_id || 'Untitled patent'
}

export default function SearchBar({
  query,
  onQueryChange,
  results,
  loading,
  error,
  showResults,
  onSelect,
  onFocus,
  onBlur,
}) {
  return (
    <div className="search">
      <div className="search__bar">
        <Search className="search__icon" size={18} strokeWidth={2} />
        <input
          className="search__input"
          type="text"
          placeholder="Search patents"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {loading ? (
          <Loader2 className="search__icon search__icon--spin" size={18} />
        ) : (
          <Mic className="search__icon search__icon--mic" size={18} strokeWidth={2} />
        )}
      </div>

      {showResults && (
        <div className="search__dropdown">
          {error && <div className="search__message search__message--error">{error}</div>}

          {!error && !loading && results.length === 0 && query.trim() !== '' && (
            <div className="search__message">No patents found for “{query}”.</div>
          )}

          {!error &&
            results.map((patent) => (
              <button
                type="button"
                key={patent.id ?? patent.patent_id}
                className="search__result"
                // onMouseDown fires before the input's onBlur closes the dropdown
                onMouseDown={() => onSelect(patent)}
              >
                <span className="search__result-title">{displayTitle(patent)}</span>
                <span className="search__result-meta">
                  {patent.patent_id ? `#${patent.patent_id}` : ''}
                  {patent.inventor_name ? ` · ${patent.inventor_name}` : ''}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
