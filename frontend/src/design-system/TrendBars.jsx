export default function TrendBars({ data = [], height = 180, color = 'var(--ipf-sky)', label }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-5)' }}>
      {label && <span style={{ fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>{label}</span>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--ipf-space-3)', height, borderBottom: '1px solid var(--ipf-border-glass)', paddingBottom: 'var(--ipf-space-3)' }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--ipf-space-2)', height: '100%' }} title={`${d.label}: ${d.value}`}>
            <div style={{ width: '100%', height: `${(d.value / max) * 100}%`, minHeight: 3, borderRadius: '6px 6px 2px 2px', background: d.color || color }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 'var(--ipf-space-3)' }}>
        {data.map((d) => (
          <span key={d.label} style={{ flex: '1 1 0', textAlign: 'center', fontSize: 'var(--ipf-type-xs-size)', color: 'var(--ipf-text-muted)' }}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}
