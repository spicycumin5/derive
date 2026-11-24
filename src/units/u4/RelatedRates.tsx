import { useState } from 'react'
import { Curve, Dot, Graph, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Group, PlayButton, Readout, Seg, Slider, Tex, usePlayer } from '../../components/ui'
import { fmt } from '../../lib/numeric'

type Scene = 'ladder' | 'cone' | 'ripple'

/* ---------- Ladder ---------- */
const LAD = 10
function ladder(t: number, rate: number) {
  const x = Math.min(2 + rate * t, 9.95)
  const y = Math.sqrt(LAD * LAD - x * x)
  const dydt = (-x * rate) / y
  return { x, y, dydt }
}
/* ---------- Cone (vertex down), filled at dV/dt ---------- */
const R = 4
const H = 10
function cone(t: number, rate: number) {
  const V = rate * t + 0.01
  const k = Math.PI * (R / H) ** 2
  const h = Math.min(Math.cbrt((3 * V) / k), H)
  const r = (R / H) * h
  const dhdt = rate / (k * h * h)
  return { V, h, r, dhdt }
}
/* ---------- Ripple ---------- */
function ripple(t: number, rate: number) {
  const r = rate * t
  return { r, A: Math.PI * r * r, dAdt: 2 * Math.PI * r * rate }
}

function SceneSVG({ scene, t, rate }: { scene: Scene; t: number; rate: number }) {
  const S = 26 // px per unit
  if (scene === 'ladder') {
    const { x, y, dydt } = ladder(t, rate)
    const ox = 80
    const oy = 300
    return (
      <svg viewBox="-40 0 460 330" style={{ width: '100%', height: '100%' }} role="img" aria-label="Ladder sliding down a wall">
        <rect x={ox - 14} y={20} width={14} height={oy - 20} fill="var(--grid-major)" />
        <line x1={ox - 14} x2={400} y1={oy} y2={oy} stroke="var(--muted)" strokeWidth={3} />
        <line x1={ox + x * S} y1={oy} x2={ox} y2={oy - y * S} stroke="var(--f)" strokeWidth={8} strokeLinecap="round" />
        <line x1={ox} x2={ox + x * S} y1={oy + 16} y2={oy + 16} stroke="var(--fp)" strokeWidth={2} />
        <text x={ox + (x * S) / 2} y={oy + 32} fill="var(--fp)" fontWeight={800} textAnchor="middle" fontSize={15}>
          x = {fmt(x, 2)} ft
        </text>
        <line x1={ox - 24} x2={ox - 24} y1={oy} y2={oy - y * S} stroke="var(--fpp)" strokeWidth={2} />
        <text x={ox - 30} y={oy - (y * S) / 2} fill="var(--fpp)" fontWeight={800} fontSize={15} textAnchor="end">
          y = {fmt(y, 2)}
        </text>
        <text x={ox + (x * S) / 2 + 14} y={oy - (y * S) / 2 + 4} fill="var(--f)" fontWeight={800} fontSize={15}>
          10 ft
        </text>
        <text x={ox + x * S + 8} y={oy - 10} fill="var(--fp)" fontWeight={700} fontSize={14}>
          → {fmt(rate, 2)} ft/s
        </text>
        <text x={ox + 8} y={oy - y * S - 6} fill="var(--hot)" fontWeight={700} fontSize={14}>
          ↓ {fmt(-dydt, 2)} ft/s
        </text>
      </svg>
    )
  }
  if (scene === 'cone') {
    const { h, r } = cone(t, rate)
    const cx = 210
    const top = 30
    const tip = top + H * S
    return (
      <svg viewBox="0 0 420 330" style={{ width: '100%', height: '100%' }} role="img" aria-label="Water filling a cone">
        <polygon points={`${cx},${tip} ${cx - r * S},${tip - h * S} ${cx + r * S},${tip - h * S}`} fill="color-mix(in srgb, var(--f) 45%, transparent)" />
        <ellipse cx={cx} cy={tip - h * S} rx={r * S} ry={r * 4} fill="color-mix(in srgb, var(--f) 60%, transparent)" />
        <polygon points={`${cx},${tip} ${cx - R * S},${top} ${cx + R * S},${top}`} fill="none" stroke="var(--ink)" strokeWidth={2.5} />
        <ellipse cx={cx} cy={top} rx={R * S} ry={R * 4} fill="none" stroke="var(--ink)" strokeWidth={2} />
        <line x1={cx + R * S + 20} x2={cx + R * S + 20} y1={tip} y2={tip - h * S} stroke="var(--fpp)" strokeWidth={2.5} />
        <text x={cx + R * S + 28} y={tip - (h * S) / 2} fill="var(--fpp)" fontWeight={800} fontSize={15}>
          h = {fmt(h, 2)}
        </text>
        <line x1={cx} x2={cx + r * S} y1={tip - h * S} y2={tip - h * S} stroke="var(--fp)" strokeWidth={2.5} />
        <text x={cx + (r * S) / 2} y={tip - h * S - 8} fill="var(--fp)" fontWeight={800} fontSize={14} textAnchor="middle">
          r
        </text>
        <text x={cx - R * S - 10} y={top + 6} fill="var(--muted)" fontWeight={700} fontSize={13} textAnchor="end">
          R = 4, H = 10
        </text>
      </svg>
    )
  }
  const { r } = ripple(t, rate)
  return (
    <svg viewBox="-210 -165 420 330" style={{ width: '100%', height: '100%' }} role="img" aria-label="Expanding circular ripple">
      {[0.25, 0.5, 0.75].map((k) => (
        <circle key={k} r={Math.max(0, r * k * 12)} fill="none" stroke="var(--f)" strokeOpacity={0.25} strokeWidth={2} />
      ))}
      <circle r={r * 12} fill="var(--area)" stroke="var(--f)" strokeWidth={3} />
      <line x1={0} y1={0} x2={r * 12} y2={0} stroke="var(--fp)" strokeWidth={2.5} />
      <text x={(r * 12) / 2} y={-8} fill="var(--fp)" fontWeight={800} textAnchor="middle" fontSize={15}>
        r = {fmt(r, 2)}
      </text>
      <circle r={4} fill="var(--hot)" />
    </svg>
  )
}

