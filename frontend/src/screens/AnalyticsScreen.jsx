import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import GlassPanel from '../design-system/GlassPanel.jsx'
import TrendBars from '../design-system/TrendBars.jsx'
import CategoryDonut from '../design-system/CategoryDonut.jsx'
import StatusPill from '../design-system/StatusPill.jsx'

const MONTH_LABEL = { month: 'short' }

function buildRenewalTrend(patents) {
  const now = new Date()
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, MONTH_LABEL), value: 0 }
  })
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]))
  patents.forEach((p) => {
    if (!p.expiry_date) return
    const d = new Date(p.expiry_date)
    if (Number.isNaN(d.getTime())) return
    const bucket = byKey[`${d.getFullYear()}-${d.getMonth()}`]
    if (bucket) bucket.value += 1
  })
  return buckets
}

export default function AnalyticsScreen({ patents }) {
  const [classifications, setClassifications] = useState([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let live = true
    supabase.from('patent_classification').select('class').then(({ data, error }) => {
      if (!live) return
      if (error || !data) {
        setClassifications([])
        setLoading(false)
        return
      }
      const counts = {}
      data.forEach((row) => { if (row.class) counts[row.class] = (counts[row.class] || 0) + 1 })
      setClassifications(Object.entries(counts).map(([label, value]) => ({ label, value })))
      setLoading(false)
    })
    return () => { live = false }
  }, [])

  const counts = patents.reduce((acc, p) => {
    if (!p.status) return acc
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})
  const renewals = buildRenewalTrend(patents)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0, fontSize: 36, fontWeight: 100, letterSpacing: '-0.08px', color: 'var(--ipf-text-heading)' }}>Viewing Insights</h2>
      <GlassPanel padding={28} radius={28}>
        <TrendBars label="Renewals due over the next 12 months" data={renewals} height={200} />
      </GlassPanel>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        <GlassPanel padding={28} radius={28}>
          {loading ? (
            <span style={{ fontSize: 14, color: 'var(--ipf-text-secondary)' }}>Loading classifications…</span>
          ) : (
            <CategoryDonut label="IPC classification spread of the portfolio" data={classifications} />
          )}
        </GlassPanel>
        <GlassPanel padding={28} radius={28} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>Portfolio by status</span>
          {Object.keys(counts).length === 0 && <span style={{ fontSize: 14, color: 'var(--ipf-text-secondary)' }}>No patents on record.</span>}
          {Object.entries(counts).map(([status, n]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <StatusPill status={status} />
              <span style={{ fontSize: 20, fontWeight: 600 }}>{n}</span>
            </div>
          ))}
        </GlassPanel>
      </div>
    </div>
  )
}
