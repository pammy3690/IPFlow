import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import Wordmark from '../design-system/Wordmark.jsx'
import GlassPanel from '../design-system/GlassPanel.jsx'
import Button from '../design-system/Button.jsx'

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 'var(--ipf-radius-md)',
  background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)',
  color: 'var(--ipf-text-primary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 14, outline: 'none',
}

export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setDone(true)
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36, padding: '56px 24px' }}>
      <Wordmark />
      <GlassPanel style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 20, padding: '36px 34px' }}>
        {done ? (
          <>
            <span style={{ fontSize: 14, color: 'var(--ipf-text-secondary)' }}>Your password has been updated.</span>
            <Button type="button" variant="solid" size="lg" onClick={onDone} style={{ justifyContent: 'center' }}>Continue</Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ipf-text-heading)' }}>Choose a new password</span>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>New password</span>
              <input style={inputStyle} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>Confirm password</span>
              <input style={inputStyle} type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {error && <span style={{ fontSize: 13, color: 'var(--ipf-text-danger)' }}>{error}</span>}
            <Button type="submit" variant="solid" size="lg" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? 'Please wait…' : 'Update password'}
            </Button>
          </form>
        )}
      </GlassPanel>
    </div>
  )
}
