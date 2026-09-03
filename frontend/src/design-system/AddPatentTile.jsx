import Icon from './Icon.jsx'

export default function AddPatentTile({ label = 'Add patent', onClick }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 'var(--ipf-space-5)', minHeight: 180, width: '100%', padding: '22px',
        borderRadius: 'var(--ipf-radius-xl)', background: 'var(--ipf-surface-glass)',
        border: '1px dashed var(--ipf-border-glass)', color: 'var(--ipf-text-secondary)',
        fontFamily: 'var(--ipf-font-sans)', fontSize: 'var(--ipf-type-sm-size)', fontWeight: 600,
        cursor: 'pointer', transition: 'var(--ipf-transition-surface)', boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ipf-state-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ipf-surface-glass)' }}
    >
      <Icon name="plus" size={48} />
      {label}
    </button>
  )
}
