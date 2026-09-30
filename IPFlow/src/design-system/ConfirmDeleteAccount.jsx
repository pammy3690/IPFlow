import { useState } from 'react'
import GlassPanel from './GlassPanel.jsx'
import Button from './Button.jsx'
import Icon from './Icon.jsx'

export default function ConfirmDeleteAccount({ email, loading, error, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('')
  const canConfirm = confirmText.trim().toLowerCase() === 'delete'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.45)', padding: 24 }}>
      <GlassPanel tone="raised" style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 18, padding: '32px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ipf-text-danger)' }}>
          <Icon name="triangle-alert" size={22} />
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--ipf-font-sans)' }}>Delete account</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ipf-text-secondary)', lineHeight: 1.5 }}>
          This permanently deletes the account for <strong>{email}</strong> and all its saved patents. This cannot be undone.
        </p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>Type DELETE to confirm</span>
          <input
            autoFocus
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 'var(--ipf-radius-md)', boxSizing: 'border-box',
              background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)',
              color: 'var(--ipf-text-primary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 14, outline: 'none',
            }}
            value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE"
          />
        </label>
        {error && <span style={{ fontSize: 13, color: 'var(--ipf-text-danger)' }}>{error}</span>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button type="button" variant="glass" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button
            type="button" variant="solid" disabled={!canConfirm || loading} onClick={onConfirm}
            style={{ background: 'var(--ipf-text-danger)', border: '1px solid var(--ipf-text-danger)', color: '#fff' }}
          >
            {loading ? 'Deleting…' : 'Delete my account'}
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
