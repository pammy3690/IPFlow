import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import Wordmark from '../design-system/Wordmark.jsx'
import GlassPanel from '../design-system/GlassPanel.jsx'
import Button from '../design-system/Button.jsx'
import Icon from '../design-system/Icon.jsx'

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 'var(--ipf-radius-md)',
  background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)',
  color: 'var(--ipf-text-primary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 14, outline: 'none',
}

export default function SignInScreen({ onGuest }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }
    setLoading(true)
    setError(null)
    setInfo(null)

    if (mode === 'reset') {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      setLoading(false)
      if (authError) {
        setError(authError.message)
        return
      }
      setInfo('Check your inbox for a link to reset your password.')
      return
    }

    if (mode === 'create') {
      const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { name, organisation } } })
      setLoading(false)
      if (authError) {
        setError(authError.message)
        return
      }
      // Supabase doesn't return an error for a duplicate email (to avoid leaking
      // which addresses are registered) — instead it returns a user with no identities.
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists. Try signing in instead.')
        return
      }
      setInfo('Check your inbox to confirm your account, then sign in.')
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    // A successful sign-in flips the app's auth state via onAuthStateChange.
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36, padding: '56px 24px' }}>
      <Wordmark />
      <GlassPanel style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 20, padding: '36px 34px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {mode !== 'reset' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {[['signin', 'Sign in'], ['create', 'Create account']].map(([id, label]) => (
                <Button key={id} type="button" size="sm" variant={mode === id ? 'active' : 'quiet'} onClick={() => { setMode(id); setError(null); setInfo(null) }}>{label}</Button>
              ))}
            </div>
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>Work email</span>
            <input style={inputStyle} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </label>
          {mode === 'create' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>Full name</span>
              <input style={inputStyle} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
            </label>
          )}
          {mode === 'create' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>Organisation</span>
              <input style={inputStyle} value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="AUT Ventures" />
            </label>
          )}
          {mode !== 'reset' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>Password</span>
              <input style={inputStyle} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
          )}
          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => { setMode('reset'); setError(null); setInfo(null) }}
              style={{ alignSelf: 'flex-start', border: 'none', background: 'transparent', color: 'var(--ipf-text-secondary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Forgot password?
            </button>
          )}
          {error && <span style={{ fontSize: 13, color: 'var(--ipf-text-danger)' }}>{error}</span>}
          {info && <span style={{ fontSize: 13, color: 'var(--ipf-text-secondary)' }}>{info}</span>}
          <Button type="submit" variant="solid" size="lg" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'create' ? 'Create account' : 'Send reset link'}
          </Button>
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setInfo(null) }}
              style={{ alignSelf: 'center', border: 'none', background: 'transparent', color: 'var(--ipf-text-secondary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              ← Back to sign in
            </button>
          )}
        </form>
        <button
          type="button" onClick={onGuest}
          style={{ border: 'none', background: 'transparent', color: 'var(--ipf-text-secondary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
        >
          Continue without an account →
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ipf-text-muted)' }}>
          <Icon name="shield-check" size={14} /> Patent records are synced from the IPONZ register.
        </span>
      </GlassPanel>
    </div>
  )
}
