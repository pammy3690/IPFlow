import { useEffect, useRef } from 'react'

// Fixed, full-bleed backdrop: a white canvas with three layered blue wave
// bands anchored to the bottom. Each layer drifts on its own CSS animation;
// scrolling adds a small extra offset via --ipf-scroll-x so the motions compose.
export default function WaveBackground({ scrollFactor = 0.4 }) {
  const backRef = useRef(null)
  const midRef = useRef(null)
  const frontRef = useRef(null)

  useEffect(() => {
    let raf = null
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const y = window.scrollY || document.documentElement.scrollTop || 0
        if (backRef.current) backRef.current.style.setProperty('--ipf-scroll-x', `${-y * scrollFactor * 0.35}px`)
        if (midRef.current) midRef.current.style.setProperty('--ipf-scroll-x', `${-y * scrollFactor * 0.65}px`)
        if (frontRef.current) frontRef.current.style.setProperty('--ipf-scroll-x', `${-y * scrollFactor}px`)
        raf = null
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [scrollFactor])

  const waveWrap = { position: 'absolute', left: '-30%', width: '160%' }

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#FFFFFF', pointerEvents: 'none' }}>
      <div ref={backRef} style={{ ...waveWrap, bottom: '-4%', height: '46%', transform: 'translateX(var(--ipf-scroll-x, 0px))' }}>
        <svg viewBox="0 0 2400 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%', animation: 'ipf-wave-drift 26s ease-in-out infinite alternate' }}>
          <path d="M0,220 C 200,160 400,280 600,220 C 800,160 1000,280 1200,220 C 1400,160 1600,280 1800,220 C 2000,160 2200,280 2400,220 L2400,400 L0,400 Z" fill="var(--ipf-sky)" opacity="0.28" />
        </svg>
      </div>
      <div ref={midRef} style={{ ...waveWrap, bottom: '-3%', height: '36%', transform: 'translateX(var(--ipf-scroll-x, 0px))' }}>
        <svg viewBox="0 0 2400 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%', animation: 'ipf-wave-drift 19s ease-in-out infinite alternate-reverse' }}>
          <path d="M0,240 C 250,300 450,180 700,240 C 950,300 1150,180 1400,240 C 1650,300 1850,180 2100,240 C 2250,270 2350,240 2400,240 L2400,400 L0,400 Z" fill="var(--ipf-blue)" opacity="0.32" />
        </svg>
      </div>
      <div ref={frontRef} style={{ ...waveWrap, bottom: '-2%', height: '24%', transform: 'translateX(var(--ipf-scroll-x, 0px))' }}>
        <svg viewBox="0 0 2400 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%', animation: 'ipf-wave-drift 13s ease-in-out infinite alternate' }}>
          <path d="M0,260 C 200,310 400,220 600,260 C 800,310 1000,220 1200,260 C 1400,310 1600,220 1800,260 C 2000,310 2200,220 2400,260 L2400,400 L0,400 Z" fill="var(--ipf-ocean)" opacity="0.9" />
        </svg>
      </div>
    </div>
  )
}
