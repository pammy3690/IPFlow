import Icon from './Icon.jsx'

function displayTitle(patent) {
  return patent.title || patent.patent_id || 'Untitled patent'
}

export default function SearchBar({ query = '', onQueryChange, results = [], loading, error, showResults, onSelect, onFocus, onBlur, placeholder = 'Search patents' }) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 'var(--ipf-max-search)' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-4)', width: '100%',
          padding: 'var(--ipf-search-pad)', borderRadius: 'var(--ipf-radius-pill)',
          background: 'var(--ipf-surface-glass-raised)', border: '1px solid var(--ipf-border-glass)',
          backdropFilter: 'var(--ipf-blur-search)', WebkitBackdropFilter: 'var(--ipf-blur-search)',
          boxShadow: 'var(--ipf-shadow-search)', boxSizing: 'border-box',
        }}
      >
        <Icon name="search" size={18} color="var(--ipf-text-secondary)" />
        <input
          type="text" value={query} placeholder={placeholder}
          onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
          onFocus={onFocus} onBlur={onBlur}
          style={{ flex: '1 1 auto', minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-body-size)', color: 'var(--ipf-text-primary)' }}
        />
        <Icon
          name={loading ? 'loader-2' : 'mic'} size={18}
          color={loading ? 'var(--ipf-text-secondary)' : 'var(--ipf-text-muted)'}
          style={loading ? { animation: 'ipf-spin var(--ipf-dur-spin) linear infinite' } : undefined}
        />
      </div>

      {showResults && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 20,
            maxHeight: 320, overflowY: 'auto', borderRadius: 'var(--ipf-radius-lg)',
            background: 'var(--ipf-surface-menu)', border: '1px solid var(--ipf-border-glass)',
            backdropFilter: 'var(--ipf-blur-menu)', WebkitBackdropFilter: 'var(--ipf-blur-menu)',
            boxShadow: 'var(--ipf-shadow-menu)', padding: 'var(--ipf-space-2)', textAlign: 'left',
          }}
        >
          {error && <div style={{ padding: '12px 14px', fontSize: 'var(--ipf-type-sm-size)', color: 'var(--ipf-text-danger)' }}>{error}</div>}
          {!error && !loading && results.length === 0 && query.trim() !== '' && (
            <div style={{ padding: '12px 14px', fontSize: 'var(--ipf-type-sm-size)', color: 'var(--ipf-text-secondary)' }}>No patents found for “{query}”.</div>
          )}
          {!error && results.map((p) => (
            <button
              key={p.patent_id ?? p.id} type="button"
              onMouseDown={() => onSelect && onSelect(p)}
              style={{
                display: 'flex', flexDirection: 'column', width: '100%', gap: 'var(--ipf-space-1)',
                padding: '10px 14px', border: 'none', borderRadius: 'var(--ipf-radius-sm)',
                background: 'transparent', color: 'var(--ipf-text-heading)', textAlign: 'left',
                cursor: 'pointer', font: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 'var(--ipf-type-sm-size)', fontWeight: 600 }}>{displayTitle(p)}</span>
              <span style={{ fontSize: 'var(--ipf-type-xs-size)', color: 'var(--ipf-text-muted)' }}>
                {p.patent_id ? `#${p.patent_id}` : ''}{p.inventor_name ? ` · ${p.inventor_name}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
