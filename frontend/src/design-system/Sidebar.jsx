import Wordmark from './Wordmark.jsx'
import Icon from './Icon.jsx'

export const IPFLOW_NAV = [
  { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
  { id: 'external', label: 'External', icon: 'globe' },
  { id: 'internal', label: 'Internal', icon: 'building-2' },
  { id: 'comparison', label: 'Comparison', icon: 'columns-2' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
]

export default function Sidebar({ items = IPFLOW_NAV, active = 'overview', onSelect, width = 236 }) {
  return (
    <nav
      style={{
        width, flex: `0 0 ${typeof width === 'number' ? width + 'px' : width}`, boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-9)',
        padding: '24px var(--ipf-space-7)',
        background: 'var(--ipf-surface-glass)', borderRight: '1px solid var(--ipf-border-glass)',
        backdropFilter: 'var(--ipf-blur-card)', WebkitBackdropFilter: 'var(--ipf-blur-card)',
      }}
    >
      <Wordmark size={20} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-1)' }}>
        {items.map((item) => {
          const on = item.id === active
          return (
            <button
              key={item.id} type="button" onClick={() => onSelect && onSelect(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-4)',
                padding: '10px 14px', borderRadius: 'var(--ipf-radius-sm)', border: 'none',
                background: on ? 'var(--ipf-state-active)' : 'transparent',
                color: on ? 'var(--ipf-text-heading)' : 'var(--ipf-text-secondary)',
                fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-sm-size)',
                fontWeight: on ? 600 : 400, textAlign: 'left', cursor: 'pointer',
                transition: 'var(--ipf-transition-surface)',
              }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