export default function RelatedRates() {
  const [scene, setScene] = useState<Scene>('ladder')
  const [t, setT] = useState(0)
  const [rate, setRate] = useState(1)
  const Tmax = scene === 'ladder' ? (9.95 - 2) / rate : scene === 'cone' ? ((Math.PI * (R / H) ** 2 * H ** 3) / 3 - 0.01) / (rate * 6) : 12 / rate
  const rateFor = scene === 'cone' ? rate * 6 : rate
  const [playing, toggle] = usePlayer(() => t, setT, { from: 0, to: Tmax, seconds: 8 })
  const tc = Math.min(t, Tmax)

  const series = (s: number) =>
    scene === 'ladder' ? -ladder(s, rateFor).dydt : scene === 'cone' ? cone(s, rateFor).dhdt : ripple(s, rateFor).dAdt
  const cur = series(tc)
  const Y: V2 =
    scene === 'ladder' ? [0, Math.min(10, Math.max(2, series(Tmax * 0.98) * 1.1))] : scene === 'cone' ? [0, Math.min(4, series(Tmax * 0.05) * 1.1)] : [0, series(Tmax) * 1.1]

  let rows: [string, string][] = []
  let eq = ''
  let eqd = ''
  let sub = ''
  if (scene === 'ladder') {
    const { x, y, dydt } = ladder(tc, rateFor)
    rows = [
      ['x (ft)', fmt(x, 3)],
      ['y (ft)', fmt(y, 3)],
      ['dx/dt (ft/s)', fmt(rateFor, 3)],
      ['dy/dt (ft/s)', fmt(dydt, 3)],
    ]
    eq = 'x^2+y^2=100'
    eqd = '2x\\frac{dx}{dt}+2y\\frac{dy}{dt}=0'
    sub = `\\frac{dy}{dt}=-\\frac{x}{y}\\frac{dx}{dt}=-\\frac{${fmt(x, 2)}}{${fmt(y, 2)}}(${fmt(rateFor, 2)})=${fmt(dydt, 3)}`
  } else if (scene === 'cone') {
    const { V, h, r, dhdt } = cone(tc, rateFor)
    rows = [
      ['V (ft³)', fmt(V, 3)],
      ['h (ft)', fmt(h, 3)],
      ['r (ft)', fmt(r, 3)],
      ['dV/dt (ft³/s)', fmt(rateFor, 3)],
      ['dh/dt (ft/s)', fmt(dhdt, 4)],
    ]
    eq = 'V=\\tfrac13\\pi r^2h,\\ r=\\tfrac{2}{5}h \\Rightarrow V=\\tfrac{4\\pi}{75}h^3'
    eqd = '\\frac{dV}{dt}=\\tfrac{4\\pi}{25}h^2\\frac{dh}{dt}'
    sub = `\\frac{dh}{dt}=\\frac{${fmt(rateFor, 2)}}{\\tfrac{4\\pi}{25}(${fmt(h, 2)})^2}=${fmt(dhdt, 4)}`
  } else {
    const { r, A, dAdt } = ripple(tc, rateFor)
    rows = [
      ['r (cm)', fmt(r, 3)],
      ['A (cm²)', fmt(A, 3)],
      ['dr/dt (cm/s)', fmt(rateFor, 3)],
      ['dA/dt (cm²/s)', fmt(dAdt, 3)],
    ]
    eq = 'A=\\pi r^2'
    eqd = '\\frac{dA}{dt}=2\\pi r\\frac{dr}{dt}'
    sub = `\\frac{dA}{dt}=2\\pi(${fmt(r, 2)})(${fmt(rateFor, 2)})=${fmt(dAdt, 3)}`
  }

  const yName = scene === 'ladder' ? 'speed the top falls, |dy/dt|' : scene === 'cone' ? 'dh/dt' : 'dA/dt'
  const caption =
    scene === 'ladder'
      ? 'The bottom slides out at a steady rate, but the top falls faster and faster.'
      : scene === 'cone'
        ? 'The water is poured in at a steady rate, but the level rises more slowly as the cone widens.'
        : 'The radius grows at a steady rate, but the area grows faster and faster.'

  return (
    <ToolLayout
      stage={
        <>
          <div className="graph" style={{ flex: '1.6 1 0', display: 'grid', placeItems: 'center', padding: 12 }}>
            <SceneSVG scene={scene} t={tc} rate={rateFor} />
          </div>
          <Graph small x={[0, Tmax]} y={Y} label={<span className="c-hot">{yName} over time</span>}>
            <Curve f={series} color="var(--hot)" domain={[0, Tmax * 0.995]} />
            <VLine x={tc} color="var(--ink)" dashed={false} weight={1} />
            <Dot x={tc} y={cur} />
          </Graph>
        </>
      }
      controls={
        <>
          <Group title="Scene">
            <Seg<Scene>
              value={scene}
              onChange={(s) => {
                setScene(s)
                setT(0)
              }}
              options={[
                { value: 'ladder', label: 'Sliding ladder' },
                { value: 'cone', label: 'Filling cone' },
                { value: 'ripple', label: 'Ripple' },
              ]}
            />
            <p className="c-muted" style={{ margin: 0, fontSize: 'var(--fs-s)' }}>
              {caption}
            </p>
          </Group>
          <Group title="Time and the given rate">
            <Slider label="t (s)" value={tc} min={0} max={Tmax} step={Tmax / 500} onChange={setT} />
            <Slider
              label={scene === 'ladder' ? 'dx/dt' : scene === 'cone' ? 'dV/dt' : 'dr/dt'}
              value={rate}
              min={0.25}
              max={2}
              step={0.05}
              onChange={(v) => {
                setRate(v)
                setT(0)
              }}
              format={() => fmt(rateFor, 2)}
            />
            <PlayButton playing={playing} onClick={toggle} label="Run" />
          </Group>
          <Group title="Solution">
            <div style={{ fontSize: 'var(--fs-s)', display: 'grid', gap: 8, overflowX: 'auto' }}>
              <div>
                1. Relate: <Tex>{eq}</Tex>
              </div>
              <div>
                2. Differentiate with respect to t: <Tex>{eqd}</Tex>
              </div>
              <div>
                3. Substitute now: <Tex>{sub}</Tex>
              </div>
            </div>
            <Readout rows={rows} />
          </Group>
        </>
      }
    />
  )
}
