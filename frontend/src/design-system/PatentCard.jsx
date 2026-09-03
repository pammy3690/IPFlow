import StatusPill from './StatusPill.jsx'
import Icon from './Icon.jsx'

export default function PatentCard({ title = 'Untitled patent', patentId, status, renewalDate, abstract, saved, onSave, onDetails }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-5)',
        padding: '22px', borderRadius: 'var(--ipf-radius-xl)',
        background: 'var(--ipf-surface-glass)', border: '1px solid var(--ipf-border-glass)',
        backdropFilter: 'var(--ipf-blur-card)', WebkitBackdropFilter: 'var(--ipf-blur-card)',
        boxShadow: 'var(--ipf-shadow-search)', color: 'var(--ipf-text-primary)', boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--ipf-space-5)' }}>
        <span style={{ fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-h3-size)', fontWeight: 600, lineHeight: 1.25 }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-3)', flex: '0 0 auto' }}>
          {status && <StatusPill status={status} />}
          {onSave && (
            <button
              type="button" onClick={onSave} disabled={saved}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--ipf-space-2)',
                padding: '5px 14px', borderRadius: 'var(--ipf-radius-pill)',
                border: `1px solid ${saved ? 'var(--ipf-border-strong)' : 'var(--ipf-border-glass)'}`,
                background: saved ? 'var(--ipf-state-active)' : 'var(--ipf-surface-field)',
                color: saved ? 'var(--ipf-text-heading)' : 'var(--ipf-text-secondary)',
                fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-xs-size)', fontWeight: 600,
                cursor: saved ? 'default' : 'pointer', transition: 'var(--ipf-transition-surface)',
              }}
            >
              <Icon name={saved ? 'check' : 'bookmark-plus'} size={13} />
              {saved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
      </div>
      {patentId && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ipf-space-3)', fontSize: 'var(--ipf-type-xs-size)', color: 'var(--ipf-text-muted)' }}>
          <span>#{patentId}</span>
        </div>
      )}
      {renewalDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-3)', padding: '8px 12px', borderRadius: 'var(--ipf-radius-sm)', background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)', fontSize: 'var(--ipf-type-label-size)' }}>
          <Icon name="calendar-clock" size={16} color="var(--ipf-sky)" />
          <span>Expires · {renewalDate}</span>
        </div>
      )}
      {abstract && (
        <p style={{ margin: 0, fontSize: 'var(--ipf-type-sm-size)', lineHeight: 'var(--ipf-line-relaxed)', color: 'var(--ipf-text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{abstract}</p>
      )}
      <button
        type="button" onClick={onDetails}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 'var(--ipf-space-2)', padding: 0, border: 'none', background: 'transparent', color: 'var(--ipf-sky)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, cursor: 'pointer' }}
      >
        Details <Icon name="arrow-up-right" size={14} />
      </button>
    </div>
  )
}
