import { useState } from 'react'
import Icon from './Icon.jsx'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const navButtonStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28, borderRadius: 'var(--ipf-radius-pill)',
  border: '1px solid transparent', background: 'transparent',
  color: 'var(--ipf-text-secondary)', cursor: 'pointer', transition: 'var(--ipf-transition-surface)',
}

// events: { [dayOfMonth]: Array<{ id, title, tone }> } — tone matches the
// --ipf-status-* color tokens so the dot always resolves to a real color.
export default function CalendarMonth({
  month = '', year, firstWeekday = 0, days = 31, events = {}, selected, onSelect,
  onOpenPatent, onPrevMonth, onNextMonth,
}) {
  const [hoveredDay, setHoveredDay] = useState(null)
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-5)', color: 'var(--ipf-text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button" onClick={onPrevMonth} aria-label="Previous month" style={navButtonStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <Icon name="chevron-left" size={16} />
        </button>
        <div style={{ fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-h3-size)', fontWeight: 600 }}>{month} {year}</div>
        <button
          type="button" onClick={onNextMonth} aria-label="Next month" style={navButtonStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 'var(--ipf-space-2)' }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 'var(--ipf-type-xs-size)', fontWeight: 600, color: 'var(--ipf-text-muted)', paddingBottom: 'var(--ipf-space-1)' }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const on = selected === day
          const dayEvents = events[day] || []
          const hasEvents = dayEvents.length > 0
          return (
            <div
              key={day} style={{ position: 'relative' }}
              onMouseEnter={() => { if (hasEvents) setHoveredDay(day) }}
              onMouseLeave={() => setHoveredDay((cur) => (cur === day ? null : cur))}
            >
              <button
                type="button" onClick={() => onSelect && onSelect(day)}
                style={{
                  position: 'relative', width: '100%', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                {hasEvents && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      if (dayEvents.length === 1) onOpenPatent && onOpenPatent(dayEvents[0].id)
                      else setHoveredDay(day)
                    }}
                    style={{
                      position: 'absolute', bottom: 4, width: 6, height: 6, borderRadius: '50%',
                      background: on ? 'var(--ipf-navy)' : `var(--ipf-status-${dayEvents[0].tone})`,
                      cursor: 'pointer',
                    }}
                  />
                )}
              </button>
              {hoveredDay === day && hasEvents && (
                <div
                  style={{
                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                    marginBottom: 6, zIndex: 20, minWidth: 180, maxWidth: 240,
                    background: 'var(--ipf-surface-panel, var(--ipf-surface-field))',
                    border: '1px solid var(--ipf-border-glass)', borderRadius: 'var(--ipf-radius-md)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.28)', padding: 'var(--ipf-space-3)',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}
                >
                  {dayEvents.map((ev) => (
                    <button
                      key={ev.id} type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenPatent && onOpenPatent(ev.id) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent',
                        color: 'var(--ipf-text-primary)', fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-xs-size)',
                        fontWeight: 600, cursor: 'pointer', padding: '4px 2px', borderRadius: 'var(--ipf-radius-sm, 6px)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      {ev.title || ev.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
