import { useState } from 'react'
import Icon from './Icon.jsx'

export default function TopBar({ title = 'Dashboard', account = 'Profile', onMenu, onProfile, onDeleteAccount, children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ipf-space-9)', padding: '0 0 var(--ipf-space-7)', borderBottom: '1px solid var(--ipf-border-glass)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-5)', color: 'var(--ipf-text-heading)' }}>
        <button type="button" onClick={onMenu} style={{ display: 'inline-flex', padding: 0, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
          <Icon name="menu" size={22} title="Sections" />
        </button>
        <span style={{ fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-h2-size)', fontWeight: 600 }}>{title}</span>
      </div>
      {children}
      <div style={{ position: 'relative' }}>
        <button
          type="button" onClick={() => setMenuOpen((open) => !open)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ipf-space-3)', padding: '6px 14px 6px 8px', borderRadius: 'var(--ipf-radius-pill)', border: '1px solid var(--ipf-border-glass)', background: 'var(--ipf-surface-field)', color: 'var(--ipf-text-secondary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-sm-size)', fontWeight: 600, cursor: 'pointer' }}
        >
          <Icon name="square-user-round" size={20} />
          {account}
        </button>
        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setMenuOpen(false)} />
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 21, minWidth: 200,
                borderRadius: 'var(--ipf-radius-lg)', background: 'var(--ipf-surface-menu)', border: '1px solid var(--ipf-border-glass)',
                backdropFilter: 'var(--ipf-blur-menu)', WebkitBackdropFilter: 'var(--ipf-blur-menu)',
                boxShadow: 'var(--ipf-shadow-menu)', padding: 'var(--ipf-space-2)', display: 'flex', flexDirection: 'column',
              }}
            >
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onProfile && onProfile() }}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-3)', width: '100%', padding: '10px 12px', border: 'none', borderRadius: 'var(--ipf-radius-sm)', background: 'transparent', color: 'var(--ipf-text-heading)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-sm-size)', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <Icon name="log-out" size={16} /> Sign out
              </button>
              {onDeleteAccount && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onDeleteAccount() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-3)', width: '100%', padding: '10px 12px', border: 'none', borderRadius: 'var(--ipf-radius-sm)', background: 'transparent', color: 'var(--ipf-text-danger)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-sm-size)', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Icon name="trash-2" size={16} /> Delete account
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
