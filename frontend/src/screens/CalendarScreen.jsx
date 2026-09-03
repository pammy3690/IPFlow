import { useState } from 'react'
import { formatDate } from '../lib/formatDate.js'
import { statusTone } from '../design-system/StatusPill.jsx'
import GlassPanel from '../design-system/GlassPanel.jsx'
import CalendarMonth from '../design-system/CalendarMonth.jsx'
import MaintenanceTimeline from '../design-system/MaintenanceTimeline.jsx'
import Wordmark from '../design-system/Wordmark.jsx'

const TONE_TO_EVENT = { success: 'granted', pending: 'exam', inactive: 'lapsed' }
const DAYS_IN_MONTH = (y, m) => new Date(y, m + 1, 0).getDate()
// CalendarMonth's grid is Monday-first; JS getDay() is Sunday-first (0-6).
const MONDAY_FIRST = (jsDay) => (jsDay + 6) % 7

export default function CalendarScreen({ account, patents, onOpen }) {
  const now = new Date()
  const [day, setDay] = useState(now.getDate())

  const events = {}
  patents.forEach((p) => {
    if (!p.expiry_date) return
    const d = new Date(p.expiry_date)
    if (Number.isNaN(d.getTime())) return
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return
    const key = TONE_TO_EVENT[statusTone(p.status)]
    if (key) events[d.getDate()] = key
  })

  const upcoming = patents.filter((p) => p.expiry_date).slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Wordmark size={16} />
        <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--ipf-text-heading)' }}>{account} · Patents</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
        <GlassPanel padding={26} radius={28}>
          <CalendarMonth
            month={now.toLocaleDateString(undefined, { month: 'long' })}
            year={now.getFullYear()}
            firstWeekday={MONDAY_FIRST(new Date(now.getFullYear(), now.getMonth(), 1).getDay())}
            days={DAYS_IN_MONTH(now.getFullYear(), now.getMonth())}
            events={events}
            selected={day}
            onSelect={setDay}
          />
        </GlassPanel>
        <GlassPanel padding={26} radius={28} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>{now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          {upcoming.length ? (
            <MaintenanceTimeline
              items={upcoming.map((p) => ({ id: p.patent_id, title: p.title, action: 'Renewal due', date: formatDate(p.expiry_date), status: p.status }))}
              onSelect={(item) => onOpen(patents.find((p) => p.patent_id === item.id))}
            />
          ) : (
            <span style={{ fontSize: 14, color: 'var(--ipf-text-secondary)' }}>No upcoming renewals on record.</span>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}
