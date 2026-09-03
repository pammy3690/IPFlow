import Icon from './Icon.jsx'

export default function Button({ variant = 'glass', size = 'md', icon, iconRight, disabled, style = {}, children, ...rest }) {
  const sizes = {
    sm: { padding: '6px 16px', fontSize: 'var(--ipf-type-label-size)' },
    md: { padding: '10px 22px', fontSize: 'var(--ipf-type-sm-size)' },
    lg: { padding: '14px 28px', fontSize: 'var(--ipf-type-body-size)' },
  }
  const variants = {
    glass: { background: 'var(--ipf-surface-field)', border: '1px solid var(--ipf-border-glass)', color: 'var(--ipf-text-secondary)' },
    solid: { background: 'var(--ipf-sky)', border: '1px solid var(--ipf-sky)', color: 'var(--ipf-navy)' },
    active: { background: 'var(--ipf-state-active)', border: '1px solid var(--ipf-border-strong)', color: 'var(--ipf-text-heading)' },
    quiet: { background: 'transparent', border: '1px solid transparent', color: 'var(--ipf-text-muted)' },
  }
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--ipf-space-3)',
        borderRadius: 'var(--ipf-radius-pill)',
        fontFamily: 'var(--ipf-font-sans)', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'var(--ipf-transition-surface)',
        ...sizes[size], ...variants[variant], ...style,
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 18 : 16} />}
    </button>
  )
}
