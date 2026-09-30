import Wave from 'react-wavify'

// Fixed, full-bleed backdrop: a white canvas with three layered blue wave
// bands anchored to the bottom. Each layer animates continuously via
// react-wavify's own animation loop, so the waves move without any scrolling.
export default function WaveBackground() {
  const layerWrap = { position: 'absolute', left: 0, right: 0 }

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#FFFFFF', pointerEvents: 'none' }}>
      <div style={{ ...layerWrap, bottom: '-4%', height: '60%' }}>
        <Wave
          fill="var(--ipf-sky)"
          opacity="0.28"
          style={{ height: '100%' }}
          options={{ height: 150, amplitude: 34, speed: 0.14, points: 5 }}
        />
      </div>
      <div style={{ ...layerWrap, bottom: '-3%', height: '46%' }}>
        <Wave
          fill="var(--ipf-blue)"
          opacity="0.32"
          style={{ height: '100%' }}
          options={{ height: 150, amplitude: 30, speed: 0.2, points: 4 }}
        />
      </div>
      <div style={{ ...layerWrap, bottom: '-2%', height: '32%' }}>
        <Wave
          fill="var(--ipf-ocean)"
          opacity="0.9"
          style={{ height: '100%' }}
          options={{ height: 90, amplitude: 26, speed: 0.28, points: 4 }}
        />
      </div>
    </div>
  )
}
