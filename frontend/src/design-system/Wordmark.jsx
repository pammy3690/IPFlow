import Icon from './Icon.jsx'

export default function Wordmark({ size = 32, color = 'var(--ipf-text-heading)', showMark = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color }}>
      {showMark && <Icon name="book-marked" size={Math.round(size * 1.06)} title="IPFlow" />}
      <span
        style={{
          fontFamily: 'var(--ipf-font-sans)',
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1.2,
          letterSpacing: 'var(--ipf-type-wordmark-track)',
          margin: 0,
        }}
      >
        IPFLOW
      </span>
    </span>
  )
}
