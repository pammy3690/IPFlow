export default function StatusFilter({ options = [], value = 'All', onChange }) {
  const items = ['All', ...options]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ipf-space-3)', width: '100%', maxWidth: 'var(--ipf-max-search)' }}>
      {items.map((status) => {
        const active = value === status
        return (
          <button
            key={status} type="button" onClick={() => onChange && onChange(status)}
            style={{
              padding: '6px 16px', borderRadius: 'var(--ipf-radius-pill)',
              border: `1px solid ${active ? 'var(--ipf-border-strong)' : 'var(--ipf-border-glass)'}`,
              background: active ? 'var(--ipf-state-active)' : 'var(--ipf-surface-field)',
              color: active ? 'var(--ipf-text-heading)' : 'var(--ipf-text-secondary)',
              fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-label-size)', fontWeight: 600,
              cursor: 'pointer', transition: 'var(--ipf-transition-surface)',
            }}
          >
            {status}
          </button>
        )
      })}
    </div>
  )
}
