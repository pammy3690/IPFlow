import StatusPill from './StatusPill.jsx'

export default function AssociatedPatentItem({ patentId, title, status, associationType, onSelect }) {
  const Tag = onSelect ? 'button' : 'div'
  return (
    <Tag
      type={onSelect ? 'button' : undefined}
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ipf-space-5)',
        minHeight: 40, padding: 'var(--ipf-field-pad)', borderRadius: 'var(--ipf-radius-md)',
        background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)',
        color: 'var(--ipf-text-primary)', fontSize: 'var(--ipf-type-sm-size)',
        width: '100%', font: 'inherit', textAlign: 'left', cursor: onSelect ? 'pointer' : 'default',
      }}
      onMouseEnter={onSelect ? (e) => { e.currentTarget.style.background = 'var(--ipf-state-hover)' } : undefined}
      onMouseLeave={onSelect ? (e) => { e.currentTarget.style.background = 'var(--ipf-surface-field)' } : undefined}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-5)', minWidth: 0 }}>
        <strong style={{ fontFamily: 'var(--ipf-font-mono)', fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, flex: '0 0 auto' }}>#{patentId}</strong>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: title ? 'var(--ipf-text-primary)' : 'var(--ipf-text-placeholder)' }}>
          {title || 'Untitled patent'}
        </span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-5)', flex: '0 0 auto' }}>
        {associationType && (
          <span style={{ padding: '4px 12px', borderRadius: 'var(--ipf-radius-pill)', background: 'var(--ipf-surface-glass-raised)', fontFamily: 'var(--ipf-font-mono)', fontSize: 'var(--ipf-type-xs-size)', color: 'var(--ipf-text-muted)' }}>
            {associationType}
          </span>
        )}
        {status && <StatusPill status={status} />}
      </span>
    </Tag>
  )
}
