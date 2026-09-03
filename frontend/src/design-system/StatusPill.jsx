export function statusTone(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('grant') || s.includes('active') || s.includes('filed')) return 'success'
  if (s.includes('pend') || s.includes('exam')) return 'pending'
  if (s.includes('expire') || s.includes('lapse') || s.includes('cease') || s.includes('withdraw')) return 'inactive'
  return 'neutral'
}

export default function StatusPill({ status = 'Granted', tone }) {
  const t = tone || statusTone(status)
  const tones = {
    success: { background: 'var(--ipf-status-granted-tint)', color: 'var(--ipf-status-granted-ink)' },
    pending: { background: 'var(--ipf-status-exam-tint)', color: 'var(--ipf-status-exam-ink)' },
    inactive: { background: 'var(--ipf-status-lapsed-tint)', color: 'var(--ipf-status-lapsed-ink)' },
    neutral: { background: 'var(--ipf-status-neutral-tint)', color: 'var(--ipf-status-neutral-ink)' },
  }
  return (
    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 'var(--ipf-radius-pill)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, textTransform: 'capitalize', ...tones[t] }}>
      {status}
    </span>
  )
}
