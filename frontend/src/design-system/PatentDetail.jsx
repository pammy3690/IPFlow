import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate } from '../lib/formatDate.js'
import GlassPanel from './GlassPanel.jsx'
import Field from './Field.jsx'
import StatusPill from './StatusPill.jsx'
import ClassificationItem from './ClassificationItem.jsx'

export default function PatentDetail({ patent }) {
  const [classifications, setClassifications] = useState([])
  const [classificationLoading, setClassificationLoading] = useState(false)

  useEffect(() => {
    if (!patent?.patent_id) {
      setClassifications([])
      return
    }
    let live = true
    setClassificationLoading(true)
    supabase
      .from('patent_classification')
      .select('*')
      .eq('patent_id', patent.patent_id)
      .then(({ data, error }) => {
        if (!live) return
        if (error) console.error('Failed to fetch classifications:', error)
        setClassifications(data || [])
        setClassificationLoading(false)
      })
    return () => { live = false }
  }, [patent?.patent_id])

  if (!patent) return null

  return (
    <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-10)', width: '100%', maxWidth: 'var(--ipf-max-content)' }}>
      <Field label="Title" value={patent.title} />
      <div style={{ display: 'grid', gap: 'var(--ipf-space-9)', gridTemplateColumns: 'repeat(4,1fr)' }}>
        <Field label="Patent Number" value={patent.patent_id} />
        <Field label="Expiry" value={formatDate(patent.expiry_date)} />
        <Field label="Publication Date" value={formatDate(patent.publication_date)} />
        <Field label="Filing" value={formatDate(patent.filing_date)} />
      </div>
      <div style={{ display: 'grid', gap: 'var(--ipf-space-9)', gridTemplateColumns: '1fr 2fr' }}>
        <Field label="Status">{patent.status ? <StatusPill status={patent.status} /> : <span style={{ color: 'var(--ipf-text-placeholder)' }}>—</span>}</Field>
        <Field label="Inventor Name" value={patent.inventor_name} />
      </div>
      <Field label="Abstract" variant="abstract" value={patent.abstract || <span style={{ color: 'var(--ipf-text-placeholder)' }}>No abstract available.</span>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-3)' }}>
        <span style={{ fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>IPC Classification</span>
        {classificationLoading ? (
          <div style={{ padding: 'var(--ipf-field-pad)', color: 'var(--ipf-text-muted)', fontSize: 'var(--ipf-type-sm-size)' }}>Loading classifications…</div>
        ) : classifications.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-3)' }}>
            {classifications.map((c, i) => <ClassificationItem key={i} code={c.class} subclass={c.subclass} group={c.ipc_group} />)}
          </div>
        ) : (
          <div style={{ padding: 'var(--ipf-field-pad)', minHeight: 40, display: 'flex', alignItems: 'center', borderRadius: 'var(--ipf-radius-md)', background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)' }}>
            <span style={{ color: 'var(--ipf-text-placeholder)', fontSize: 'var(--ipf-type-sm-size)' }}>No classification available.</span>
          </div>
        )}
      </div>
    </GlassPanel>
  )
}
