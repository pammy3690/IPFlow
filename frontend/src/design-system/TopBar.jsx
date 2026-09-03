import Icon from './Icon.jsx'

export default function TopBar({ title = 'Dashboard', account = 'Profile', onMenu, onProfile, children }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ipf-space-9)', padding: '0 0 var(--ipf-space-7)', borderBottom: '1px solid var(--ipf-border-glass)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-5)', color: 'var(--ipf-text-heading)' }}>
        <button type="button" onClick={onMenu} style={{ display: 'inline-flex', padding: 0, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
          <Icon name="menu" size={22} title="Sections" />
        </button>
        <span style={{ fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-h2-size)', fontWeight: 600 }}>{title}</span>
      </div>
      {children}
      <button type="button" onClick={onProfile} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ipf-space-3)', padding: '6px 14px 6px 8px', borderRadius: 'var(--ipf-radius-pill)', border: '1px solid var(--ipf-border-glass)', background: 'var(--ipf-surface-field)', color: 'var(--ipf-text-secondary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-sm-size)', fontWeight: 600, cursor: 'pointer' }}>
        <Icon name="square-user-round" size={20} />
        {account}
      </button>
    </header>
  )
}
