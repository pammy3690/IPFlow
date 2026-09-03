import StatusPill from './StatusPill.jsx'
import Icon from './Icon.jsx'

export default function MaintenanceTimeline({ items = [], onSelect }) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-3)' }}>
      {items.map((item, i) => (
        <li key={item.id ?? i}>
          <button
            type="button" onClick={() => onSelect && onSelect(item)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-5)', width: '100%',
              padding: '12px 16px', borderRadius: 'var(--ipf-radius-md)',
              background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)',
              color: 'var(--ipf-text-primary)', textAlign: 'left', cursor: 'pointer',
              fontFamily: 'var(--ipf-font-sans)', transition: 'var(--ipf-transition-surface)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ipf-surface-field)' }}
          >
            <Icon name="calendar-clock" size={18} color="var(--ipf-sky)" />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 auto', minWidth: 0 }}>
              <span style={{ fontSize: 'var(--ipf-type-sm-size)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
              <span style={{ fontSize: 'var(--ipf-type-xs-size)', color: 'var(--ipf-text-muted)' }}>{item.action || 'Renewal due'} · {item.date}</span>
            </span>
            {item.status && <StatusPill status={item.status} />}
          </button>
        </li>
      ))}
    </ol>
  )
}
