import { formatDate } from '../lib/formatDate.js'
import PatentCard from '../design-system/PatentCard.jsx'
import AddPatentTile from '../design-system/AddPatentTile.jsx'
import GlassPanel from '../design-system/GlassPanel.jsx'
import MaintenanceTimeline from '../design-system/MaintenanceTimeline.jsx'
import Button from '../design-system/Button.jsx'

export default function DashboardScreen({ account, savedPatents, loading, savedIds, onSave, onOpen, onAdd, onOpenCalendar }) {
  const saved = savedPatents
  const shown = saved
  const upcoming = saved.filter((p) => p.expiry_date).slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 600, color: 'var(--ipf-text-heading)' }}>Hello, {account}</h2>
        <span style={{ fontSize: 13, color: 'var(--ipf-text-muted)' }}>
          {saved.length} saved {saved.length === 1 ? 'patent' : 'patents'} · {upcoming.length} upcoming renewals
        </span>
      </div>

      {loading ? (
        <span style={{ fontSize: 14, color: 'var(--ipf-text-secondary)' }}>Loading patents…</span>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, alignItems: 'stretch' }}>
          {shown.map((p) => (
            <PatentCard
              key={p.patent_id}
              title={p.title}
              patentId={p.patent_id}
              status={p.status}
              renewalDate={formatDate(p.expiry_date)}
              abstract={p.abstract}
              saved={savedIds.includes(p.patent_id)}
              onSave={() => onSave(p.patent_id)}
              onDetails={() => onOpen(p)}
            />
          ))}
          <AddPatentTile onClick={onAdd} />
        </div>
      )}

      <GlassPanel padding={28} radius={28} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>Upcoming renewals</span>
          <Button variant="quiet" size="sm" iconRight="arrow-up-right" onClick={onOpenCalendar}>Open calendar</Button>
        </div>
        {upcoming.length ? (
          <MaintenanceTimeline
            items={upcoming.map((p) => ({ id: p.patent_id, title: p.title, action: 'Renewal due', date: formatDate(p.expiry_date), status: p.status }))}
            onSelect={(item) => onOpen(saved.find((p) => p.patent_id === item.id))}
          />
        ) : (
          <span style={{ fontSize: 14, color: 'var(--ipf-text-secondary)' }}>No upcoming renewals on record.</span>
        )}
      </GlassPanel>
    </div>
  )
}
