export default function GlassPanel({ tone = 'card', radius, padding, blur = true, style = {}, children, ...rest }) {
  const tones = {
    card: { background: 'var(--ipf-surface-glass)', border: '1px solid var(--ipf-border-glass)', boxShadow: 'var(--ipf-shadow-card)', backdropFilter: 'var(--ipf-blur-card)' },
    raised: { background: 'var(--ipf-surface-glass-raised)', border: '1px solid var(--ipf-border-glass)', boxShadow: 'var(--ipf-shadow-search)', backdropFilter: 'var(--ipf-blur-search)' },
    menu: { background: 'var(--ipf-surface-menu)', border: '1px solid var(--ipf-border-glass)', boxShadow: 'var(--ipf-shadow-menu)', backdropFilter: 'var(--ipf-blur-menu)' },
  }
  const t = tones[tone] || tones.card
  return (
    <div
      style={{
        borderRadius: radius ?? (tone === 'menu' ? 'var(--ipf-radius-lg)' : 'var(--ipf-radius-2xl)'),
        padding: padding ?? (tone === 'card' ? 'var(--ipf-card-pad-y) var(--ipf-card-pad-x)' : 'var(--ipf-space-9)'),
        color: 'var(--ipf-text-primary)',
        boxSizing: 'border-box',
        ...t,
        backdropFilter: blur ? t.backdropFilter : 'none',
        WebkitBackdropFilter: blur ? t.backdropFilter : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
