export default function ExpiryFilter({ active = false, days = 90, onToggle, onDaysChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ipf-space-3)', width: '100%', maxWidth: 'var(--ipf-max-search)' }}>
      <button
        type="button" onClick={onToggle}
        style={{
          padding: '6px 16px', borderRadius: 'var(--ipf-radius-pill)',
          border: `1px solid ${active ? 'var(--ipf-border-strong)' : 'var(--ipf-border-glass)'}`,
          background: active ? 'var(--ipf-state-active)' : 'var(--ipf-surface-field)',
          color: active ? 'var(--ipf-text-heading)' : 'var(--ipf-text-secondary)',
          fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-label-size)', fontWeight: 600,
          cursor: 'pointer', transition: 'var(--ipf-transition-surface)',
        }}
      >
        Expiring soon
      </button>
      {active && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ipf-space-3)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>
          within
          <input
            type="number" min={1} value={days}
            onChange={(e) => onDaysChange && onDaysChange(e.target.value)}
            style={{
              width: 72, padding: '6px 10px', borderRadius: 'var(--ipf-radius-md)',
              border: '1px solid var(--ipf-border-field)', background: 'var(--ipf-surface-field)',
              color: 'var(--ipf-text-primary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-sm-size)',
            }}
          />
          days
        </label>
      )}
    </div>
  )
}
