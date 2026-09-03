const RAMP = ['var(--ipf-sky)', 'var(--ipf-blue)', 'var(--ipf-ocean)', 'var(--ipf-navy)', 'var(--ipf-mist)']

export default function CategoryDonut({ data = [], size = 168, thickness = 26, label }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  let acc = 0
  const stops = data.map((d, i) => {
    const from = (acc / total) * 360
    acc += d.value
    const to = (acc / total) * 360
    return `${d.color || RAMP[i % RAMP.length]} ${from}deg ${to}deg`
  }).join(',')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-10)', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto', borderRadius: '50%', background: data.length ? `conic-gradient(${stops})` : 'var(--ipf-surface-field)' }}>
        <div style={{ position: 'absolute', inset: thickness, borderRadius: '50%', background: 'var(--ipf-surface-menu)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ipf-text-primary)' }}>
          <span style={{ fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-h2-size)', fontWeight: 600 }}>{data.length ? total : 0}</span>
          <span style={{ fontSize: 'var(--ipf-type-xs-size)', color: 'var(--ipf-text-muted)' }}>patents</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-3)' }}>
        {label && <span style={{ fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>{label}</span>}
        {data.length === 0 && <span style={{ fontSize: 'var(--ipf-type-sm-size)', color: 'var(--ipf-text-muted)' }}>No classification data yet.</span>}
        {data.map((d, i) => (
          <span key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-3)', fontSize: 'var(--ipf-type-label-size)', color: 'var(--ipf-text-primary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color || RAMP[i % RAMP.length] }} />
            {d.label}
            <span style={{ color: 'var(--ipf-text-muted)' }}>{d.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
