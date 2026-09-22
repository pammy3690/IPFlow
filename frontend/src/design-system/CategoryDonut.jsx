const RAMP = ['var(--ipf-sky)', 'var(--ipf-blue)', 'var(--ipf-ocean)', 'var(--ipf-navy)', 'var(--ipf-mist)']

export default function CategoryDonut({ data = [], size = 168, thickness = 26, label }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  let acc = 0
  const segments = data.map((d, i) => {
    const dash = (d.value / total) * circumference
    const offset = -(acc / total) * circumference
    acc += d.value
    return { ...d, color: d.color || RAMP[i % RAMP.length], dash, offset }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-10)', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {segments.length === 0 ? (
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--ipf-surface-field)" strokeWidth={thickness} />
          ) : (
            segments.map((s) => (
              <circle
                key={s.label}
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={s.color} strokeWidth={thickness}
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={s.offset}
              >
                <title>{s.title ? `${s.label} — ${s.title} (${s.value})` : `${s.label} (${s.value})`}</title>
              </circle>
            ))
          )}
        </svg>
        <div style={{ position: 'absolute', inset: thickness, borderRadius: '50%', background: 'var(--ipf-surface-menu)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ipf-text-primary)', pointerEvents: 'none' }}>
          <span style={{ fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-h2-size)', fontWeight: 600 }}>{data.length ? total : 0}</span>
          <span style={{ fontSize: 'var(--ipf-type-xs-size)', color: 'var(--ipf-text-muted)' }}>patents</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-3)' }}>
        {label && <span style={{ fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>{label}</span>}
        {data.length === 0 && <span style={{ fontSize: 'var(--ipf-type-sm-size)', color: 'var(--ipf-text-muted)' }}>No classification data yet.</span>}
        {data.map((d, i) => (
          <span
            key={d.label}
            title={d.title || undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--ipf-space-3)', fontSize: 'var(--ipf-type-label-size)', color: 'var(--ipf-text-primary)', cursor: d.title ? 'help' : 'default' }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color || RAMP[i % RAMP.length] }} />
            {d.label}
            <span style={{ color: 'var(--ipf-text-muted)' }}>{d.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
