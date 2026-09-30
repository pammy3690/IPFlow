import { useMemo, useState } from 'react'
import { formatDate } from '../lib/formatDate.js'
import { statusTone } from '../design-system/StatusPill.jsx'
import GlassPanel from '../design-system/GlassPanel.jsx'
import CalendarMonth from '../design-system/CalendarMonth.jsx'
import MaintenanceTimeline from '../design-system/MaintenanceTimeline.jsx'
import Wordmark from '../design-system/Wordmark.jsx'
import Button from '../design-system/Button.jsx'

const TONE_TO_EVENT = { success: 'granted', pending: 'exam', inactive: 'lapsed' }
const DAYS_IN_MONTH = (y, m) => new Date(y, m + 1, 0).getDate()
// CalendarMonth's grid is Monday-first; JS getDay() is Sunday-first (0-6).
const MONDAY_FIRST = (jsDay) => (jsDay + 6) % 7

export default function CalendarScreen({ account, patents, onOpen }) {
  const now = new Date()
  const [day, setDay] = useState(now.getDate())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [listView, setListView] = useState('month')

  function changeMonth(delta) {
    let nextMonth = viewMonth + delta
    let nextYear = viewYear
    if (nextMonth < 0) { nextMonth = 11; nextYear -= 1 }
    if (nextMonth > 11) { nextMonth = 0; nextYear += 1 }
    setViewMonth(nextMonth)
    setViewYear(nextYear)
    setDay(1)
  }

  const events = useMemo(() => {
    const map = {}
    patents.forEach((p) => {
      if (!p.expiry_date) return
      const d = new Date(p.expiry_date)
      if (Number.isNaN(d.getTime())) return
      if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) return
      const tone = TONE_TO_EVENT[statusTone(p.status)]
      if (!tone) return
      const key = d.getDate()
      if (!map[key]) map[key] = []
      map[key].push({ id: p.patent_id, title: p.title, tone })
    })
    return map
  }, [patents, viewYear, viewMonth])

  const dated = useMemo(() => {
    return patents
      .filter((p) => p.expiry_date && !Number.isNaN(new Date(p.expiry_date).getTime()))
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
  }, [patents])

  const monthPatents = useMemo(() => (
    dated.filter((p) => {
      const d = new Date(p.expiry_date)
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth
    })
  ), [dated, viewYear, viewMonth])

  const viewDate = new Date(viewYear, viewMonth, 1)
  const listItems = listView === 'month' ? monthPatents : dated

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Wordmark size={16} />
        <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--ipf-text-heading)' }}>{account} · Patents</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
        <GlassPanel padding={26} radius={28}>
          <CalendarMonth
            month={viewDate.toLocaleDateString(undefined, { month: 'long' })}
            year={viewYear}
            firstWeekday={MONDAY_FIRST(new Date(viewYear, viewMonth, 1).getDay())}
            days={DAYS_IN_MONTH(viewYear, viewMonth)}
            events={events}
            selected={day}
            onSelect={setDay}
            onOpenPatent={(id) => onOpen(patents.find((p) => p.patent_id === id))}
            onPrevMonth={() => changeMonth(-1)}
            onNextMonth={() => changeMonth(1)}
          />
        </GlassPanel>
        <GlassPanel padding={26} radius={28} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>
            {listView === 'month'
              ? viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
              : 'All upcoming renewals'}
          </span>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {listItems.length ? (
              <MaintenanceTimeline
                items={listItems.map((p) => ({ id: p.patent_id, title: p.title, action: 'Renewal due', date: formatDate(p.expiry_date), status: p.status }))}
                onSelect={(item) => onOpen(patents.find((p) => p.patent_id === item.id))}
              />
            ) : (
              <span style={{ fontSize: 14, color: 'var(--ipf-text-secondary)' }}>
                {listView === 'month' ? 'No renewals due this month.' : 'No upcoming renewals on record.'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--ipf-border-glass)', paddingTop: 14 }}>
            {[['month', 'This month'], ['all', 'All patents']].map(([id, label]) => (
              <Button key={id} size="sm" variant={listView === id ? 'active' : 'quiet'} onClick={() => setListView(id)} style={{ flex: 1, justifyContent: 'center' }}>
                {label}
              </Button>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
