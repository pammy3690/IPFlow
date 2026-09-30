import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate } from '../lib/formatDate.js'
import { fetchIpcTitleMap, resolveIpcTitle } from '../lib/ipcTitles.js'
import GlassPanel from './GlassPanel.jsx'
import Field from './Field.jsx'
import StatusPill from './StatusPill.jsx'
import ClassificationItem from './ClassificationItem.jsx'
import AssociatedPatentItem from './AssociatedPatentItem.jsx'

export default function PatentDetail({ patent, onSelect }) {
  const [classifications, setClassifications] = useState([])
  const [classificationLoading, setClassificationLoading] = useState(false)
  const [associations, setAssociations] = useState([])
  const [associationsLoading, setAssociationsLoading] = useState(false)

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
      .then(async ({ data, error }) => {
        if (!live) return
        if (error) console.error('Failed to fetch classifications:', error)
        const rows = data || []
        const titleMap = await fetchIpcTitleMap(rows)
        if (!live) return
        setClassifications(rows.map((c) => ({ ...c, title: resolveIpcTitle(c, titleMap) })))
        setClassificationLoading(false)
      })
    return () => { live = false }
  }, [patent?.patent_id])

  useEffect(() => {
    if (!patent?.patent_id) {
      setAssociations([])
      return
    }
    let live = true
    setAssociationsLoading(true)
    supabase
      .from('patent_associations')
      .select('*')
      .or(`patent_id.eq.${patent.patent_id},associated_patent_id.eq.${patent.patent_id}`)
      .then(async ({ data, error }) => {
        if (!live) return
        if (error) console.error('Failed to fetch patent associations:', error)

        // Associations can be recorded from either side (and re-fetched from
        // IPONZ on both patents), so the same related patent can show up more
        // than once here — collapse to one row per other-patent id.
        const byOtherId = new Map()
        for (const row of data || []) {
          const otherId = row.patent_id === patent.patent_id ? row.associated_patent_id : row.patent_id
          if (otherId == null || otherId === patent.patent_id) continue
          if (!byOtherId.has(otherId)) byOtherId.set(otherId, row.association_type)
        }

        if (byOtherId.size === 0) {
          if (live) { setAssociations([]); setAssociationsLoading(false) }
          return
        }

        const otherIds = [...byOtherId.keys()]
        const { data: relatedPatents, error: relatedError } = await supabase
          .from('patents')
          .select('patent_id, title, status')
          .in('patent_id', otherIds)
        if (!live) return
        if (relatedError) console.error('Failed to fetch associated patents:', relatedError)

        const patentById = new Map((relatedPatents || []).map((p) => [p.patent_id, p]))
        setAssociations(otherIds.map((id) => ({
          patent_id: id,
          association_type: byOtherId.get(id),
          title: patentById.get(id)?.title ?? null,
          status: patentById.get(id)?.status ?? null,
        })))
        setAssociationsLoading(false)
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
            {classifications.map((c, i) => <ClassificationItem key={i} code={c.class} subclass={c.subclass} group={c.ipc_group} title={c.title} />)}
          </div>
        ) : (
          <div style={{ padding: 'var(--ipf-field-pad)', minHeight: 40, display: 'flex', alignItems: 'center', borderRadius: 'var(--ipf-radius-md)', background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)' }}>
            <span style={{ color: 'var(--ipf-text-placeholder)', fontSize: 'var(--ipf-type-sm-size)' }}>No classification available.</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-3)' }}>
        <span style={{ fontSize: 'var(--ipf-type-label-size)', fontWeight: 600, color: 'var(--ipf-text-secondary)' }}>Associated Patents</span>
        {associationsLoading ? (
          <div style={{ padding: 'var(--ipf-field-pad)', color: 'var(--ipf-text-muted)', fontSize: 'var(--ipf-type-sm-size)' }}>Loading associated patents…</div>
        ) : associations.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ipf-space-3)' }}>
            {associations.map((a) => (
              <AssociatedPatentItem
                key={a.patent_id}
                patentId={a.patent_id}
                title={a.title}
                status={a.status}
                associationType={a.association_type}
                onSelect={onSelect ? () => onSelect(a.patent_id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: 'var(--ipf-field-pad)', minHeight: 40, display: 'flex', alignItems: 'center', borderRadius: 'var(--ipf-radius-md)', background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-field)' }}>
            <span style={{ color: 'var(--ipf-text-placeholder)', fontSize: 'var(--ipf-type-sm-size)' }}>No associated patents available.</span>
          </div>
        )}
      </div>
    </GlassPanel>
  )
}
