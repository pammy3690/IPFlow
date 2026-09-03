const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// events: { [dayOfMonth]: 'granted' | 'exam' | 'lapsed' } — keys match the
// --ipf-status-* color tokens so the dot always resolves to a real color.
export default function CalendarMonth({ month = '', year, firstWeekday = 0, days = 31, events = {}, selected, onSelect }) {
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-5)', color: 'var(--ipf-text-primary)' }}>
      <div style={{ fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-h3-size)', fontWeight: 600 }}>{month} {year}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 'var(--ipf-space-2)' }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 'var(--ipf-type-xs-size)', fontWeight: 600, color: 'var(--ipf-text-muted)', paddingBottom: 'var(--ipf-space-1)' }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const on = selected === day
          const event = events[day]
          return (
            <button
              key={day} type="button" onClick={() => onSelect && onSelect(day)}
              style={{
                position: 'relative', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--ipf-radius-pill)', border: '1px solid transparent',
                background: on ? 'var(--ipf-sky)' : 'transparent',
                color: on ? 'var(--ipf-navy)' : 'var(--ipf-text-primary)',
                fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-label-size)', fontWeight: on ? 700 : 400,
                cursor: 'pointer', transition: 'var(--ipf-transition-surface)',
              }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent' }}
            >
              {day}
              {event && <span style={{ position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: '50%', background: on ? 'var(--ipf-navy)' : `var(--ipf-status-${event})` }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
