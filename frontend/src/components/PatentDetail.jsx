import { FileSearch } from 'lucide-react'

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function statusTone(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('grant') || s.includes('active')) return 'success'
  if (s.includes('pend') || s.includes('exam')) return 'pending'
  if (s.includes('expire') || s.includes('lapse') || s.includes('cease') || s.includes('withdraw'))
    return 'inactive'
  return 'neutral'
}

function Field({ label, value, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      <span className="field__box">{value || <span className="field__placeholder">—</span>}</span>
    </label>
  )
}

export default function PatentDetail({ patent, loading }) {
  if (loading) {
    return (
      <div className="card card--empty">
        <p>Loading patent…</p>
      </div>
    )
  }

  if (!patent) {
    return (
      <div className="card card--empty">
        <FileSearch size={36} strokeWidth={1.25} />
        <p>Search for a patent above to see its details here.</p>
      </div>
    )
  }

  const tone = statusTone(patent.status)

  return (
    <div className="card">
      <Field label="Title" value={patent.title} className="field--title" />

      <div className="field-row field-row--four">
        <Field label="Patent Number" value={patent.patent_id} />
        <Field label="Expiry" value={formatDate(patent.expiry_date)} />
        <Field label="Publication Date" value={formatDate(patent.publication_date)} />
        <Field label="Filing" value={formatDate(patent.filing_date)} />
      </div>

      <div className="field-row field-row--status">
        <label className="field">
          <span className="field__label">Status</span>
          <span className="field__box">
            {patent.status ? (
              <span className={`status-pill status-pill--${tone}`}>{patent.status}</span>
            ) : (
              <span className="field__placeholder">—</span>
            )}
          </span>
        </label>
        <Field label="Inventor Name" value={patent.inventor_name} className="field--wide" />
      </div>

      <label className="field field--abstract">
        <span className="field__label">Abstract</span>
        <span className="field__box field__box--abstract">
          {patent.abstract || <span className="field__placeholder">No abstract available.</span>}
          {patent.image_url && (
            <img className="abstract__image" src={patent.image_url} alt="Patent figure" />
          )}
        </span>
      </label>
    </div>
  )
}
