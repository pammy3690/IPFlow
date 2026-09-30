export default function Field({ label, value, variant = 'default', children, style = {} }) {
  const abstract = variant === 'abstract'
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-3)', minWidth: 0, ...style }}>
      <span style={{ fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>{label}</span>
      <span
        style={{
          display: 'flex', alignItems: abstract ? 'flex-start' : 'center',
          minHeight: 40, height: abstract ? 220 : undefined,
          padding: 'var(--ipf-field-pad)', borderRadius: 'var(--ipf-radius-md)',
          background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)',
          color: 'var(--ipf-text-primary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-sm-size)',
          lineHeight: abstract ? 'var(--ipf-line-relaxed)' : undefined,
          whiteSpace: abstract ? 'pre-wrap' : undefined, overflowY: abstract ? 'auto' : undefined,
          overflowWrap: 'anywhere', boxSizing: 'border-box',
        }}
      >
        {children ?? value ?? <span style={{ color: 'var(--ipf-text-placeholder)' }}>—</span>}
      </span>
    </label>
  )
}
