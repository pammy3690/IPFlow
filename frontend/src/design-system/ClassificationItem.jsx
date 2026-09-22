export default function ClassificationItem({ code = '—', subclass = '—', group, title }) {
  return (
    <div
      title={title || undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-1)', minHeight: 40, padding: 'var(--ipf-field-pad)', borderRadius: 'var(--ipf-radius-md)', background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)', color: 'var(--ipf-text-primary)', fontSize: 'var(--ipf-type-sm-size)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ipf-space-5)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-5)', minWidth: 0 }}>
          <strong style={{ fontFamily: 'var(--ipf-font-mono)', fontSize: 'var(--ipf-type-label-size)', fontWeight: 600 }}>{code}</strong>
          <span style={{ fontFamily: 'var(--ipf-font-mono)', fontSize: 'var(--ipf-type-label-size)', color: 'var(--ipf-text-muted)' }}>{subclass}</span>
        </span>
        {group && (
          <span style={{ flex: '0 0 auto', padding: '4px 12px', borderRadius: 'var(--ipf-radius-pill)', background: 'var(--ipf-surface-glass-raised)', fontFamily: 'var(--ipf-font-mono)', fontSize: 'var(--ipf-type-xs-size)', color: 'var(--ipf-text-muted)' }}>{group}</span>
        )}
      </div>
      {title && (
        <span style={{ fontSize: 'var(--ipf-type-xs-size)', color: 'var(--ipf-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      )}
    </div>
  )
}
